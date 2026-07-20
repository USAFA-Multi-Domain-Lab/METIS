import { afterEach, describe, expect, test } from '@jest/globals'
import { MetisServer } from '@server/MetisServer'
import type {
  TRequestEvents,
  TResponseEvents,
  TServerEvents,
} from '@shared/connect'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import { Mission } from '@shared/missions/Mission'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { Socket } from 'socket.io-client'
import {
  FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES,
  INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES,
  type TMissionCreatePayload,
} from 'tests/helpers/projects/integration/rest-api/missions/payload'
import { TestSession } from 'tests/helpers/TestSession'
import { TestSocketClient } from 'tests/helpers/TestSocketClient'
import { TestToolbox } from 'tests/helpers/TestToolbox'

const SUITE_PREFIX = 'test_socket_resources'
const FUEL_RESOURCE_POOL_INDEX = FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.ORDER
const INTEL_RESOURCE_POOL_INDEX = INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.ORDER
const RESOURCE_POOL_AWARD_AMOUNT = 20

/**
 * Applies the customizations every test in this suite depends on, then
 * hands the payload to the test's own customization.
 * @note Files and session-start effects are stripped because they only
 * slow the start phase, and the action under test is made instant and
 * always-successful so executions resolve deterministically.
 */
function customizeSocketMission(
  payload: TMissionCreatePayload,
  customize?: (payload: TMissionCreatePayload) => void,
): void {
  payload.files = []
  payload.effects = []
  payload.forces[0].nodes[1].actions[0] = {
    ...payload.forces[0].nodes[1].actions[0],
    effects: [],
  }
  payload.forces[0].nodes[1].actions[0].baseProcessTime = 0
  payload.forces[0].nodes[1].actions[0].baseSuccessChance = 1

  customize?.(payload)
}

/**
 * Launches and starts a session with a single member, then resolves the
 * force, action, and resource pools that member plays with.
 * @note Every returned mission object comes from the member's realm, not
 * from the session's template mission, because the realm copy is what
 * the server mutates during play.
 */
async function prepareExecutionSession(
  options: TPrepareExecutionSessionOptions = {},
) {
  let { customizeMission, sessionConfig = {}, memberRoleId } = options

  // A manager is not force-assignable, so it is left unassigned and
  // observes the session through its complete-visibility subscription.
  let managed = memberRoleId === MemberRole.AVAILABLE_ROLES.manager._id

  let context = await TestSession.launch({
    namePrefix: SUITE_PREFIX,
    mission: {
      customize: (payload) => customizeSocketMission(payload, customizeMission),
    },
    config: sessionConfig,
    members: [{ force: managed ? undefined : 0, role: memberRoleId }],
    start: true,
    // The force is revealed below, once resolved, so that it is revealed
    // for members that have no force of their own.
    reveal: false,
  })

  let [participant] = context.members
  let realm = participant.member.subscribedRealm
  let force = participant.member.assignedForce ?? realm.mission.forces[0]

  expect(realm).toBeTruthy()
  expect(force).toBeTruthy()

  force.revealAllNodes = true

  let node = force.nodes[1]
  let action = Array.from(node.actions.values())[0]
  let fuelPool = force.resourcePools[0]
  let intelPool = force.resourcePools[1]

  expect(node).toBeTruthy()
  expect(action).toBeTruthy()
  expect(fuelPool).toBeTruthy()
  expect(intelPool).toBeTruthy()
  expect(node.revealed).toBe(true)

  return {
    action,
    fuelPool,
    intelPool,
    socket: participant.socket,
    realm,
  }
}

function findPoolBalanceByResourceId(
  resourcePools: Array<{ resourceId: string; balance?: number }>,
  resourceId: string,
): number | undefined {
  return resourcePools.find((pool) => pool.resourceId === resourceId)?.balance
}

