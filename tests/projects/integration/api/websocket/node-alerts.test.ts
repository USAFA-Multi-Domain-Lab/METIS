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
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type { Socket } from 'socket.io-client'
import { TestSocketClient } from 'tests/middleware/TestSocketClient'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestSuiteTeardown } from 'tests/middleware/TestSuiteTeardown'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

describe('Node alert websocket networking', () => {
  const SUITE_PREFIX = 'test_ws_node_alert'
  let server: MetisServer
  let suiteMissionId: string
  let sessionIdsToCleanup: string[] = []
  let socketsToCleanup: Socket[] = []

  async function loginUser(
    client: Awaited<
      ReturnType<typeof TestSuiteSetup.createTestContext>
    >['client'],
    username: string,
    password: string,
  ) {
    let response = await client.post('/api/v1/logins/', { username, password })
    expect(response.status).toBe(200)
    return response
  }

  async function launchSession(sessionName: string): Promise<string> {
    let { client } = await TestSuiteSetup.createTestContext()
    let ownerUsername = `${SUITE_PREFIX}_owner_${TestToolbox.generateRandomId()}`
    let ownerPassword = TestToolbox.DEFAULT_PASSWORD

    await TestSuiteSetup.createTestUser({
      username: ownerUsername,
      password: ownerPassword,
      accessId: 'instructor',
    })
    await loginUser(client, ownerUsername, ownerPassword)

    let response = await client.post('/api/v1/sessions/launch/', {
      missionId: suiteMissionId,
      name: sessionName,
    })

    expect(response.status).toBe(200)
    expect(typeof response.data.sessionId).toBe('string')
    sessionIdsToCleanup.push(response.data.sessionId)
    return response.data.sessionId
  }

  async function joinSocket(sessionId: string, suffix: string) {
    let { client } = await TestSuiteSetup.createTestContext()
    let username = `${SUITE_PREFIX}_${suffix}_${TestToolbox.generateRandomId()}`
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
      client,
      socket,
      userId: createResult.user._id,
    }
  }

  async function expectNoMatchingEvent(
    socket: Socket,
    predicate: (event: any) => boolean,
    timeoutMs: number = 500,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let cleanedUp = false
      let cleanup = () => {
        if (cleanedUp) return
        cleanedUp = true
        clearTimeout(timer)
        socket.off('message', onMessage)
      }

      let timer = setTimeout(() => {
        cleanup()
        resolve()
      }, timeoutMs)

      let onMessage = (raw: string | object) => {
        try {
          let event = typeof raw === 'string' ? JSON.parse(raw) : raw
          if (predicate(event)) {
            cleanup()
            reject(new Error('Unexpected matching socket event received.'))
          }
        } catch (error) {
          cleanup()
          reject(error)
        }
      }

      socket.on('message', onMessage)
    })
  }

  async function prepareAlertSession() {
    let sessionId = await launchSession(
      `${SUITE_PREFIX}_session_${TestToolbox.generateRandomId()}`,
    )
    let session = SessionServer.get(sessionId)

    expect(session).toBeTruthy()

    let sameForceMemberOne = await joinSocket(sessionId, 'same_force_1')
    let sameForceMemberTwo = await joinSocket(sessionId, 'same_force_2')
    let otherForceMember = await joinSocket(sessionId, 'other_force')

    session = SessionServer.get(sessionId)
    expect(session).toBeTruthy()

    let firstForce = session!.mission.forces[0]
    let node = firstForce.nodes[0]

    expect(firstForce).toBeTruthy()
    expect(node).toBeTruthy()

    let firstMember = session!.members.find(
      (member) => member.userId === sameForceMemberOne.userId,
    )
    let secondMember = session!.members.find(
      (member) => member.userId === sameForceMemberTwo.userId,
    )
    let thirdMember = session!.members.find(
      (member) => member.userId === otherForceMember.userId,
    )

    expect(firstMember).toBeTruthy()
    expect(secondMember).toBeTruthy()
    expect(thirdMember).toBeTruthy()

    firstMember!.forceId = firstForce._id
    secondMember!.forceId = firstForce._id
    thirdMember!.forceId = `other-force-${TestToolbox.generateRandomId()}`
    ;(session as any)._state = 'started'

    return {
      session: session!,
      node,
      sameForceMemberOne,
      sameForceMemberTwo,
      otherForceMember,
    }
  }

  beforeAll(async () => {
    let context = await TestSuiteSetup.createTestContext()
    server = context.server

    let bootstrapClient = context.client
    let bootstrapUsername = `${SUITE_PREFIX}_bootstrap_${TestToolbox.generateRandomId()}`
    let bootstrapPassword = TestToolbox.DEFAULT_PASSWORD

    await TestSuiteSetup.createTestUser({
      username: bootstrapUsername,
      password: bootstrapPassword,
      accessId: 'admin',
    })
    await loginUser(bootstrapClient, bootstrapUsername, bootstrapPassword)

    let missionsResponse = await bootstrapClient.get('/api/v1/missions/')
    expect(missionsResponse.status).toBe(200)
    expect(Array.isArray(missionsResponse.data)).toBe(true)
    expect(missionsResponse.data.length).toBeGreaterThan(0)

    let baseMissionId = missionsResponse.data[0]._id
    let copyResponse = await bootstrapClient.post('/api/v1/missions/copy/', {
      originalId: baseMissionId,
      copyName: `${SUITE_PREFIX}_mission_${TestToolbox.generateRandomId()}`,
    })

    expect(copyResponse.status).toBe(200)
    suiteMissionId = copyResponse.data._id
  })

  afterEach(() => {
    for (let socket of socketsToCleanup) {
      socket.disconnect()
    }
    socketsToCleanup = []
  })

  test('broadcasts a node-new-alert modifier to members of the relevant force', async () => {
    let {
      session,
      node,
      sameForceMemberOne,
      sameForceMemberTwo,
      otherForceMember,
    } = await prepareAlertSession()

    let firstEventPromise = TestSocketClient.waitForEvent(
      sameForceMemberOne.socket,
      (event) =>
        (event as any).method === 'modifier-enacted' &&
        (event as any).data?.key === 'node-new-alert',
    )
    let secondEventPromise = TestSocketClient.waitForEvent(
      sameForceMemberTwo.socket,
      (event) =>
        (event as any).method === 'modifier-enacted' &&
        (event as any).data?.key === 'node-new-alert',
    )
    let noOtherForceEventPromise = expectNoMatchingEvent(
      otherForceMember.socket,
      (event) =>
        (event as any).method === 'modifier-enacted' &&
        (event as any).data?.key === 'node-new-alert',
    )

    session.addNodeAlert(node, 'Network anomaly detected', 'warning')

    let firstEvent = await firstEventPromise
    let secondEvent = await secondEventPromise
    await noOtherForceEventPromise

    expect(firstEvent.data.key).toBe('node-new-alert')
    expect(firstEvent.data.nodeId).toBe(node._id)
    expect(firstEvent.data.alert.message).toBe('Network anomaly detected')
    expect(firstEvent.data.alert.severityLevel).toBe('warning')
    expect(typeof firstEvent.data.alert._id).toBe('string')

    expect(secondEvent.data.key).toBe('node-new-alert')
    expect(secondEvent.data.nodeId).toBe(node._id)
  })

  test('marks an alert as acknowledged and broadcasts node-alert-acknowledged to the owning force', async () => {
    let { node, sameForceMemberOne, sameForceMemberTwo, otherForceMember } =
      await prepareAlertSession()
    let alert = node.alert('Acknowledge me', 'danger')

    let requesterEventPromise = TestSocketClient.waitForEvent(
      sameForceMemberOne.socket,
      (event) => (event as any).method === 'node-alert-acknowledged',
    )
    let peerEventPromise = TestSocketClient.waitForEvent(
      sameForceMemberTwo.socket,
      (event) => (event as any).method === 'node-alert-acknowledged',
    )
    let noOtherForceEventPromise = expectNoMatchingEvent(
      otherForceMember.socket,
      (event) => (event as any).method === 'node-alert-acknowledged',
    )

    TestSocketClient.sendJson(sameForceMemberOne.socket, {
      method: 'request-acknowledge-node-alert',
      requestId: TestToolbox.generateRandomId(),
      data: {
        nodeId: node._id,
        alertId: alert._id,
      },
    })

    let requesterEvent = await requesterEventPromise
    let peerEvent = await peerEventPromise
    await noOtherForceEventPromise

    expect(alert.acknowledged).toBe(true)
    expect(requesterEvent.data.nodeId).toBe(node._id)
    expect(requesterEvent.data.alertId).toBe(alert._id)
    expect(peerEvent.data.alertId).toBe(alert._id)
  })

  test('responds with CODE_NODE_ALERT_NOT_FOUND when the alert ID does not exist', async () => {
    let { node, sameForceMemberOne } = await prepareAlertSession()

    TestSocketClient.sendJson(sameForceMemberOne.socket, {
      method: 'request-acknowledge-node-alert',
      requestId: TestToolbox.generateRandomId(),
      data: {
        nodeId: node._id,
        alertId: 'missing-alert',
      },
    })

    let errorEvent = await TestSocketClient.waitForError(
      sameForceMemberOne.socket,
      (event) => event.code === ServerEmittedError.CODE_NODE_ALERT_NOT_FOUND,
    )

    expect(errorEvent.code).toBe(ServerEmittedError.CODE_NODE_ALERT_NOT_FOUND)
  })

  test('scopes node-alert-acknowledged broadcasts to members of the owning force only', async () => {
    let { node, sameForceMemberOne, sameForceMemberTwo, otherForceMember } =
      await prepareAlertSession()
    let alert = node.alert('Scoped alert', 'warning')

    let sameForceEventPromise = TestSocketClient.waitForEvent(
      sameForceMemberTwo.socket,
      (event) =>
        (event as any).method === 'node-alert-acknowledged' &&
        (event as any).data?.alertId === alert._id,
    )
    let noOtherForceEventPromise = expectNoMatchingEvent(
      otherForceMember.socket,
      (event) =>
        (event as any).method === 'node-alert-acknowledged' &&
        (event as any).data?.alertId === alert._id,
    )

    TestSocketClient.sendJson(sameForceMemberOne.socket, {
      method: 'request-acknowledge-node-alert',
      requestId: TestToolbox.generateRandomId(),
      data: {
        nodeId: node._id,
        alertId: alert._id,
      },
    })

    let sameForceEvent = await sameForceEventPromise
    await noOtherForceEventPromise

    expect(sameForceEvent.data.alertId).toBe(alert._id)
  })

  afterAll(async () => {
    for (let sessionId of sessionIdsToCleanup) {
      SessionServer.destroy(sessionId)
    }
    await TestSuiteTeardown.cleanupTestUsers(SUITE_PREFIX)
    await TestSuiteTeardown.cleanupTestMissions(SUITE_PREFIX)
  })
})
