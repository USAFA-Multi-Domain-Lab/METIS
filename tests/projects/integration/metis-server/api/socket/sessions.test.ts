import { afterEach, describe, expect, test } from '@jest/globals'
import { SessionServer } from '@server/sessions/SessionServer'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import { launchPlayableSession } from 'tests/helpers/session/scenarios'
import type { TTestMemberContext } from 'tests/helpers/TestSession'
import { TestSession } from 'tests/helpers/TestSession'
import { TestToolbox } from 'tests/helpers/TestToolbox'

const SUITE_PREFIX = 'test_socket_sessions'

describe('Session lifecycle requests over WebSocket', () => {
  afterEach(() => {
    TestSession.disposeAll()
  })

  /**
   * Sends a lifecycle request from the given member and waits for the
   * unauthorized-operation error that answers it.
   * @param memberContext The member sending the request.
   * @param method The lifecycle request to send.
   * @resolves With the error event answering the request.
   * @rejects If no matching error arrives before the timeout.
   */
  async function expectUnauthorized(
    memberContext: TTestMemberContext,
    method:
      | 'request-start-session'
      | 'request-end-session'
      | 'request-reset-session',
  ): Promise<any> {
    let requestId = TestToolbox.generateRandomId()
    let error = TestSession.waitForError(
      memberContext,
      (event) =>
        event.code === ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION &&
        event.request?.event?.requestId === requestId,
    )

    TestSession.send(memberContext, { method, requestId, data: {} })

    return await error
  }

  test('rejects a participant starting the session from the lobby', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: SUITE_PREFIX,
      members: [{ force: 0 }],
      start: false,
    })
    let [participant] = context.members

    await expectUnauthorized(participant, 'request-start-session')

    expect(context.session.state).toBe('unstarted')
  })

  test('rejects a participant ending a started session, leaving every member joined', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: SUITE_PREFIX,
      members: [{ force: 0 }],
    })
    let [participant] = context.members
    let joinedCount = context.session.joinedMembers.length

    await expectUnauthorized(participant, 'request-end-session')

    expect(context.session.state).toBe('started')
    expect(context.session.joinedMembers.length).toBe(joinedCount)
  })

  test('rejects a participant resetting a started session, leaving its instance unchanged', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: SUITE_PREFIX,
      members: [{ force: 0 }],
    })
    let [participant] = context.members
    let instanceId = context.session.instanceId

    await expectUnauthorized(participant, 'request-reset-session')

    expect(context.session.state).toBe('started')
    expect(context.session.instanceId).toBe(instanceId)
  })

  test('sends the manager a fulfilled session-ended once a manager-requested end finishes tearing down', async () => {
    let { context } = await launchPlayableSession({
      namePrefix: SUITE_PREFIX,
      members: [{ force: 0 }],
    })
    let requestId = TestToolbox.generateRandomId()
    let ended = TestSession.waitFor(
      context.owner,
      (event: any) =>
        event.method === 'session-ended' &&
        event.request?.event?.requestId === requestId,
    )

    TestSession.send(context.owner, {
      method: 'request-end-session',
      requestId,
      data: {},
    })

    let event = await ended
    expect(event.request.fulfilled).toBe(true)
    expect(SessionServer.get(context.id)).toBeUndefined()
  })
})
