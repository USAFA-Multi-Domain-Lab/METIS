import { describe, expect, test } from '@jest/globals'
import build_000060 from '@server/missions/imports/builds/build_000060'
import {
  assertMigratedResources,
  createPreMigrationMission,
} from 'tests/helpers/projects/unit/migrations/build_000060.helpers'

describe('build_000060 import migration', () => {
  test('adds an empty description to every resource and keeps its other fields', async () => {
    let missionData = createPreMigrationMission()

    // Clone the mission before the import build mutates it.
    let originalMission = structuredClone(missionData)

    await build_000060(missionData)

    assertMigratedResources(missionData.resources, originalMission)
  })

  test('leaves the rest of the mission untouched', async () => {
    let missionData = createPreMigrationMission()

    // Clone the mission before the import build mutates it.
    let originalMission = structuredClone(missionData)

    await build_000060(missionData)

    // Swap the original resources back in, so any other difference fails.
    let missionWithOriginalResources = {
      ...missionData,
      resources: originalMission.resources,
    }
    expect(missionWithOriginalResources).toEqual(originalMission)
  })
})
