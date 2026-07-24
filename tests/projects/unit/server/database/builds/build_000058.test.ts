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
