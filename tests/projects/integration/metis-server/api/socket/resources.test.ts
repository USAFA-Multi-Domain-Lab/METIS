import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from '@jest/globals'
import type { MetisServer } from '@server/MetisServer'
import { SessionServer } from '@server/sessions/SessionServer'
import type {
  TRequestEvents,
  TResponseEvents,
  TServerEvents,
} from '@shared/connect'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import { Mission } from '@shared/missions/Mission'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { Socket } from 'socket.io-client'
import {
  createMissionPayload,
  FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES,
  INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES,
  type TMissionCreatePayload,
} from 'tests/helpers/projects/integration/rest-api/missions/payload'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import { TestSocketClient } from 'tests/helpers/TestSocketClient'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/helpers/TestSuiteTeardown'
import { TestToolbox } from 'tests/helpers/TestToolbox'

const SUITE_PREFIX = 'test_socket_resources'
const FUEL_RESOURCE_POOL_INDEX = FUEL_RESOURCE_POOL_DEFAULT_PROPERTIES.ORDER
const INTEL_RESOURCE_POOL_INDEX = INTEL_RESOURCE_POOL_DEFAULT_PROPERTIES.ORDER
const RESOURCE_POOL_AWARD_AMOUNT = 20

let server: MetisServer
let sessionIdsToCleanup: string[] = []
let socketsToCleanup: Socket[] = []

async function loginUser(
  client: TestHttpClient,
  username: string,
  password: string,
) {
  let response = await client.post('/api/v1/logins/', { username, password })

  expect(response.status).toBe(200)

  return response
}

async function loginWithAccess(
  client: TestHttpClient,
  accessId: 'admin' | 'instructor' | 'student',
  username: string,
  password: string,
) {
  await TestSuiteSetup.createTestUser({
    username,
    password,
    accessId,
  })

  return await loginUser(client, username, password)
}

function createSocketMissionPayload(
  customize?: (payload: TMissionCreatePayload) => void,
): TMissionCreatePayload {
  let payload = createMissionPayload(
    `${SUITE_PREFIX}_mission_${TestToolbox.generateRandomId()}`,
  )

  payload.files = []
  payload.effects = []
  payload.forces[0].nodes[1].actions[0] = {
    ...payload.forces[0].nodes[1].actions[0],
    effects: [],
  }
  payload.forces[0].nodes[1].actions[0].processTime = 0
  payload.forces[0].nodes[1].actions[0].successChance = 1

  customize?.(payload)

  return payload
}

async function createMission(
  client: TestHttpClient,
  payload: TMissionCreatePayload,
): Promise<string> {
  let response = await client.post('/api/v1/missions/', payload)

  expect(response.status).toBe(200)
  expect(typeof response.data._id).toBe('string')

  return response.data._id
}

async function launchSession(
  missionId: string,
  sessionConfig: Partial<TSessionConfig> = {},
): Promise<string> {
  let { client } = await TestSuiteSetup.createTestContext()
  let ownerUsername = `${SUITE_PREFIX}_owner_${TestToolbox.generateRandomId()}`
  let ownerPassword = TestToolbox.DEFAULT_PASSWORD
  let sessionName =
    sessionConfig.name ??
    `${SUITE_PREFIX}_session_${TestToolbox.generateRandomId()}`

  await loginWithAccess(client, 'instructor', ownerUsername, ownerPassword)

  let response = await client.post('/api/v1/sessions/launch/', {
    missionId,
    name: sessionName,
    ...sessionConfig,
  })

  expect(response.status).toBe(200)
  expect(typeof response.data.sessionId).toBe('string')

  sessionIdsToCleanup.push(response.data.sessionId)

  return response.data.sessionId
}

async function joinParticipant(sessionId: string) {
  let { client } = await TestSuiteSetup.createTestContext()
  let username = `${SUITE_PREFIX}_participant_${TestToolbox.generateRandomId()}`
  let password = TestToolbox.DEFAULT_PASSWORD
  let createResult = await TestSuiteSetup.createTestUser({
    username,
    password,
    accessId: 'student',
  })

  let loginResponse = await loginUser(client, username, password)
  let cookieHeader = TestSocketClient.buildCookieHeader(
    loginResponse.headers['set-cookie'],
  )
  let socket = await TestSocketClient.connect(server, cookieHeader)

  socketsToCleanup.push(socket)
  await TestSocketClient.joinSession(socket, sessionId)

  return {
    socket,
    userId: createResult.user._id,
  }
}

