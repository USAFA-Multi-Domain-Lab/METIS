import { describe, expect, test } from '@jest/globals'
import {
  assertMigratedResources,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000060.helpers'
import type {
  TMigratedResource,
  TPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000060.helpers'
import { runDatabaseBuild } from 'tests/helpers/projects/unit/migrations/database-build.helpers'

describe('build_000060 database migration', () => {
  test('adds an empty description to every resource and keeps its other fields', () => {
    let mission = createPreMigrationMission()
    let { missionUpdateOne } = runBuild([mission])

    expect(missionUpdateOne).toHaveBeenCalledTimes(1)

    let [filter, payload] = missionUpdateOne.mock.calls[0]
    expect(filter).toEqual({ _id: 'mission-1' })
    assertMigratedResources(payload.$set.resources, mission)
  })

  test('sets only the resources on the mission', () => {
    let { missionUpdateOne } = runBuild([createPreMigrationMission()])

    let [, payload] = missionUpdateOne.mock.calls[0]
    expect(Object.keys(payload)).toEqual(['$set'])
    expect(Object.keys(payload.$set)).toEqual(['resources'])
  })

  test('migrates every mission, including one marked deleted', () => {
    let activeMission = createPreMigrationMission('mission-1')
    let deletedMission = createPreMigrationMission('mission-2', {
      deleted: true,
    })
    let { missionFind, missionUpdateOne } = runBuild([
      activeMission,
      deletedMission,
    ])

    expect(missionFind).toHaveBeenCalledWith({})
    expect(missionUpdateOne).toHaveBeenCalledTimes(2)

    let [firstFilter, firstPayload] = missionUpdateOne.mock.calls[0]
    let [secondFilter, secondPayload] = missionUpdateOne.mock.calls[1]
    expect(firstFilter).toEqual({ _id: 'mission-1' })
    assertMigratedResources(firstPayload.$set.resources, activeMission)
    expect(secondFilter).toEqual({ _id: 'mission-2' })
    assertMigratedResources(secondPayload.$set.resources, deletedMission)
  })

  test('sets the schema build number to 60', () => {
    let { infosUpdateOne } = runBuild([createPreMigrationMission()])

    expect(infosUpdateOne).toHaveBeenCalledTimes(1)
    expect(infosUpdateOne).toHaveBeenCalledWith(
      {},
      { $set: { schemaBuildNumber: 60 } },
    )
  })
})

function runBuild(missions: TPreMigrationMission[]) {
  return runDatabaseBuild<TPreMigrationMission, TMissionUpdate>(60, missions)
}

type TMissionUpdate = {
  $set: { resources: TMigratedResource[] }
}