function determineExpectedBalanceAfterExecution(
  action: Awaited<ReturnType<typeof prepareExecutionSession>>['action'],
  pool: Awaited<ReturnType<typeof prepareExecutionSession>>['fuelPool'],
): number {
  let resourceCost =
    action.includedCosts.find((cost) => cost.resourceId === pool.resourceId)
      ?.amount ?? 0

  return pool.balance - resourceCost
}

async function sendActionExecutionRequest(
  socket: Socket,
  actionId: string,
  cheats: Partial<TExecutionCheats> = {},
): Promise<void> {
  let data: TRequestEvents['request-execute-action']['data'] = { actionId }

  if (Object.keys(cheats).length > 0) {
    data.cheats = cheats
  }

  TestSocketClient.sendJson<TRequestEvents['request-execute-action']>(socket, {
    method: 'request-execute-action',
    requestId: TestToolbox.generateRandomId(),
    data,
  })
}

async function requestCurrentSession(
  socket: Socket,
): Promise<TResponseEvents['current-session']> {
  TestSocketClient.sendJson<TRequestEvents['request-current-session']>(socket, {
    method: 'request-current-session',
    requestId: TestToolbox.generateRandomId(),
    data: {},
  })

  return await TestSocketClient.waitForEvent<
    TResponseEvents['current-session']
  >(socket, (event) => event.method === 'current-session')
}

