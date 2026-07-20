import type { MetisServer } from '@metis/server/MetisServer'
import type { ServerSessionMember } from '@server/sessions/ServerSessionMember'
import type { ServerSessionRealm } from '@server/sessions/ServerSessionRealm'
import { SessionServer } from '@server/sessions/SessionServer'
import type { TServerMethod } from '@shared/connect'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { Socket } from 'socket.io-client'
import type { TestHttpClient } from 'tests/helpers/TestHttpClient'
import {
  createMissionPayload,
  type TMissionCreatePayload,
} from 'tests/helpers/projects/integration/rest-api/missions/payload'
import { TestSocketClient } from 'tests/helpers/TestSocketClient'
import { TestSuiteSetup } from 'tests/helpers/TestSuiteSetup'
import { TestToolbox } from 'tests/helpers/TestToolbox'

/**
 * Toolbox class for standing up a live METIS session in integration tests
 * through the real launch, join, assign, and start mechanisms.
 * @note This class holds no state of its own. Every launched session is
 * represented by a {@link TTestSessionContext} that is passed back into
 * these utilities, mirroring the {@link TestSocketClient} style.
 * @note Realms and forces are intentionally not exposed here. They are
 * only well-defined relative to a member, so resolve them from a member
 * context using the production getters, such as
 * `memberContext.member.subscribedRealm` and
 * `memberContext.member.assignedForce`.
 */
export abstract class TestSession {
  /**
   * Every session context launched during the current test file, tracked
   * so that {@link TestSession.disposeAll} can tear them all down.
   */
  private static launchedContexts: TTestSessionContext[] = []

  /**
   * The number of milliseconds to wait for a session to finish starting,
   * which includes the target environment setup phase.
   */
  private static readonly START_TIMEOUT = 15000

  /**
   * Launches a session and brings it to the state described by the given
   * options, driving each step through the real mechanisms.
   * @param options See {@link TTestSessionOptions}.
   * @resolves With the context describing the launched session.
   * @rejects If any step of the launch fails.
   */
  public static async launch(
    options: TTestSessionOptions = {},
  ): Promise<TTestSessionContext> {
    let {
      mission = {},
      config = {},
      ownerAccessId = 'instructor',
      members: memberSpecifications = [],
      start = false,
      reveal = start,
      assignmentDriver = 'socket',
      namePrefix = 'test_session',
    } = options

    let { server } = await TestSuiteSetup.createTestContext()

    // The mission is authored by a throwaway administrator, because the
    // 'missions_write' permission is not granted to instructors.
    let authorUser = await TestSession.createUser(namePrefix, 'author', 'admin')
    let author = await TestSession.logInUser(authorUser)
    let missionId = await TestSession.resolveMissionId(
      author.client,
      mission,
      namePrefix,
    )

    // The owner launches the session and acts as its manager, which is
    // what allows it to drive assignment and start requests.
    let ownerUser = await TestSession.createUser(
      namePrefix,
      'owner',
      ownerAccessId,
    )
    let owner = await TestSession.logInUser(ownerUser)
    let sessionName =
      config.name ?? `${namePrefix}_${TestToolbox.generateRandomId()}`
    let launchResponse = await owner.client.post('/api/v1/sessions/launch/', {
      ...config,
      missionId,
      name: sessionName,
    })

    if (launchResponse.status !== 200) {
      throw new Error(
        `Failed to launch test session. Received status ${launchResponse.status}.`,
      )
    }

    let sessionId: string = launchResponse.data.sessionId
    let resolveSession = (): SessionServer => {
      let session = SessionServer.get(sessionId)
      if (!session) {
        throw new Error(
          `Test session "${sessionId}" is no longer on the server.`,
        )
      }
      return session
    }

    let ownerSocket = await TestSocketClient.connect(server, owner.cookieHeader)
    await TestSocketClient.joinSession(ownerSocket, sessionId)

    let context: TTestSessionContext = {
      id: sessionId,
      missionId,
      server,
      assignmentDriver,
      owner: TestSession.createMemberContext(
        resolveSession,
        owner,
        ownerSocket,
        {
          accessId: ownerAccessId,
        },
      ),
      members: [],
      get session(): SessionServer {
        return resolveSession()
      },
      get realms(): ServerSessionRealm[] {
        return resolveSession().realms
      },
      get started(): boolean {
        return resolveSession().state === 'started'
      },
    }

    TestSession.launchedContexts.push(context)

    // Connect and join every requested member.
    for (let specification of memberSpecifications) {
      let memberUser = await TestSession.createUser(
        namePrefix,
        'member',
        specification.accessId ?? 'student',
      )
      let login = await TestSession.logInUser(memberUser)
      let socket = await TestSocketClient.connect(server, login.cookieHeader)
      await TestSocketClient.joinSession(socket, sessionId)
      context.members.push(
        TestSession.createMemberContext(
          resolveSession,
          login,
          socket,
          specification,
        ),
      )
    }

    // Roles are applied before forces, because only force-assignable
    // roles may be given a force.
    for (let memberContext of context.members) {
      if (memberContext.specification.role) {
        await TestSession.assignRole(
          context,
          memberContext,
          memberContext.specification.role,
        )
      }
    }

    // Forces must be assigned before the session starts, because members
    // without a force or realm are dismissed during start.
    for (let memberContext of context.members) {
      if (memberContext.specification.force !== undefined) {
        await TestSession.assignForce(
          context,
          memberContext,
          memberContext.specification.force,
        )
      }
    }

    if (start) await TestSession.start(context)

    // Revealing happens after start, because a member's force is only
    // resolvable once its realm has been minted.
    if (reveal) TestSession.revealAssignedForces(context)

    return context
  }