async function prepareExecutionSession(
  options: TPrepareExecutionSessionOptions = {},
) {
  let {
    customizeMission,
    sessionConfig = {},
    memberRole = MemberRole.AVAILABLE_ROLES.participant,
  } = options
  let { client: adminClient } = await TestSuiteSetup.createTestContext()
  let adminUsername = `${SUITE_PREFIX}_admin_${TestToolbox.generateRandomId()}`
  let adminPassword = TestToolbox.DEFAULT_PASSWORD

  await loginWithAccess(adminClient, 'admin', adminUsername, adminPassword)

  let missionId = await createMission(
    adminClient,
    createSocketMissionPayload(customizeMission),
  )
  let sessionId = await launchSession(missionId, sessionConfig)
  let participant = await joinParticipant(sessionId)
  let session = SessionServer.get(sessionId)

  expect(session).toBeTruthy()

  let force = session!.mission.forces[0]
  let node = force.nodes[1]
  let action = Array.from(node.actions.values())[0]
  let fuelPool = force.resourcePools[0]
  let intelPool = force.resourcePools[1]
  let member = session!.members.find(
    (existingMember) => existingMember.userId === participant.userId,
  )

  expect(force).toBeTruthy()
  expect(node).toBeTruthy()
  expect(action).toBeTruthy()
  expect(fuelPool).toBeTruthy()
  expect(intelPool).toBeTruthy()
  expect(member).toBeTruthy()

  member!.forceId = force._id
  member!.role = memberRole
  force.revealAllNodes = true
  ;(session as any)._state = 'started'

  expect(node.revealed).toBe(true)

  return {
    action,
    fuelPool,
    intelPool,
    member: member!,
    participant,
    socket: participant.socket,
    session: session!,
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

function getCurrentSessionForceResourcePools(
  response: TResponseEvents['current-session'],
  forceId: string,
) {
  let session = response.data.session
  expect(session).toBeTruthy()
  let force = Mission.getForceById(session!.mission, forceId)
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
  beforeAll(async () => {
    let context = await TestSuiteSetup.createTestContext()

    server = context.server
  })

  afterEach(() => {
    for (let socket of socketsToCleanup) {
      socket.disconnect()
    }

    socketsToCleanup = []
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

  test('skips costs for excluded pools during action execution and omits them from session data sent to the client', async () => {
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

    // The action-execution-initiated payload should only include non-excluded pools.
    expect(actionExecutionInitiatedFuelPoolBalance).toBe(expectedFuelBalance)
    expect(actionExecutionInitiatedIntelPoolBalance).toBeUndefined()

    // The current-session payload for this force should also omit the excluded pool.
    expect(currentSessionForceIntelPoolBalance).toBeUndefined()
  })

  test('does not deduct any pool balances when the zeroCost cheat is enabled', async () => {
    let { action, fuelPool, intelPool, socket } = await prepareExecutionSession(
      {
        memberRole: MemberRole.AVAILABLE_ROLES.manager,
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

    let { action, fuelPool, intelPool, session, socket } =
      await prepareExecutionSession()

    let listeners = createEventListeners(socket, [
      'action-execution-initiated',
      'modifier-enacted',
    ])

    // Triggers a modifier event.
    session.modifyResourceCost({
      resourceId: fuelPool.resourceId,
      operand: resourceCostOperand,
      node: action.node,
      action,
    })

    let modifierEventData = (await listeners['modifier-enacted'])
      .data as TResourceCostModifierEventData

    // Make sure the modifier event data transferred cleanly via the socket connection.
    expect(modifierEventData.key).toBe('node-action-resource-cost')
    expect(modifierEventData.resourceId).toBe(fuelPool.resourceId)
    expect(modifierEventData.resourceCostOperand).toBe(resourceCostOperand)
    expect(modifierEventData.nodeId).toBe(action.node._id)
    expect(modifierEventData.actionId).toBe(action._id)

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
                targetEnvironmentVersion: '0.2.1',
                trigger: 'execution-success',
                order: 0,
                name: 'Award Fuel Pool',
                description: 'Awards fuel to the owning force.',
                args: {
                  operation: 'award',
                  amount: RESOURCE_POOL_AWARD_AMOUNT,
                  poolMetadata: {
                    forceKey: force.localKey,
                    forceName: force.name,
                    poolKey: fuelResourcePool.localKey,
                    poolName: targetResource.name,
                  },
                },
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
      'modifier-enacted',
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

    // Wait for the modifier event indicating the resource pool award.
    let modifierEventData = (await listeners['modifier-enacted'])
      .data as TResourcePoolModifierEventData

    // Make sure the modifier event data transferred cleanly via the socket connection.
    expect(modifierEventData.key).toBe('force-resource-pool')
    expect(modifierEventData.poolId).toBe(fuelPool._id)
    expect(modifierEventData.operand).toBe(RESOURCE_POOL_AWARD_AMOUNT)

    // Wait for the action execution to complete.
    await listeners['action-execution-completed']

    // Grab the actual pool balances post-action-execution.
    let session = await requestCurrentSession(socket)
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

  afterAll(async () => {
    if (sessionIdsToCleanup.length > 0) {
      let { client } = await TestSuiteSetup.createTestContext()
      let cleanupUsername = `${SUITE_PREFIX}_cleanup_${TestToolbox.generateRandomId()}`
      let cleanupPassword = TestToolbox.DEFAULT_PASSWORD

      await loginWithAccess(client, 'admin', cleanupUsername, cleanupPassword)

      for (let sessionId of sessionIdsToCleanup) {
        await client.delete(`/api/v1/sessions/${sessionId}/`)
      }
    }

    await TestSuiteTeardown.cleanupTestUsers(SUITE_PREFIX)
    await TestSuiteTeardown.cleanupTestMissions(SUITE_PREFIX)
  })
})

type TPrepareExecutionSessionOptions = {
  customizeMission?: (payload: TMissionCreatePayload) => void
  sessionConfig?: Partial<TSessionConfig>
  memberRole?: MemberRole
}

type TResourceCostModifierEventData = Extract<
  TServerEvents['modifier-enacted']['data'],
  { key: 'node-action-resource-cost' }
>

type TResourcePoolModifierEventData = Extract<
  TServerEvents['modifier-enacted']['data'],
  { key: 'force-resource-pool' }
>