async function waitForResourcePoolBalance(
  socket: Socket,
  forceId: string,
  resourceId: string,
  expectedBalance: number,
  timeoutMs: number = 3000,
): Promise<TResponseEvents['current-session']> {
  let startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    let response = await requestCurrentSession(socket)
    let resourcePools = getCurrentSessionForceResourcePools(response, forceId)
    let balance = findPoolBalanceByResourceId(resourcePools, resourceId)

    if (balance === expectedBalance) {
      return response
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  throw new Error(
    `Timed out waiting for resource pool "${resourceId}" to reach balance ${expectedBalance}.`,
  )
}

function getCurrentSessionForceResourcePools(
  response: TResponseEvents['current-session'],
  forceId: string,
) {
  let session = response.data.session
  expect(session).toBeTruthy()

  // Live gameplay state travels on the requester's subscribed realm.
  // The session's own `mission` is only the template the realm was
  // minted from, so its balances never move.
  let realm = session!.realms[0]
  expect(realm).toBeTruthy()

  let force = Mission.getForceById(realm.mission, forceId)
  expect(force).toBeTruthy()
  return force!.resourcePools
}

function createEventListeners<T extends keyof TServerEvents>(
  socket: Socket,
  methods: Array<T>,
) {
  let listeners = {} as { [K in T]: Promise<TServerEvents[K]> }

  for (let method of methods) {
    listeners[method] = TestSocketClient.waitForEvent<TServerEvents[T]>(
      socket,
      (event) => event.method === method,
    )
  }

  return listeners
}

describe('Action execution resource socket networking', () => {
  afterEach(() => {
    TestSession.disposeAll()
  })

  test('deducts included resource costs and emits updated resource pools on action initiation', async () => {
    let { action, fuelPool, intelPool, socket } =
      await prepareExecutionSession()

    let listeners = createEventListeners(socket, ['action-execution-initiated'])

    let expectedFuelBalance = determineExpectedBalanceAfterExecution(
      action,
      fuelPool,
    )
    let expectedIntelBalance = determineExpectedBalanceAfterExecution(
      action,
      intelPool,
    )

    await sendActionExecutionRequest(socket, action._id)
    let response = await listeners['action-execution-initiated']

    let clientSideFuelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      fuelPool.resourceId,
    )
    let clientSideIntelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(expectedFuelBalance)
    expect(intelPool.balance).toBe(expectedIntelBalance)

    // Make sure the action ID matches on the "server"
    // and the "client"
    expect(response.data.execution.actionId).toBe(action._id)

    // Represents the client-side balances
    expect(clientSideFuelResourcePoolBalance).toBe(expectedFuelBalance)
    expect(clientSideIntelResourcePoolBalance).toBe(expectedIntelBalance)
  })

  test('returns CODE_ACTION_INSUFFICIENT_RESOURCES and leaves balances unchanged when a required pool cannot cover the cost', async () => {
    const fuelResourcePoolInitialBalance = 10

    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        customizeMission: (payload) => {
          let force = payload.forces[0]
          let fuelResourcePool = force.resourcePools[FUEL_RESOURCE_POOL_INDEX]
          fuelResourcePool.initialBalance = fuelResourcePoolInitialBalance
        },
      },
    )

    await sendActionExecutionRequest(socket, action._id)

    let errorEvent = await TestSocketClient.waitForError(
      socket,
      (event) =>
        event.code === ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
    )

    expect(errorEvent.code).toBe(
      ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
    )
    expect(fuelPool.balance).toBe(fuelResourcePoolInitialBalance)
    expect(intelPool.balance).toBe(
      INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE,
    )
    expect(action.node.executions).toHaveLength(0)
  })

  test('allows execution to drive a pool negative when that pool permits negative balances', async () => {
    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        customizeMission: (payload) => {
          let force = payload.forces[0]
          let fuelResourcePool = force.resourcePools[FUEL_RESOURCE_POOL_INDEX]
          fuelResourcePool.initialBalance = 10
          fuelResourcePool.allowNegative = true
        },
      },
    )

    let expectedFuelBalance = determineExpectedBalanceAfterExecution(
      action,
      fuelPool,
    )
    let expectedIntelBalance = determineExpectedBalanceAfterExecution(
      action,
      intelPool,
    )

    let listeners = createEventListeners(socket, ['action-execution-initiated'])

    await sendActionExecutionRequest(socket, action._id)
    let response = await listeners['action-execution-initiated']

    let clientSideFuelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      fuelPool.resourceId,
    )
    let clientSideIntelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(expectedFuelBalance)
    expect(intelPool.balance).toBe(expectedIntelBalance)

    // Represents the client-side balances
    expect(clientSideFuelResourcePoolBalance).toBe(expectedFuelBalance)
    expect(clientSideIntelResourcePoolBalance).toBe(expectedIntelBalance)
  })

  test('skips costs for excluded pools during action execution while keeping their balances visible in session data', async () => {
    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        customizeMission: (payload) => {
          let force = payload.forces[0]
          let intelResourcePool = force.resourcePools[INTEL_RESOURCE_POOL_INDEX]
          intelResourcePool.excluded = true
        },
      },
    )

    let expectedFuelBalance = determineExpectedBalanceAfterExecution(
      action,
      fuelPool,
    )
    let expectedIntelBalance = determineExpectedBalanceAfterExecution(
      action,
      intelPool,
    )

    // Action Execution
    let listeners = createEventListeners(socket, ['action-execution-initiated'])
    await sendActionExecutionRequest(socket, action._id)
    let actionExecutionInitiatedResponse =
      await listeners['action-execution-initiated']

    let actionExecutionInitiatedFuelPoolBalance = findPoolBalanceByResourceId(
      actionExecutionInitiatedResponse.data.resourcePools,
      fuelPool.resourceId,
    )
    let actionExecutionInitiatedIntelPoolBalance = findPoolBalanceByResourceId(
      actionExecutionInitiatedResponse.data.resourcePools,
      intelPool.resourceId,
    )

    // Current Session
    let currentSessionResponse = await requestCurrentSession(socket)
    let currentSessionForceResourcePools = getCurrentSessionForceResourcePools(
      currentSessionResponse,
      action.force._id,
    )
    let currentSessionForceIntelPoolBalance = findPoolBalanceByResourceId(
      currentSessionForceResourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(expectedFuelBalance)
    expect(intelPool.balance).toBe(expectedIntelBalance)

    // Excluded pools remain visible in client session data, but their costs are skipped.
    expect(actionExecutionInitiatedFuelPoolBalance).toBe(expectedFuelBalance)
    expect(actionExecutionInitiatedIntelPoolBalance).toBe(expectedIntelBalance)

    expect(currentSessionForceIntelPoolBalance).toBe(expectedIntelBalance)
  })

  test('does not deduct any pool balances when the zeroCost cheat is enabled', async () => {
    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        memberRoleId: MemberRole.AVAILABLE_ROLES.manager._id,
      },
    )

    let listeners = createEventListeners(socket, ['action-execution-initiated'])

    await sendActionExecutionRequest(socket, action._id, {
      zeroCost: true,
    })

    let response = await listeners['action-execution-initiated']

    let clientSideFuelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      fuelPool.resourceId,
    )
    let clientSideIntelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(
      FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE,
    )
    expect(intelPool.balance).toBe(
      INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE,
    )

    // Represents the client-side balances
    expect(clientSideFuelResourcePoolBalance).toBe(fuelPool.balance)
    expect(clientSideIntelResourcePoolBalance).toBe(intelPool.balance)
  })

  test('does not deduct any pool balances when infiniteResources is enabled in the session config', async () => {
    const fuelResourcePoolInitialBalance = 10

    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        customizeMission: (payload) => {
          let force = payload.forces[0]
          let fuelResourcePool = force.resourcePools[FUEL_RESOURCE_POOL_INDEX]
          fuelResourcePool.initialBalance = fuelResourcePoolInitialBalance
        },
        sessionConfig: {
          infiniteResources: true,
        },
      },
    )

    let listeners = createEventListeners(socket, ['action-execution-initiated'])

    await sendActionExecutionRequest(socket, action._id)
    let response = await listeners['action-execution-initiated']

    let clientSideFuelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      fuelPool.resourceId,
    )
    let clientSideIntelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(fuelResourcePoolInitialBalance)
    expect(intelPool.balance).toBe(
      INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.BLUE_FORCE_INITIAL_BALANCE,
    )

    // Represents the client-side balances
    expect(clientSideFuelResourcePoolBalance).toBe(fuelPool.balance)
    expect(clientSideIntelResourcePoolBalance).toBe(intelPool.balance)
  })

  test('applies modifyResourceCost changes to subsequent action execution and broadcasts the modifier event', async () => {
    const resourceCostOperand = 10

    let { action, fuelPool, intelPool, realm, socket } =
      await prepareExecutionSession()

    let listeners = createEventListeners(socket, [
      'action-execution-initiated',
      'action-resource-cost-updated',
    ])

    // Triggers a modifier event.
    realm.modifyResourceCost([action], fuelPool.resourceId, resourceCostOperand)

    let modifierEvent = await listeners['action-resource-cost-updated']

    // Make sure the modifier event data transferred cleanly via the socket connection.
    expect(modifierEvent.data.modifier.resourceId).toBe(fuelPool.resourceId)
    expect(modifierEvent.data.modifier.amount).toBe(resourceCostOperand)
    expect(modifierEvent.data.lookUpData[0].nodeId).toBe(action.node._id)
    expect(modifierEvent.data.lookUpData[0]._id).toBe(action._id)

    // Determine what the expected pool balances should be after the
    // action executes.
    let expectedFuelBalance = determineExpectedBalanceAfterExecution(
      action,
      fuelPool,
    )
    let expectedIntelBalance = determineExpectedBalanceAfterExecution(
      action,
      intelPool,
    )

    // Execute the action with the modified values.
    await sendActionExecutionRequest(socket, action._id)
    let response = await listeners['action-execution-initiated']

    // Grab the actual pool balances post-action-execution.
    let clientSideFuelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      fuelPool.resourceId,
    )
    let clientSideIntelResourcePoolBalance = findPoolBalanceByResourceId(
      response.data.resourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(expectedFuelBalance)
    expect(intelPool.balance).toBe(expectedIntelBalance)

    // Represents the client-side balances
    expect(clientSideFuelResourcePoolBalance).toBe(expectedFuelBalance)
    expect(clientSideIntelResourcePoolBalance).toBe(expectedIntelBalance)
  })

  test('awards a resource pool through an execution effect and reflects the updated balance in current session data', async () => {
    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        customizeMission: (payload) => {
          let force = payload.forces[0]
          let fuelResourcePool = force.resourcePools[FUEL_RESOURCE_POOL_INDEX]
          let targetResource = payload.resources[FUEL_RESOURCE_POOL_INDEX]
          let node = force.nodes[1]

          node.actions[0] = {
            ...node.actions[0],
            effects: [
              {
                _id: TestToolbox.generateRandomId(),
                targetId: 'resource-pool',
                environmentId: 'metis',
                targetEnvironmentVersion: MetisServer.PROJECT_VERSION,
                trigger: 'execution-success',
                order: 0,
                name: 'Award Fuel Pool',
                description: 'Awards fuel to the owning force.',
                arguments: [
                  {
                    _id: TestToolbox.generateRandomId(),
                    parameterId: 'applyTo',
                    type: 'mission-component',
                    value: [
                      {
                        componentType: 'resourcePool',
                        lastKnownName: targetResource.name,
                        ids: [force._id, fuelResourcePool._id],
                      },
                    ],
                  },
                  {
                    _id: TestToolbox.generateRandomId(),
                    parameterId: 'operation',
                    type: 'dropdown',
                    value: 'award',
                  },
                  {
                    _id: TestToolbox.generateRandomId(),
                    parameterId: 'amount',
                    type: 'number',
                    value: RESOURCE_POOL_AWARD_AMOUNT,
                  },
                ],
                localKey: '1',
              },
            ],
          }
        },
      },
    )

    let listeners = createEventListeners(socket, [
      'action-execution-initiated',
      'action-execution-completed',
    ])

    let expectedFuelBalanceAfterDeduction =
      determineExpectedBalanceAfterExecution(action, fuelPool)

    let expectedIntelBalanceAfterDeduction =
      determineExpectedBalanceAfterExecution(action, intelPool)

    let expectedFuelBalanceAfterAward =
      expectedFuelBalanceAfterDeduction + RESOURCE_POOL_AWARD_AMOUNT

    // Execute the action containing the resource pool award effect.
    await sendActionExecutionRequest(socket, action._id)
    let actionExecutionResponse = await listeners['action-execution-initiated']

    // Wait for the action execution to complete.
    await listeners['action-execution-completed']

    // Wait until the current-session payload reflects the awarded balance.
    let session = await waitForResourcePoolBalance(
      socket,
      action.force._id,
      fuelPool.resourceId,
      expectedFuelBalanceAfterAward,
    )
    let currentSessionResourcePools = getCurrentSessionForceResourcePools(
      session,
      action.force._id,
    )
    let clientSideFuelBalanceAfterDeduction = findPoolBalanceByResourceId(
      actionExecutionResponse.data.resourcePools,
      fuelPool.resourceId,
    )
    let clientSideFuelBalanceAfterAward = findPoolBalanceByResourceId(
      currentSessionResourcePools,
      fuelPool.resourceId,
    )
    let clientSideIntelBalanceAfterAward = findPoolBalanceByResourceId(
      currentSessionResourcePools,
      intelPool.resourceId,
    )

    // Represents the server-side balances
    expect(fuelPool.balance).toBe(expectedFuelBalanceAfterAward)
    expect(intelPool.balance).toBe(expectedIntelBalanceAfterDeduction)

    // Represents the client-side balances
    expect(clientSideFuelBalanceAfterDeduction).toBe(
      expectedFuelBalanceAfterDeduction,
    )
    expect(clientSideFuelBalanceAfterAward).toBe(expectedFuelBalanceAfterAward)
    expect(clientSideIntelBalanceAfterAward).toBe(
      expectedIntelBalanceAfterDeduction,
    )
  })
})

type TPrepareExecutionSessionOptions = {
  customizeMission?: (payload: TMissionCreatePayload) => void
  sessionConfig?: Partial<TSessionConfig>
  memberRoleId?: TMemberRoleId
}