  /**
   * Assigns a member to a force.
   * @param context The session context.
   * @param memberContext The member to assign.
   * @param force The force to assign, given as an index into the
   * mission's forces, a literal force ID, or `null` to unassign.
   * @resolves Once the assignment has been applied.
   * @rejects If the assignment is rejected by the server.
   */
  public static async assignForce(
    context: TTestSessionContext,
    memberContext: TTestMemberContext,
    force: number | string | null,
  ): Promise<void> {
    let forceId =
      force === null ? null : TestSession.resolveForceId(context, force)

    if (context.assignmentDriver === 'direct') {
      memberContext.member.assignToForce(forceId)
      return
    }

    let memberId = memberContext.member._id
    await TestSession.requestAndAwait(
      context.owner.socket,
      {
        method: 'request-assign-force',
        requestId: TestToolbox.generateRandomId(),
        data: { memberId, forceId },
      },
      (event) =>
        event.method === 'force-assigned' && event.data?.memberId === memberId,
    )
  }

  /**
   * Assigns a member to a role.
   * @param context The session context.
   * @param memberContext The member to assign.
   * @param roleId The role to assign.
   * @resolves Once the assignment has been applied.
   * @rejects If the assignment is rejected by the server.
   */
  public static async assignRole(
    context: TTestSessionContext,
    memberContext: TTestMemberContext,
    roleId: TMemberRoleId,
  ): Promise<void> {
    if (context.assignmentDriver === 'direct') {
      memberContext.member.assignToRole(roleId)
      return
    }

    let memberId = memberContext.member._id
    await TestSession.requestAndAwait(
      context.owner.socket,
      {
        method: 'request-assign-role',
        requestId: TestToolbox.generateRandomId(),
        data: { memberId, roleId },
      },
      (event) =>
        event.method === 'role-assigned' && event.data?.memberId === memberId,
    )
  }

  /**
   * Starts the session by having the owner issue a real start request,
   * which mints the session's realms.
   * @param context The session context.
   * @resolves Once the session has reported that it started.
   * @rejects If the session fails to start.
   */
  public static async start(context: TTestSessionContext): Promise<void> {
    await TestSession.requestAndAwait(
      context.owner.socket,
      {
        method: 'request-start-session',
        requestId: TestToolbox.generateRandomId(),
        data: {},
      },
      (event) => event.method === 'session-started',
      TestSession.START_TIMEOUT,
    )
  }

