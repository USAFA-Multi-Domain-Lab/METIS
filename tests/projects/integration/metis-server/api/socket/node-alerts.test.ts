import { afterEach, describe, expect, test } from '@jest/globals'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { TestSession } from 'tests/helpers/TestSession'
import { TestToolbox } from 'tests/helpers/TestToolbox'

describe('Node alert socket networking', () => {
  const SUITE_PREFIX = 'test_socket_node_alert'

  /**
   * Launches a started session with two members on the first force and
   * one member on the second, so that force-scoped broadcasts can be
   * distinguished from leaks.
   */
  async function prepareAlertSession() {
    let context = await TestSession.launch({
      namePrefix: SUITE_PREFIX,
      mission: {
        // Session-start effects only slow the start phase down, and this
        // suite never executes an action, so they are stripped.
        customize: (payload) => {
          payload.effects = []
        },
      },
      members: [{ force: 0 }, { force: 0 }, { force: 1 }],
      start: true,
    })

    let [sameForceMemberOne, sameForceMemberTwo, otherForceMember] =
      context.members
    let realm = sameForceMemberOne.member.subscribedRealm
    let node = sameForceMemberOne.member.assignedForce!.nodes[0]

    expect(realm).toBeTruthy()
    expect(node).toBeTruthy()
    expect(node.revealed).toBe(true)

    return {
      context,
      realm,
      node,
      sameForceMemberOne,
      sameForceMemberTwo,
      otherForceMember,
    }
  }

  afterEach(() => {
    TestSession.disposeAll()
  })

  test('broadcasts a node-new-alert modifier to members of the relevant force', async () => {
    let {
      realm,
      node,
      sameForceMemberOne,
      sameForceMemberTwo,
      otherForceMember,
    } = await prepareAlertSession()

    let firstEventPromise = TestSession.waitFor(
      sameForceMemberOne,
      'node-alert-added',
    )
    let secondEventPromise = TestSession.waitFor(
      sameForceMemberTwo,
      'node-alert-added',
    )
    let noOtherForceEventPromise = TestSession.expectNoEvent(
      otherForceMember,
      'node-alert-added',
    )

    realm.addNodeAlert([node], 'Network anomaly detected', 'warning')

    // Awaited together so the no-event rejection always has a handler
    // attached; awaiting it last would leave it briefly unhandled.
    let [firstEvent, secondEvent] = await Promise.all([
      firstEventPromise,
      secondEventPromise,
      noOtherForceEventPromise,
    ])

    expect(firstEvent.data.ids[0].nodeId).toBe(node._id)
    expect(firstEvent.data.message).toBe('Network anomaly detected')
    expect(firstEvent.data.severityLevel).toBe('warning')
    expect(typeof firstEvent.data.ids[0].alertId).toBe('string')

    expect(secondEvent.data.ids[0].nodeId).toBe(node._id)
  })

  test('marks an alert as acknowledged and broadcasts node-alert-acknowledged to the owning force', async () => {
    let { node, sameForceMemberOne, sameForceMemberTwo, otherForceMember } =
      await prepareAlertSession()
    let alert = node.alert('Acknowledge me', 'danger')

    let requesterEventPromise = TestSession.waitFor(
      sameForceMemberOne,
      'node-alert-acknowledged',
    )
    let peerEventPromise = TestSession.waitFor(
      sameForceMemberTwo,
      'node-alert-acknowledged',
    )
    let noOtherForceEventPromise = TestSession.expectNoEvent(
      otherForceMember,
      'node-alert-acknowledged',
    )

    TestSession.send(sameForceMemberOne, {
      method: 'request-acknowledge-node-alert',
      requestId: TestToolbox.generateRandomId(),
      data: {
        nodeId: node._id,
        alertId: alert._id,
      },
    })

    let [requesterEvent, peerEvent] = await Promise.all([
      requesterEventPromise,
      peerEventPromise,
      noOtherForceEventPromise,
    ])

    expect(alert.acknowledged).toBe(true)
    expect(requesterEvent.data.nodeId).toBe(node._id)
    expect(requesterEvent.data.alertId).toBe(alert._id)
    expect(peerEvent.data.alertId).toBe(alert._id)
  })

  test('responds with CODE_NODE_ALERT_NOT_FOUND when the alert ID does not exist', async () => {
    let { node, sameForceMemberOne } = await prepareAlertSession()

    TestSession.send(sameForceMemberOne, {
      method: 'request-acknowledge-node-alert',
      requestId: TestToolbox.generateRandomId(),
      data: {
        nodeId: node._id,
        alertId: 'missing-alert',
      },
    })

    let errorEvent = await TestSession.waitForError(
      sameForceMemberOne,
      ServerEmittedError.CODE_NODE_ALERT_NOT_FOUND,
    )

    expect(errorEvent.code).toBe(ServerEmittedError.CODE_NODE_ALERT_NOT_FOUND)
  })

  test('scopes node-alert-acknowledged broadcasts to members of the owning force only', async () => {
    let { node, sameForceMemberOne, sameForceMemberTwo, otherForceMember } =
      await prepareAlertSession()
    let alert = node.alert('Scoped alert', 'warning')

    let sameForceEventPromise = TestSession.waitFor(
      sameForceMemberTwo,
      (event: any) =>
        event.method === 'node-alert-acknowledged' &&
        event.data?.alertId === alert._id,
    )
    let noOtherForceEventPromise = TestSession.expectNoEvent(
      otherForceMember,
      (event) =>
        event.method === 'node-alert-acknowledged' &&
        event.data?.alertId === alert._id,
    )

    TestSession.send(sameForceMemberOne, {
      method: 'request-acknowledge-node-alert',
      requestId: TestToolbox.generateRandomId(),
      data: {
        nodeId: node._id,
        alertId: alert._id,
      },
    })

    let [sameForceEvent] = await Promise.all([
      sameForceEventPromise,
      noOtherForceEventPromise,
    ])

    expect(sameForceEvent.data.alertId).toBe(alert._id)
  })
})
