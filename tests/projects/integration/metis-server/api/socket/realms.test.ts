import { afterEach, describe, expect, test } from '@jest/globals'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES } from 'tests/helpers/projects/integration/rest-api/missions/payload'
import {
  launchPlayableSession,
  launchStandaloneSession,
  readRealmPoolBalance,
  readTemplatePoolBalance,
  resolveObjectiveExecution,
  resourceCostOf,
} from 'tests/helpers/session/scenarios'
import { TestSession } from 'tests/helpers/TestSession'
import { TestToolbox } from 'tests/helpers/TestToolbox'

const SUITE_PREFIX = 'test_socket_realms'

/**
 * The Blue force's starting fuel balance in the mission fixture. Each test
 * derives the post-execution balance from the resolved action's own cost, so
 * the expectation stays tied to the fixture rather than a magic number.
 */
const BLUE_FUEL_INITIAL =
  FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE

describe('Standalone session realms socket networking', () => {
  afterEach(() => {
    TestSession.disposeAll()
  })

  test('mints one realm per participant whose mission holds only the configured force', async () => {
    let { context, standaloneForceId, payload } = await launchStandaloneSession(
      {
        namePrefix: SUITE_PREFIX,
        participantCount: 2,
      },
    )
    let otherForceId = payload.forces[1]._id

    expect(context.realms).toHaveLength(2)

    for (let realm of context.realms) {
      let forces = realm.mission.forces
      expect(forces).toHaveLength(1)
      expect(forces[0]._id).toBe(standaloneForceId)
      // The other force never appears in a standalone participant's realm.
      expect(realm.mission.getForceById(otherForceId)).toBeUndefined()
    }
  }, 30000)

  test('isolates two participants on the same force: one execution reaches neither the events nor the state of the other', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      participantCount: 2,
    })
    let [actor, bystander] = context.members

    let actorExecution = resolveObjectiveExecution(actor)
    let bystanderExecution = resolveObjectiveExecution(bystander)
    let fuelAfter =
      BLUE_FUEL_INITIAL -
      resourceCostOf(actorExecution.action, actorExecution.fuelPool.resourceId)

    // The actor sees their own execution; the bystander in a separate realm
    // must see no execution event at all, even on the same configured force.
    let actorInitiated = TestSession.waitFor(
      actor,
      'action-execution-initiated',
    )
    let bystanderSilent = TestSession.expectNoEvent(
      bystander,
      (event) =>
        event.method === 'action-execution-initiated' ||
        event.method === 'action-execution-completed',
      1000,
    )

    TestSession.executeAction(actor, actorExecution.action._id)
    await Promise.all([actorInitiated, bystanderSilent])

    // The actor's realm was mutated; the bystander's realm was untouched.
    expect(actorExecution.fuelPool.balance).toBe(fuelAfter)
    expect(bystanderExecution.fuelPool.balance).toBe(BLUE_FUEL_INITIAL)
  }, 30000)

  test('serves a participant their realm post-mutation state on re-request, not the untouched template', async () => {
    let { context, standaloneForceId } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
    })
    let [participant] = context.members
    let { action, fuelPool } = resolveObjectiveExecution(participant)
    let fuelResourceId = fuelPool.resourceId
    let fuelAfter = BLUE_FUEL_INITIAL - resourceCostOf(action, fuelResourceId)

    let initiated = TestSession.waitFor(
      participant,
      'action-execution-initiated',
    )
    TestSession.executeAction(participant, action._id)
    await initiated
    expect(fuelPool.balance).toBe(fuelAfter)

    let response = await TestSession.requestCurrentSession(participant)
    expect(response.data.session).toBeTruthy()

    // The realm carries the mutated balance...
    expect(
      readRealmPoolBalance(response, standaloneForceId, fuelResourceId),
    ).toBe(fuelAfter)
    // ...while the authoring template the realm was minted from is untouched.
    expect(
      readTemplatePoolBalance(response, standaloneForceId, fuelResourceId),
    ).toBe(BLUE_FUEL_INITIAL)
  }, 30000)

  test('remints the mission in every realm on reset, clearing each participant mutation', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      participantCount: 2,
    })

    // Mutate both realms by executing each participant's action.
    for (let member of context.members) {
      let { action, fuelPool } = resolveObjectiveExecution(member)
      let fuelAfter =
        BLUE_FUEL_INITIAL - resourceCostOf(action, fuelPool.resourceId)
      let initiated = TestSession.waitFor(member, 'action-execution-initiated')
      TestSession.executeAction(member, action._id)
      await initiated
      expect(fuelPool.balance).toBe(fuelAfter)
    }

    // The manager resets the session.
    let reset = TestSession.waitFor(context.owner, 'session-reset', 15000)
    TestSession.send(context.owner, {
      method: 'request-reset-session',
      requestId: TestToolbox.generateRandomId(),
      data: {},
    })
    await reset

    // Every realm's mission has been reminted, so each balance is restored.
    for (let member of context.members) {
      let { fuelPool } = resolveObjectiveExecution(member)
      expect(fuelPool.balance).toBe(BLUE_FUEL_INITIAL)
    }
  }, 30000)

  test('disables a target environment without multi-realm support and keeps one that opts in', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      start: false,
      // Reference both environments through teardown effects, which never run
      // during start, so no environment hook executes and no network is
      // touched regardless of which environments end up enabled. `metis` opts
      // into multiple realms; `metis-test-env` does not.
      customizeMission: (payload) => {
        payload.effects = [
          {
            _id: TestToolbox.generateRandomId(),
            targetId: 'delay',
            environmentId: 'metis',
            targetEnvironmentVersion: '0.2.1',
            trigger: 'session-teardown',
            order: 0,
            name: 'Metis reference',
            description: 'References the metis environment.',
            arguments: [
              {
                _id: TestToolbox.generateRandomId(),
                parameterId: 'delayTimeHours',
                type: 'number',
                value: 0,
              },
              {
                _id: TestToolbox.generateRandomId(),
                parameterId: 'delayTimeMinutes',
                type: 'number',
                value: 0,
              },
              {
                _id: TestToolbox.generateRandomId(),
                parameterId: 'delayTimeSeconds',
                type: 'number',
                value: 0,
              },
            ],
            localKey: '1',
          },
          {
            _id: TestToolbox.generateRandomId(),
            targetId: 'http',
            environmentId: 'metis-test-env',
            targetEnvironmentVersion: '1.0.0',
            trigger: 'session-teardown',
            order: 1,
            name: 'Test env reference',
            description: 'References the metis-test-env environment.',
            arguments: [
              {
                _id: TestToolbox.generateRandomId(),
                parameterId: 'action',
                type: 'dropdown',
                value: 'get',
              },
            ],
            localKey: '2',
          },
        ]
      },
    })

    // Precondition: the template mission genuinely uses both environments.
    let referencedEnvIds = context.session.mission.targetEnvironments.map(
      (environment) => environment._id,
    )
    expect(referencedEnvIds).toContain('metis')
    expect(referencedEnvIds).toContain('metis-test-env')

    // Starting mints realms and enforces the standalone target-env rules.
    await TestSession.start(context)

    let disabled = context.session.config.explicitlyDisabledEnvironments
    expect(disabled).toContain('metis-test-env')
    expect(disabled).not.toContain('metis')
  }, 30000)

  test('regression: a multiplayer session starts with a single realm holding all forces, shared by every member', async () => {
    let { context, payload } = await launchPlayableSession({
      namePrefix: SUITE_PREFIX,
      members: [{ force: 0 }, { force: 1 }],
    })
    let forceZeroId = payload.forces[0]._id
    let forceOneId = payload.forces[1]._id
    let [blueMember, redMember] = context.members

    // Exactly one realm, and it holds the full mission.
    expect(context.realms).toHaveLength(1)
    let realm = context.realms[0]
    expect(realm.mission.forces).toHaveLength(2)
    expect(realm.mission.getForceById(forceZeroId)).toBeTruthy()
    expect(realm.mission.getForceById(forceOneId)).toBeTruthy()

    // Force assignment stays editable in multiplayer (the socket assignment
    // driven at launch would be rejected in standalone), and every member —
    // both participants and the manager — shares the single realm.
    expect(blueMember.member.assignedForceId).toBe(forceZeroId)
    expect(redMember.member.assignedForceId).toBe(forceOneId)
    expect(blueMember.member.subscribedRealmId).toBe(realm._id)
    expect(redMember.member.subscribedRealmId).toBe(realm._id)
    expect(context.owner.member.subscribedRealmId).toBe(realm._id)

    // Gameplay behaves as before: an execution deducts within the shared realm.
    let { action, fuelPool } = resolveObjectiveExecution(blueMember)
    let fuelAfter =
      BLUE_FUEL_INITIAL - resourceCostOf(action, fuelPool.resourceId)
    let initiated = TestSession.waitFor(
      blueMember,
      'action-execution-initiated',
    )
    TestSession.executeAction(blueMember, action._id)
    await initiated
    expect(fuelPool.balance).toBe(fuelAfter)
  }, 30000)

  test('lets a complete-visibility member switch to an existing realm and become subscribed to it', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      participantCount: 2,
    })
    let targetRealm = context.realms[1]

    // The manager starts subscribed to the first participant's realm.
    expect(context.owner.member.subscribedRealmId).toBe(context.realms[0]._id)

    let switched = TestSession.waitFor(context.owner, 'realm-switched')
    TestSession.send(context.owner, {
      method: 'request-switch-realm',
      requestId: TestToolbox.generateRandomId(),
      data: { realmId: targetRealm._id },
    })
    let event = await switched

    expect(event.data.subscribedRealm._id).toBe(targetRealm._id)
    expect(context.owner.member.subscribedRealmId).toBe(targetRealm._id)
  }, 30000)

  test('rejects a switch request from a non-complete-visibility member and leaves its subscription unchanged', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      participantCount: 2,
    })
    let [participant] = context.members
    let originalRealmId = participant.member.subscribedRealmId
    let otherRealm = context.realms[1]

    TestSession.send(participant, {
      method: 'request-switch-realm',
      requestId: TestToolbox.generateRandomId(),
      data: { realmId: otherRealm._id },
    })

    let error = await TestSession.waitForError(
      participant,
      ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
    )

    expect(error.code).toBe(
      ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
    )
    expect(participant.member.subscribedRealmId).toBe(originalRealmId)
  }, 30000)

  test('rejects a switch request made before the session has started', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      participantCount: 2,
      start: false,
    })

    TestSession.send(context.owner, {
      method: 'request-switch-realm',
      requestId: TestToolbox.generateRandomId(),
      data: { realmId: 'any-realm' },
    })

    let error = await TestSession.waitForError(
      context.owner,
      ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
    )

    expect(error.code).toBe(ServerEmittedError.CODE_SESSION_CONFLICTING_STATE)
  }, 30000)

  test('rejects a switch request for an unknown realm id with CODE_REALM_NOT_FOUND', async () => {
    let { context } = await launchStandaloneSession({
      namePrefix: SUITE_PREFIX,
      participantCount: 2,
    })

    TestSession.send(context.owner, {
      method: 'request-switch-realm',
      requestId: TestToolbox.generateRandomId(),
      data: { realmId: 'no-such-realm' },
    })

    let error = await TestSession.waitForError(
      context.owner,
      ServerEmittedError.CODE_REALM_NOT_FOUND,
    )

    expect(error.code).toBe(ServerEmittedError.CODE_REALM_NOT_FOUND)
  }, 30000)
})