  /**
   * Sends a payload over a member's socket.
   * @param memberContext The member sending the payload.
   * @param payload The payload to send.
   */
  public static send<TPayload = unknown>(
    memberContext: TTestMemberContext,
    payload: TPayload,
  ): void {
    TestSocketClient.sendJson(memberContext.socket, payload)
  }

  /**
   * Waits for the next event on a member's socket.
   * @param memberContext The member whose socket is observed.
   * @param matcher The method name of the expected event, or a predicate
   * for matching on more than the method.
   * @param timeoutMs Timeout in milliseconds.
   * @resolves With the matched event.
   * @rejects If the timeout elapses.
   */
  public static async waitFor<TEvent = any>(
    memberContext: TTestMemberContext,
    matcher: TTestEventMatcher<TEvent>,
    timeoutMs: number = 5000,
  ): Promise<TEvent> {
    return await TestSocketClient.waitForEvent(
      memberContext.socket,
      TestSession.toEventPredicate(matcher),
      timeoutMs,
    )
  }

  /**
   * Waits for an error event on a member's socket.
   * @param memberContext The member whose socket is observed.
   * @param matcher The code of the expected error, or a predicate for
   * matching on more than the code. Matches any error when omitted.
   * @param timeoutMs Timeout in milliseconds.
   * @resolves With the matched error event.
   * @rejects If the timeout elapses.
   */
  public static async waitForError(
    memberContext: TTestMemberContext,
    matcher: TTestErrorMatcher | undefined = undefined,
    timeoutMs: number = 5000,
  ): Promise<any> {
    let predicate =
      typeof matcher === 'number'
        ? (event: any) => event.code === matcher
        : matcher

    return await TestSocketClient.waitForError(
      memberContext.socket,
      predicate,
      timeoutMs,
    )
  }

  /**
   * Asserts that no matching event arrives on a member's socket within
   * the given window.
   * @param memberContext The member whose socket is observed.
   * @param matcher The method name of the event that must not arrive, or
   * a predicate for matching on more than the method.
   * @param timeoutMs How long to listen before concluding none arrived.
   * @resolves If no matching event arrived.
   * @rejects If a matching event arrived.
   */
  public static async expectNoEvent(
    memberContext: TTestMemberContext,
    matcher: TTestEventMatcher,
    timeoutMs: number = 500,
  ): Promise<void> {
    let predicate = TestSession.toEventPredicate(matcher)

    await new Promise<void>((resolve, reject) => {
      let cleanedUp = false
      let cleanup = () => {
        if (cleanedUp) return
        cleanedUp = true
        clearTimeout(timer)
        memberContext.socket.off('message', handleMessage)
      }

      let timer = setTimeout(() => {
        cleanup()
        resolve()
      }, timeoutMs)

      let handleMessage = (raw: string | object) => {
        try {
          let event = typeof raw === 'string' ? JSON.parse(raw) : raw
          if (predicate(event)) {
            cleanup()
            reject(
              new Error(
                `Unexpected socket event "${event.method}" was received.`,
              ),
            )
          }
        } catch (error) {
          cleanup()
          reject(error)
        }
      }

      memberContext.socket.on('message', handleMessage)
    })
  }

  /**
   * Disconnects every socket belonging to a session context and destroys
   * the session on the server.
   * @param context The session context to dispose.
   */
  public static dispose(context: TTestSessionContext): void {
    for (let memberContext of [context.owner, ...context.members]) {
      memberContext.socket.disconnect()
    }

    SessionServer.destroy(context.id)
    TestSession.launchedContexts = TestSession.launchedContexts.filter(
      (launched) => launched !== context,
    )
  }

  /**
   * Disposes every session launched through {@link TestSession.launch}
   * that has not already been disposed.
   * @note Intended for use in an `afterEach` or `afterAll` hook.
   */
  public static disposeAll(): void {
    for (let context of [...TestSession.launchedContexts]) {
      TestSession.dispose(context)
    }

    TestSession.launchedContexts = []
  }

