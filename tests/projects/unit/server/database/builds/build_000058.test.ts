import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import path from 'path'
import {
  assertMigratedArguments,
  assertNoUnresolvedReport,
  assertUnresolvedReport,
  createFullyResolvedMission,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000058.helpers'
import type { TPreMigrationMission } from 'tests/helpers/projects/unit/migrations/build_000058.helpers'

const BUILD_FILE_PATH = path.resolve(
  process.cwd(),
  'server/database/builds/build_000058.js',
)
const mongoshGlobals = global as typeof globalThis & Partial<TMongoshGlobals>

describe('build_000058 database migration', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    Reflect.deleteProperty(mongoshGlobals, 'db')
    Reflect.deleteProperty(mongoshGlobals, 'print')
    Reflect.deleteProperty(mongoshGlobals, 'use')
  })

  test('migrates effect args and reports unresolved references', () => {
    let { missionUpdateOne, infosUpdateOne, printLines } = runBuild(
      createPreMigrationMission(),
    )

    // The rewritten forces and effects are written back for the mission in a
    // single $set keyed by its _id.
    expect(missionUpdateOne).toHaveBeenCalledTimes(1)
    let [filter, payload] = missionUpdateOne.mock.calls[0]
    expect(filter).toEqual({ _id: 'mission-1' })
    expect(payload.$set).toHaveProperty('forces')
    expect(payload.$set).toHaveProperty('effects')

    assertMigratedArguments({
      effects: payload.$set.effects,
      forces: payload.$set.forces,
    })
    assertUnresolvedReport(printLines.join('\n'))

    // The schema build number is stamped once.
    expect(infosUpdateOne).toHaveBeenCalledTimes(1)
    expect(infosUpdateOne).toHaveBeenCalledWith(
      {},
      { $set: { schemaBuildNumber: 58 } },
    )
  })

  test('emits no unresolved-reference report when every reference resolves', () => {
    let { printLines } = runBuild(createFullyResolvedMission())

    assertNoUnresolvedReport(printLines.join('\n'))
  })

  // KNOWN GAP (currently failing): the build writes each mission individually
  // and stamps schemaBuildNumber only at the end, with no transaction. If a run
  // is interrupted after some missions are written, the build number stays at 57
  // and the runner re-runs build 58 over the whole collection — including the
  // already-migrated missions. Those effects no longer have an `args` field, so
  // `Object.entries(effect.args)` runs on undefined and throws, leaving the
  // migration unable to complete or retry. The build should skip or safely
  // no-op an already-migrated mission instead. See the "resumability" Medium
  // finding in the effect-migrations report.
  test('is resumable: re-running over an already-migrated mission does not throw', () => {
    let original = createPreMigrationMission()

    // First pass migrates the mission and writes it back.
    let firstRun = runBuild(original)
    let [, firstPayload] = firstRun.missionUpdateOne.mock.calls[0]

    // Reconstruct the mission as the database now holds it after the first
    // pass: effects in the `arguments` shape with `args` removed. This is what
    // an interrupted-then-restarted migration reads back for those missions.
    let alreadyMigratedMission: TPreMigrationMission = {
      _id: original._id,
      resources: original.resources,
      forces: firstPayload.$set.forces,
      effects: firstPayload.$set.effects,
    }

    expect(() => runBuild(alreadyMigratedMission)).not.toThrow()
  })
})

function runBuild(mission: TPreMigrationMission) {
  // Clone the mission before the build mutates it in place.
  let cursorMission = structuredClone(mission)
  let missionUpdateOne = jest.fn<TMissionUpdateOne>()
  let infosUpdateOne = jest.fn<TInfosUpdateOne>()
  let printLines: string[] = []

  mongoshGlobals.use = jest.fn()
  mongoshGlobals.print = jest.fn((line?: unknown) => {
    printLines.push(String(line))
  })
  mongoshGlobals.db = {
    missions: {
      find: jest.fn(() => createCursor([cursorMission])),
      updateOne: missionUpdateOne,
    },
    infos: {
      updateOne: infosUpdateOne,
    },
  }

  // This build runs on require, so set the mongosh globals first.
  jest.isolateModules(() => {
    require(BUILD_FILE_PATH)
  })

  return { missionUpdateOne, infosUpdateOne, printLines }
}

function createCursor<T>(items: T[]) {
  let index = 0

  return {
    hasNext: () => index < items.length,
    next: () => items[index++],
  }
}

type TMissionUpdateOne = (
  filter: { _id: string },
  payload: { $set: Pick<TPreMigrationMission, 'forces' | 'effects'> },
) => void

type TInfosUpdateOne = (
  filter: Record<string, never>,
  payload: { $set: { schemaBuildNumber: number } },
) => void

interface TMongoshGlobals {
  use: ReturnType<typeof jest.fn>
  print: ReturnType<typeof jest.fn>
  db: {
    missions: {
      find: ReturnType<typeof jest.fn>
      updateOne: ReturnType<typeof jest.fn>
    }
    infos: {
      updateOne: ReturnType<typeof jest.fn>
    }
  }
}
