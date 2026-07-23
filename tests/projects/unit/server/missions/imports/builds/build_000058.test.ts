import { describe, expect, jest, test } from '@jest/globals'

// Replace the logging module so the import build's unresolved-reference
// warnings are captured without loading the server.
jest.mock('@server/logging', () => ({
  databaseLogger: { warn: jest.fn() },
}))

import { databaseLogger } from '@server/logging'
import build_000058 from '@server/missions/imports/builds/build_000058'
import {
  assertMigratedArguments,
  assertNoUnresolvedReport,
  assertUnresolvedReport,
  createFullyResolvedMission,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000058.helpers'

describe('build_000058 import migration', () => {
  test('migrates effect args in place and reports unresolved references', () => {
    let warn = jest.mocked(databaseLogger.warn)
    warn.mockClear()
    let missionData = createPreMigrationMission()
    let rootEffect = missionData.effects[0]

    build_000058(missionData)

    // The build mutates the supplied mission in place: the very effect object it
    // was handed now carries the converted arguments and no longer carries args,
    // rather than being replaced by a new object.
    expect(rootEffect).not.toHaveProperty('args')
    expect(Array.isArray(rootEffect.arguments)).toBe(true)
    assertMigratedArguments(missionData)

    expect(warn).toHaveBeenCalledTimes(1)
    assertUnresolvedReport(String(warn.mock.calls[0][0]))
  })

  test('emits no unresolved-reference report when every reference resolves', () => {
    let warn = jest.mocked(databaseLogger.warn)
    warn.mockClear()
    let missionData = createFullyResolvedMission()

    build_000058(missionData)

    expect(warn).not.toHaveBeenCalled()
    assertNoUnresolvedReport('')
  })
})