  /**
   * Sets `revealAllNodes` on the realm-side force of every member that
   * has one, so that alerts and nodes are visible to them.
   * @param context The session context.
   */
  private static revealAssignedForces(context: TTestSessionContext): void {
    for (let memberContext of context.members) {
      let assignedForce = memberContext.member.assignedForce
      if (assignedForce) assignedForce.revealAllNodes = true
    }
  }

  /**
   * Normalizes an event matcher into a predicate.
   * @param matcher A method name to match on, or a predicate to use
   * as-is.
   * @returns The predicate to match events with.
   */
  private static toEventPredicate<TEvent = any>(
    matcher: TTestEventMatcher<TEvent>,
  ): (event: TEvent) => boolean {
    if (typeof matcher === 'function') return matcher

    return (event: TEvent) => (event as any)?.method === matcher
  }

  /**
   * Sends a socket request and waits for either its matching response or
   * a server error, so that rejected requests fail fast and legibly
   * instead of timing out.
   * @param socket The socket issuing the request.
   * @param payload The request payload to send.
   * @param isResponse Predicate identifying the successful response.
   * @param timeoutMs Timeout in milliseconds.
   * @resolves With the matched response event.
   * @rejects If the server responded with an error or the timeout elapsed.
   */
  private static async requestAndAwait(
    socket: Socket,
    payload: { method: string; requestId: string; data: unknown },
    isResponse: (event: any) => boolean,
    timeoutMs: number = 5000,
  ): Promise<any> {
    let responsePromise = TestSocketClient.waitForEvent(
      socket,
      (event: any) => isResponse(event) || event.method === 'error',
      timeoutMs,
    )

    TestSocketClient.sendJson(socket, payload)

    let event = await responsePromise
    if (event.method === 'error') {
      throw new Error(
        `Socket request "${payload.method}" failed with code "${event.code}".`,
      )
    }

    return event
  }

  /**
   * Resolves a force reference into a force ID.
   * @param context The session context.
   * @param force A force index into the mission's forces, or a literal
   * force ID.
   * @returns The resolved force ID.
   * @note Indexes are resolved against the session's template mission,
   * whose force IDs are preserved in every minted realm copy.
   */
  private static resolveForceId(
    context: TTestSessionContext,
    force: number | string,
  ): string {
    if (typeof force === 'string') return force

    let forces = context.session.mission.forces
    let resolved = forces[force]

    if (!resolved) {
      throw new Error(
        `Force index ${force} is out of range. The mission has ${forces.length} force(s).`,
      )
    }

    return resolved._id
  }

  /**
   * Builds a member context whose `member` resolves live from the
   * session, so that it survives the member being replaced on rejoin.
   */
  private static createMemberContext(
    resolveSession: () => SessionServer,
    login: TTestLogin,
    socket: Socket,
    specification: TTestMemberSpecification,
  ): TTestMemberContext {
    return {
      client: login.client,
      socket,
      userId: login.userId,
      specification,
      get member(): ServerSessionMember {
        let member = resolveSession().members.find(
          (candidate) => candidate.userId === login.userId,
        )

        if (!member) {
          throw new Error(
            `No session member was found for user "${login.userId}".`,
          )
        }

        return member
      },
    }
  }

  /**
   * Creates a test user with its own HTTP client.
   * @param namePrefix Prefix identifying the suite the user belongs to.
   * @param suffix Label describing the user's part in the session.
   * @param accessId The access level to create the user with.
   * @returns The created user and the credentials needed to log it in.
   * @note Each user is given its own client because {@link TestHttpClient}
   * keeps a cookie jar, which users would otherwise overwrite for one
   * another.
   */
  private static async createUser(
    namePrefix: string,
    suffix: string,
    accessId: TTestAccessId,
  ): Promise<TTestUser> {
    let { client } = await TestSuiteSetup.createTestContext()
    let username = `${namePrefix}_${suffix}_${TestToolbox.generateRandomId()}`
    let password = TestToolbox.DEFAULT_PASSWORD
    let createResult = await TestSuiteSetup.createTestUser({
      username,
      password,
      accessId,
    })
    let userId = createResult.user._id

    if (!userId) {
      throw new Error(`Created test user "${username}" was given no ID.`)
    }

    return { client, userId, username, password }
  }

