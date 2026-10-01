import { jest } from '@jest/globals'
import path from 'path'

const mongoshGlobals = global as typeof globalThis & Partial<TMongoshGlobals>

/**
 * Runs a database build script against mocked mongosh globals. A build runs
 * as soon as it is required and reads `use`, `print`, and `db` as globals,
 * so they are installed first and removed once it finishes, leaving nothing
 * behind for the next test.
 * @param buildNumber The number of the build to run, such as 60.
 * @param missions The missions the build's cursor hands out. They are
 * cloned first, so the fixtures passed in stay as they were.
 * @returns The mocks the build called, the lines it printed, and the
 * cloned missions as the build left them.
 */
export function runDatabaseBuild<TMission, TMissionUpdate>(
  buildNumber: number,
  missions: TMission[],
): TDatabaseBuildResult<TMission, TMissionUpdate> {
  let buildFileName = `build_${String(buildNumber).padStart(6, '0')}.js`
  let buildFilePath = path.resolve(
    process.cwd(),
    'server/database/builds',
    buildFileName,
  )
  // Clone the missions before the build mutates them in place.
  let cursorMissions = structuredClone(missions)
  let missionFind = jest.fn<TMissionFind<TMission>>(() =>
    createCursor(cursorMissions),
  )
  let missionUpdateOne = jest.fn<TMissionUpdateOne<TMissionUpdate>>()
  let infosUpdateOne = jest.fn<TInfosUpdateOne>()
  let printLines: string[] = []

  mongoshGlobals.use = jest.fn()
  mongoshGlobals.print = jest.fn((line?: unknown) => {
    printLines.push(String(line))
  })
  mongoshGlobals.db = {
    missions: {
      find: missionFind,
      updateOne: missionUpdateOne,
    },
    infos: {
      updateOne: infosUpdateOne,
    },
  }

  try {
    jest.isolateModules(() => {
      require(buildFilePath)
    })
  } finally {
    Reflect.deleteProperty(mongoshGlobals, 'db')
    Reflect.deleteProperty(mongoshGlobals, 'print')
    Reflect.deleteProperty(mongoshGlobals, 'use')
  }

  return {
    missionFind,
    missionUpdateOne,
    infosUpdateOne,
    printLines,
    missions: cursorMissions,
  }
}

/**
 * Creates a stand-in for a mongosh cursor, which a build walks
 * with `hasNext` and `next` rather than iterating.
 * @param items The items the cursor hands out, in order.
 */
function createCursor<T>(items: T[]): TCursor<T> {
  let index = 0

  return {
    hasNext: () => index < items.length,
    next: () => items[index++],
  }
}

/* -- TYPES -- */

/**
 * What {@link runDatabaseBuild} hands back for a test to check.
 */
export interface TDatabaseBuildResult<TMission, TMissionUpdate> {
  /**
   * The mock behind `db.missions.find`.
   */
  missionFind: ReturnType<typeof jest.fn<TMissionFind<TMission>>>
  /**
   * The mock behind `db.missions.updateOne`, whose calls hold
   * each mission's filter and update payload.
   */
  missionUpdateOne: ReturnType<
    typeof jest.fn<TMissionUpdateOne<TMissionUpdate>>
  >
  /**
   * The mock behind `db.infos.updateOne`, which a build calls
   * to record its schema build number.
   */
  infosUpdateOne: ReturnType<typeof jest.fn<TInfosUpdateOne>>
  /**
   * Every line the build printed, in order.
   */
  printLines: string[]
  /**
   * The cloned missions, as the build left them after
   * mutating them in place.
   */
  missions: TMission[]
}

/**
 * A mongosh cursor, as far as a build uses one.
 */
interface TCursor<T> {
  hasNext: () => boolean
  next: () => T
}

type TMissionFind<TMission> = (
  filter: Record<string, never>,
) => TCursor<TMission>

type TMissionUpdateOne<TMissionUpdate> = (
  filter: { _id: string },
  payload: TMissionUpdate,
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
