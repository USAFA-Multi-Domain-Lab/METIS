import { describe, expect, jest, test } from '@jest/globals'
import { ServerMission } from '@server/missions/ServerMission'
import { readFileSync } from 'fs'
import { join } from 'path'

// Break the database/import module graph that would otherwise be
// pulled in (and cause a circular initialization) when importing
// ServerMission in isolation.
jest.mock('@server/database/models/missions', () => ({
  MissionModel: { find: jest.fn() },
}))
jest.mock('@server/missions/imports/MissionImport', () => ({
  MissionImport: jest.fn(),
}))
jest.mock('@server/logging', () => ({
  databaseLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  targetEnvLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

/**
 * Builds a copy of the given mission containing only the given force,
 * mirroring the single-player realm-minting path in `SessionServer`.
 */
function mintForceMission(
  template: ServerMission,
  forceId: string,
): ServerMission {
  return ServerMission.fromSaveJson(
    template.toSaveJson({
      forceExposure: { expose: 'force-with-all-nodes', forceId },
      fileExposure: { expose: 'accessible', forceId },
      rootEffectsExposure: { expose: 'all' },
    }),
  )
}

let fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/tests-mission.import.json'), 'utf8'),
)

describe('Single-player realm minting (force stripping)', () => {
  test('the fixture template has multiple forces', () => {
    let template = ServerMission.fromSaveJson(fixture)
    expect(template.forces.length).toBeGreaterThan(1)
  })

  test('a minted realm mission contains only the selected force', () => {
    let template = ServerMission.fromSaveJson(fixture)
    let target = template.forces[1]

    let realmMission = mintForceMission(template, target._id)

    expect(realmMission.forces).toHaveLength(1)
    expect(realmMission.forces[0]._id).toBe(target._id)
    // The other forces must not resolve in the stripped copy.
    for (let other of template.forces.filter((f) => f._id !== target._id)) {
      expect(realmMission.getForceById(other._id)).toBeUndefined()
    }
  })

  test('a minted realm mission keeps the full node/action set of its force', () => {
    let template = ServerMission.fromSaveJson(fixture)
    let target = template.forces[1]
    let templateForceNodeCount = target.nodes.length

    let realmMission = mintForceMission(template, target._id)

    expect(realmMission.forces[0].nodes.length).toBe(templateForceNodeCount)
    expect(realmMission.allNodes.length).toBe(templateForceNodeCount)
  })

  test('a minted realm mission still passes mission validation', () => {
    let template = ServerMission.fromSaveJson(fixture)
    let target = template.forces[2]

    let realmMission = mintForceMission(template, target._id)

    // A single-force mission is valid (>= 1 force).
    expect(() =>
      ServerMission.validateForces(
        template
          .toSaveJson({
            forceExposure: { expose: 'force-with-all-nodes', forceId: target._id },
          })
          .forces,
      ),
    ).not.toThrow()
    expect(realmMission.forces).toHaveLength(1)
  })

  test('two realms minted from the same force resolve to distinct objects (id-space isolation)', () => {
    let template = ServerMission.fromSaveJson(fixture)
    let target = template.forces[0]

    let realmA = mintForceMission(template, target._id)
    let realmB = mintForceMission(template, target._id)

    let actionId = realmA.allActions[0]?._id
    // The fixture force is expected to have at least one action.
    expect(actionId).toBeDefined()

    let actionA = realmA.getActionById(actionId!)
    let actionB = realmB.getActionById(actionId!)

    // Same id resolves in each realm, but to two distinct instances.
    expect(actionA).toBeDefined()
    expect(actionB).toBeDefined()
    expect(actionA).not.toBe(actionB)
  })
})