  /**
   * Logs a created user in and captures the cookie header needed to open
   * an authenticated socket for it.
   * @param user The user to log in.
   * @returns The logged-in user's client, ID, and cookie header.
   */
  private static async logInUser(user: TTestUser): Promise<TTestLogin> {
    let loginResponse = await user.client.post('/api/v1/logins/', {
      username: user.username,
      password: user.password,
    })

    if (loginResponse.status !== 200) {
      throw new Error(
        `Failed to log in test user "${user.username}". Received status ${loginResponse.status}.`,
      )
    }

    return {
      client: user.client,
      userId: user.userId,
      cookieHeader: TestSocketClient.buildCookieHeader(
        loginResponse.headers['set-cookie'],
      ),
    }
  }

  /**
   * Resolves the mission the session will be launched from, either by
   * copying an existing mission or by creating one from a payload.
   */
  private static async resolveMissionId(
    client: TestHttpClient,
    mission: TTestMissionOptions,
    namePrefix: string,
  ): Promise<string> {
    let missionName = `${namePrefix}_mission_${TestToolbox.generateRandomId()}`

    if (mission.missionId) {
      let copyResponse = await client.post('/api/v1/missions/copy/', {
        originalId: mission.missionId,
        copyName: missionName,
      })

      if (copyResponse.status !== 200) {
        throw new Error(
          `Failed to copy mission "${mission.missionId}". Received status ${copyResponse.status}.`,
        )
      }

      return copyResponse.data._id
    }

    let payload = mission.payload ?? createMissionPayload(missionName)
    mission.customize?.(payload)

    let createResponse = await client.post('/api/v1/missions/', payload)

    if (createResponse.status !== 200) {
      throw new Error(
        `Failed to create test mission. Received status ${createResponse.status}.`,
      )
    }

    return createResponse.data._id
  }
}

/* -- TYPES -- */

/**
 * The access levels a test user may be created with.
 */
export type TTestAccessId = 'admin' | 'instructor' | 'student'

/**
 * Identifies a socket event to match.
 * @note Pass the event's method name to match on the method alone, or a
 * predicate when the match depends on the event's data as well.
 */
export type TTestEventMatcher<TEvent = any> =
  TServerMethod | ((event: TEvent) => boolean)

/**
 * Identifies an error event to match.
 * @note Pass a {@link ServerEmittedError} code to match on the code
 * alone, or a predicate for anything more specific.
 */
export type TTestErrorMatcher = number | ((event: any) => boolean)

/**
 * How assignment and role changes are applied.
 * @option 'socket' Drives the real `request-assign-force` and
 * `request-assign-role` events from the owner, so the assignment
 * mechanisms are themselves exercised. This is the default.
 * @option 'direct' Applies the assignment straight to the server member,
 * which is faster but bypasses the real mechanism.
 */
export type TTestAssignmentDriver = 'socket' | 'direct'

/**
 * Describes how the session's mission is obtained.
 * @note When no options are given, a two-force mission is created from
 * {@link createMissionPayload}.
 */
export type TTestMissionOptions = {
  /**
   * The ID of an existing mission to copy for the session.
   */
  missionId?: string
  /**
   * An explicit mission payload to create the mission from.
   */
  payload?: TMissionCreatePayload
  /**
   * Mutates the mission payload before it is created, which is useful
   * for stripping effects or adjusting forces.
   * @note Ignored when {@link missionId} is given.
   */
  customize?: (payload: TMissionCreatePayload) => void
}

/**
 * Describes one member to create, connect, and join to the session.
 */
