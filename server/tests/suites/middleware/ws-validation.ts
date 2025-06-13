import { expect } from 'chai'
import {
  TRequestEvents,
  TRequestMethod,
  TResponseEvent,
  TServerEvents,
} from 'metis/connect/data'
import UserModel from 'metis/server/database/models/users'
import { testLogger } from 'metis/server/logging'
import SessionServer from 'metis/server/sessions'
import ServerUser from 'metis/server/users'
import StringToolbox from 'metis/toolbox/strings'
import { io, Socket } from 'socket.io-client'
import { userCredentials } from '../../data'
import { agent } from '../../index.test'
import { testServer } from '../../server'
import { missionToLaunch } from '../../setup'

/**
 * Tests for the middleware function used to validate the data sent in the request body of the API routes.
 */
export default function WsValidation(): Mocha.Suite {
  let loginIdCookie: string
  let socket: Socket
  let sessionOwner: ServerUser
  let session: SessionServer

  /**
   * Establishes a login with the server and retrieves
   * the login ID cookie. This can be used to authorize
   * a web-socket connection.
   * @returns The login ID cookie.
   * @throws If the login ID cookie cannot be retrieved.
   */
  async function getLoginIdCookie(): Promise<string> {
    // Logout and login to create a new session.
    let response = await agent.delete('/api/v1/logins/')
    response = await agent.post('/api/v1/logins/').send(userCredentials)

    // Extract the Session ID cookie from the response.
    const cookies = response.header['set-cookie']
    let sidCookie: string = ''
    sidCookie = cookies.find((cookie: any) => cookie.startsWith('connect.sid='))
    if (!sidCookie) {
      throw Error('Failed to retrieve login ID cookie.')
    }
    sidCookie = sidCookie.split(';')[0]

    return sidCookie
  }

  /**
   * Gets the owner of the session from the database.
   */
  async function getOwner(): Promise<ServerUser> {
    let userDoc = await UserModel.findOne({
      username: userCredentials.username,
    }).exec()
    expect(userDoc).to.not.equal(null)
    return ServerUser.fromExistingJson(userDoc!)
  }

  /**
   * Creates WS connection to the server with the given
   * session ID cookie.
   * @param sessionIdCookie The session ID cookie to authorize the connection.
   * @return The web-socket connection.
   */
  async function createSocket(sessionIdCookie: string): Promise<Socket> {
    // Define web-socket arguments.
    let url: string = `ws://localhost:${testServer.port}`
    let extraHeaders: Record<string, string> = {
      Cookie: sessionIdCookie,
    }

    // Create a new web socket connection.
    let socket = io(url, {
      transportOptions: {
        polling: {
          extraHeaders,
        },
      },
    })

    // Await the connection to the WS server.
    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve()
      })
      socket.on('connect_error', (error) => {
        testLogger.error('Failed to connect to the WS server.')
        testLogger.error(error)
        throw error
      })
    })

    return socket
  }

  /**
   * Makes a request using the current socket connection.
   * @param payload The payload to send in the request,
   * minus the request ID, which is automatically generated.
   * @resolves With the response event.
   * @rejects If the request fails.
   */
  function request<TMethod extends TRequestMethod>(
    payload: Omit<TRequestEvents[TMethod], 'requestId'>,
  ) {
    return new Promise<TResponseEvent<any, any, TRequestEvents[TMethod]>>(
      (resolve) => {
        // Create the request event.
        let request = {
          ...payload,
          requestId: StringToolbox.generateRandomId(),
        }

        // Add a listener for the response event.
        socket.on('message', (data) => {
          let response = JSON.parse(data)

          // If the event is not a response to the request,
          // abort.
          if (
            !response.request ||
            !response.request.event ||
            !response.request.event.requestId ||
            response.request.event.requestId !== request.requestId
          ) {
            return
          }

          // If the response is fulfilled, resolve.
          if (response.request.fulfilled) {
            resolve(response)
          }
        })

        // Emit the request.
        socket.emit('message', JSON.stringify(request))
      },
    )
  }

  /**
   * Joins the session with the given session ID.
   * @param sessionId The session ID to join.
   * @resolves With the response event.
   */
  function joinSession(
    sessionId: string,
  ): Promise<TServerEvents['session-joined'] | TServerEvents['error']> {
    return request({
      method: 'request-join-session',
      data: {
        sessionId,
      },
    })
  }

  return describe('WS Validation', function () {
    this.beforeAll(async () => {
      // Before running the tests, get a login ID cookie.
      loginIdCookie = await getLoginIdCookie()
      // Create a new socket connection.
      socket = await createSocket(loginIdCookie)
      // Then get the owner that will be used for
      // any session that are launched.
      sessionOwner = await getOwner()
    })

    this.beforeEach(async () => {
      // Launch a new session.
      session = SessionServer.launch(missionToLaunch, {}, sessionOwner)
    })

    this.afterEach(async () => {
      // After each test, remove all listeners from
      // the socket.
      socket.removeAllListeners()
      // After each test, destroy the session.
      session.destroy()
    })

    it('Sending an improperly formatted message should return a 10001 code.', async function () {
      await new Promise<void>((resolve) => {
        socket.on('message', (message) => {
          let event = JSON.parse(message)
          expect(event?.code).to.equal(10001)
          resolve()
        })

        socket.emit('message', 'invalid data')
      })
    })

    it("Requesting to join a session with properly formatted data, should return a 'session-joined' event.", async function () {
      let response = await joinSession(session._id)
      expect(response.method).to.equal('session-joined')
    })

    it("Requesting to update the config with proper values should return a 'session-config-updated' event.", async function () {
      // Make prerequisite requests.
      await joinSession(session._id)

      // Request config update.
      let response = await request({
        method: 'request-config-update',
        data: {
          config: {
            effectsEnabled: false,
            infiniteResources: true,
          },
        },
      })
      expect(response.method).to.equal('session-config-updated')
    })

    it('Requesting to update the config with improper values should return a 10001 code.', async function () {
      // Make prerequisite requests.
      await joinSession(session._id)

      // Request config update.
      let response: any = await request({
        method: 'request-config-update',
        data: {
          config: {
            effectsEnabled: 'improper-value', // Should be a boolean.
            infiniteResources: true,
          },
        },
      })
      expect(response.method).to.equal('error')
      expect(response.code).to.equal(10001)
    })
  })
}
