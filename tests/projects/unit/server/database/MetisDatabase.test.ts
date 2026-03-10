import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { MetisDatabase } from '@server/database/MetisDatabase'
import { MissionModel } from '@server/database/models/missions'
import { databaseLogger } from '@server/logging'
import { MissionImport } from '@server/missions/imports/MissionImport'
import { User } from '@shared/users/User'

jest.mock('@server/missions/imports/MissionImport', () => ({
  MissionImport: jest.fn(),
}))

jest.mock('@server/database/models/missions', () => ({
  MissionModel: {
    find: jest.fn(),
  },
}))

jest.mock('@server/logging', () => ({
  databaseLogger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}))

describe('MetisDatabase.ensureDefaultMissionsExists', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('accepts the current seeded mission name after importing defaults', async () => {
    let missionModelFind = jest.mocked(MissionModel.find)

    missionModelFind
      .mockReturnValueOnce({
        exec: jest.fn(async () => []),
      } as any)
      .mockReturnValueOnce({
        exec: jest.fn(async () => [
          {
            _id: 'mission-1',
            name: 'METIS Demo Mission',
          },
        ]),
      } as any)

    jest.mocked(MissionImport).mockImplementation(
      () =>
        ({
          execute: jest.fn(async () => undefined),
          results: {
            failedImportCount: 0,
            failedImportErrorMessages: [],
            successfulImportCount: 1,
          },
        }) as any,
    )

    let metisDatabase = new MetisDatabase({
      fileStore: {},
    } as any)

    await expect(
      (metisDatabase as any).ensureDefaultMissionsExists(),
    ).resolves.toBeUndefined()

    expect(MissionImport).toHaveBeenCalledWith(
      {
        name: 'default.metis',
        originalName: 'default.metis',
        path: 'server/database/seeding/default.metis',
      },
      {},
      {
        _id: User.SYSTEM_ID,
        username: User.SYSTEM_USERNAME,
      },
    )

    expect(databaseLogger.info).toHaveBeenCalledWith(
      'Default mission created: { _id: mission-1, name: METIS Demo Mission }',
    )
  })
})