export type TTestMemberSpecification = {
  /**
   * The access level the member's user is created with.
   * @default 'student'
   */
  accessId?: TTestAccessId
  /**
   * The session role to assign the member before the session starts.
   * @note When omitted, the member keeps the role it is given on join.
   */
  role?: TMemberRoleId
  /**
   * The force to assign the member before the session starts, given as
   * an index into the mission's forces or a literal force ID.
   * @note When omitted, the member is left unassigned, which means it
   * will be dismissed if the session starts and it is force-assignable.
   */
  force?: number | string | null
}

/**
 * Options for {@link TestSession.launch}.
 */
export type TTestSessionOptions = {
  /**
   * How the session's mission is obtained.
   */
  mission?: TTestMissionOptions
  /**
   * Configuration applied to the launched session.
   */
  config?: Partial<TSessionConfig>
  /**
   * The access level of the user that owns and manages the session.
   * @default 'instructor'
   */
  ownerAccessId?: TTestAccessId
  /**
   * The members to create, connect, and join to the session.
   */
  members?: TTestMemberSpecification[]
  /**
   * Whether to start the session once its members are assigned.
   * @note Realms are only minted once the session starts.
   * @default false
   */
  start?: boolean
  /**
   * Whether to reveal all nodes on each member's assigned force after
   * the session starts.
   * @default Matches {@link start}.
   */
  reveal?: boolean
  /**
   * How assignments are applied.
   * @default 'socket'
   */
  assignmentDriver?: TTestAssignmentDriver
  /**
   * Prefix applied to generated user, mission, and session names.
   * @default 'test_session'
   */
  namePrefix?: string
}

/**
 * A created test user and the credentials needed to log it in.
 */
type TTestUser = {
  /**
   * The HTTP client belonging to the user.
   */
  client: TestHttpClient
  /**
   * The ID of the user.
   */
  userId: string
  /**
   * The generated username of the user.
   */
  username: string
  /**
   * The plain password the user was created with.
   */
  password: string
}

/**
 * A logged-in test user and the material needed to open a socket for it.
 */
type TTestLogin = {
  /**
   * The authenticated HTTP client for the user.
   */
  client: TestHttpClient
  /**
   * The ID of the user.
   */
  userId: string
  /**
   * The cookie header carrying the user's authenticated session.
   */
  cookieHeader: string
}

/**
 * One simulated person in a test session, bundling their connection,
 * their identity, and their live server-side member.
 */
export type TTestMemberContext = {
  /**
   * The authenticated HTTP client for the member's user.
   */
  client: TestHttpClient
  /**
   * The member's websocket connection.
   */
  socket: Socket
  /**
   * The ID of the member's user, which is the stable identity used to
   * resolve {@link member}.
   */
  userId: string
  /**
   * What the caller asked for when creating this member.
   */
  specification: TTestMemberSpecification
  /**
   * The live server-side member for this user.
   * @note Resolved on each access, because the member instance can be
   * replaced when a member quits and rejoins.
   */
  get member(): ServerSessionMember
}

/**
 * The state of a session launched through {@link TestSession.launch}.
 */
export type TTestSessionContext = {
  /**
   * The ID of the launched session.
   */
  id: string
  /**
   * The ID of the mission the session was launched from.
   */
  missionId: string
  /**
   * The running METIS server the session belongs to.
   */
  server: MetisServer
  /**
   * How assignments are applied for this session.
   */
  assignmentDriver: TTestAssignmentDriver
  /**
   * Whether the session is currently in its started state, however it
   * came to be started.
   * @note Read live from the server, so this stays correct when a test
   * drives the start itself rather than calling
   * {@link TestSession.start}. A session that has since ended reads
   * `false`.
   */
  readonly started: boolean
  /**
   * The owner of the session, which acts as its manager.
   */
  owner: TTestMemberContext
  /**
   * The members joined to the session, in the order they were requested.
   */
  members: TTestMemberContext[]
  /**
   * The live server session.
   */
  get session(): SessionServer
  /**
   * The realms currently minted for the session.
   * @note Only useful for session-level assertions, such as confirming
   * how many realms a mode minted. To find the realm a member plays in,
   * use `memberContext.member.subscribedRealm`.
   */
  get realms(): ServerSessionRealm[]
}
