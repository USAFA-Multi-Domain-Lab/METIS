import { describe, expect, test } from '@jest/globals'
import {
  assertMigratedArguments,
  assertNoUnresolvedReport,
  assertUnresolvedReport,
  createFullyResolvedMission,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000058.helpers'
import type { TPreMigrationMission } from 'tests/helpers/projects/unit/migrations/build_000058.helpers'
import { runDatabaseBuild } from 'tests/helpers/projects/unit/migrations/database-build.helpers'

describe('build_000058 database migration', () => {
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
  return runDatabaseBuild<TPreMigrationMission, TMissionUpdate>(58, [mission])
}

type TMissionUpdate = {
  $set: Pick<TPreMigrationMission, 'forces' | 'effects'>
}
