import { TClientEvents, TServerEvents, TServerMethod } from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import { TCommonMissionJson, TMissionJsonOptions } from 'metis/missions'
import { TCommonOutputJson } from 'metis/missions/forces/output'
import ServerMission, { TServerMissionTypes } from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerMissionNode from 'metis/server/missions/nodes'
import Session, {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
} from 'metis/sessions'
import { TSessionMemberJson } from 'metis/sessions/members'
import MemberRole, { TMemberRoleId } from 'metis/sessions/members/roles'
import { SingleTypeObject } from 'metis/toolbox/objects'
import { TCommonUser } from 'metis/users'
import { v4 as generateHash } from 'uuid'
import ClientConnection from '../connect/clients'
import { plcApiLogger } from '../logging'
import ServerActionExecution from '../missions/actions/executions'
import ServerMissionForce from '../missions/forces'
import ServerOutput, { TServerOutputOptions } from '../missions/forces/output'
import EnvironmentContextProvider from '../target-environments/context-provider'
import ServerUser from '../users'
import ServerSessionMember from './members'

/**
 * Server instance for sessions. Handles server-side logic for a session with participating clients. Communicates with clients to conduct the session.
 */
export default class SessionServer extends Session<TServerMissionTypes> {
  // Overridden.
  public get state() {
    return this._state
  }

  /**
   * Whether the session has been destroyed.
   */
  private _destroyed: boolean

  /**
   * Whether the session has been destroyed.
   */
  public get destroyed(): boolean {
    return this._destroyed
  }

  /**
   * The context provider for the target environment.
   */
  public environmentContextProvider: EnvironmentContextProvider

  /**
   * Assignments of users to forces (userID to forceID).
   * @note Assignments are also stored in the `SessionMember` class,
   * but this will help with rejoining, since a new `SessionMember`
   * object is created each time a user joins.
   */
  private assignments: SingleTypeObject<{
    forceId: string
    roleId: TMemberRoleId
  }>

  public constructor(
    _id: string,
    name: string,
    ownerId: string,
    config: Partial<TSessionConfig>,
    mission: ServerMission,
  ) {
    super(_id, name, ownerId, config, mission, [], [])
    this._state = 'unstarted'
    this._destroyed = false
    this.register()
    this.environmentContextProvider = new EnvironmentContextProvider(this)
    this.assignments = {}
  }

  // Implemented
  protected parseMemberData(data: TSessionMemberJson[]): ServerSessionMember[] {
    // Returns empty array, since the data
    // should never need to be parsed.
    return []
  }

  /**
   * Gets the users that have access to the force with the given ID.
   * @param forceId The ID of the force.
   * @returns The users.
   */
  public getMembersForForce(forceId: string): ServerSessionMember[] {
    let x: TServerMissionTypes['member']
    // Get all members that either have complete visibility
    // or are assigned to the force with the given ID.
    return [
      ...this.members.filter(
        (member) =>
          member.isAuthorized('completeVisibility') ||
          member.forceId === forceId,
      ),
    ]
  }

  // Implemented
  public toJson(options: TSessionServerJsonOptions = {}): TSessionJson {
    // Gather details.
    const { requester } = options
    let missionOptions: TMissionJsonOptions = { exportType: 'session-limited' }
    let banList: string[] = []

    // Handler a requester being passed.
    if (requester) {
      // Gather details.
      let { forceId } = requester

      // If the requester is assigned to a force,
      // then update the mission options to include
      // data pertinent to the force.
      if (forceId) {
        missionOptions = {
          exportType: 'session-force-specific',
          forceId,
          userId: requester.userId,
        }
      }

      // If the requester has complete visibility,
      // then update the mission options to include
      // all data.
      if (requester.isAuthorized('completeVisibility')) {
        missionOptions = {
          exportType: 'session-complete',
          userId: requester.userId,
        }
      }

      // If the requester is authorized to manager
      // users, then include the ban list.
      if (requester.isAuthorized('manageSessionMembers')) banList = this.banList
    }

    // Construct JSON.
    let json: TSessionJson = {
      _id: this._id,
      state: this.state,
      name: this.name,
      ownerId: this.ownerId,
      mission: this.mission.toJson(missionOptions),
      members: this._members.map((member) => member.toJson()),
      banList,
      config: this.config,
    }

    return json
  }

  // Implemented
  public toBasicJson(
    options: TSessionServerJsonOptions = {},
  ): TSessionBasicJson {
    // Gather details.
    const { requester } = options
    let banList: string[] = []

    // If the requester is authorized to write
    // to sessions, include the ban list.
    if (requester?.user.isAuthorized('sessions_write')) {
      banList = this.banList
    }

    // Construct and return JSON.
    return {
      _id: this._id,
      missionId: this.missionId,
      name: this.name,
      ownerId: this.ownerId,
      config: this.config,
      participantIds: this.participants.map(({ userId: userId }) => userId),
      banList,
      observerIds: this.observers.map(({ userId: userId }) => userId),
      managerIds: this.managers.map(({ userId: userId }) => userId),
    }
  }

  /**
   * Gets the role of the given user in the session.
   */
  public getRole(userId: TCommonUser['_id']): MemberRole | undefined {
    return this.getMemberByUserId(userId)?.role
  }

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ServerMissionAction>()

    // Loops through and maps each action.
    this.mission.forces.forEach((force) =>
      force.nodes.forEach((node) =>
        node.actions.forEach((action) => this.actions.set(action._id, action)),
      ),
    )
  }

  /**
   * Adds this session into the registry, indexing it with its session ID.
   */
  private register(): void {
    SessionServer.registry.set(this._id, this)
  }

  /**
   * Removes this session from the registry.
   */
  private unregister(): void {
    SessionServer.registry.delete(this._id)
  }

  /**
   * Destroys the session.
   */
  public destroy(): void {
    // Unregister session.
    this.unregister()
    // Mark as destroyed.
    this._destroyed = true
    // Grab all members.
    let members: ServerSessionMember[] = this.members
    // Clear all members.
    this.clearMembers()
    // Clear assignments.
    this.assignments = {}
    // Emit an event to all users that the session has been destroyed.
    for (let { connection } of members) {
      connection.emit('session-destroyed', { data: { sessionId: this._id } })
    }
  }

  /**
   * Has the given client connection join as a member of the session.
   * @param client The user joining the session.
   * @returns The new `ServerSessionMember` object that was created.
   * @throws The server emitted error code of any error that occurs.
   * @note Establishes listeners to handle events emitted by the user's web socket connection.
   */
  public join(client: ClientConnection): ServerSessionMember {
    let userId = client.userId
    let assignment = this.assignments[userId] ?? {}
    let roleId: TMemberRoleId | null
    let forceId: string | null = assignment.forceId ?? null
    let isUnstarted = this._state === 'unstarted'

    // Throw error if the user is in the ban list.
    if (this._banList.includes(client.userId)) {
      throw ServerEmittedError.CODE_SESSION_BANNED
    }
    // Throw error if the user is already in the session.
    if (this.isJoined(client.userId)) {
      throw ServerEmittedError.CODE_ALREADY_IN_SESSION
    }

    // If the user already has an assigned role, then
    // join with that role.
    if (assignment.roleId) {
      roleId = assignment.roleId
    }
    // If the user is authorized to join as a manager,
    // then join as a manager.
    else if (client.user.isAuthorized('sessions_join_manager')) {
      roleId = MemberRole.AVAILABLE_ROLES.manager._id
    }
    // If the user is authorized to join as a manager
    // of native forces, and the client is the owner of
    // this session, then join as a manager.
    else if (
      client.user.isAuthorized('sessions_join_manager_native') &&
      this.ownerId === userId
    ) {
      roleId = MemberRole.AVAILABLE_ROLES.manager._id
    }
    // If the user is authorized to join as an observer,
    // then join as an observer.
    else if (client.user.isAuthorized('sessions_join_observer')) {
      roleId = MemberRole.AVAILABLE_ROLES.observer._id
    }
    // If the user is authorized to join as a participant,
    // then join as a participant.
    else if (client.user.isAuthorized('sessions_join_participant')) {
      roleId = MemberRole.AVAILABLE_ROLES.participant._id
    }
    // If the user is not authorized to join the session,
    // then throw an error.
    else {
      throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
    }

    // Gather more details.
    let role = MemberRole.get(roleId)
    let hasCompleteVisibility = role.isAuthorized('completeVisibility')
    let isAssigned = forceId !== null

    // If the session is already started, ensure that
    // the member has visibility to at least one force.
    if (!isUnstarted && !hasCompleteVisibility && !isAssigned) {
      throw ServerEmittedError.CODE_SESSION_LATE_JOIN
    }

    // Create a new session member.
    let member = ServerSessionMember.create(client, role, this, forceId)
    // Add event listeners for the member.
    this.addListeners(member)
    // Push the member to the list of members.
    this._members.push(member)

    // Handle joining the session for the client.
    client.login.handleJoin(this._id)

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })

    // Return the new member.
    return member
  }

  /**
   * Handles a new connection by an existing member.
   * @param newConnection The new connection for a member of the session.
   * @returns True if connection was replaced, false if the member wasn't found.
   */
  public handleConnectionChange(newConnection: ClientConnection): boolean {
    // Find the member.
    let member = this._members.find(
      ({ userId }) => userId === newConnection.userId,
    )
    // If the member is found, update the connection.
    if (member) {
      this.removeListeners(member)
      member.connection = newConnection
      this.addListeners(member)
    }
    // Return whether the member was found.
    return !!member
  }

  /**
   * Has the given user (participant or observer) quit the session.
   * @param userId The ID of the user quiting the session.
   * @note Removes any session listeners for the user.
   */
  public quit(userId: string): void {
    // Find the member that quit, if present.
    this._members.forEach((member: ServerSessionMember, index: number) => {
      if (member.userId === userId) {
        // Remove the member from the list.
        this._members.splice(index, 1)
        // Remove session-specific listeners.
        this.removeListeners(member)
        // Handle quitting the session for the member.
        member.connection.login.handleQuit()
      }
    })

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Deletes all members from the session.
   */
  public clearMembers(): void {
    // Remove all members from the session by
    // forcing each member to quit.
    this.members.forEach(({ connection }) => connection.login.handleQuit())
    this.members.forEach((member) => this.removeListeners(member))
    // Clear member list.
    this._members = []
  }

  /**
   * Creates session-specific listeners for the given member.
   */
  private addListeners(member: ServerSessionMember): void {
    let { connection } = member

    connection.addEventListener('request-start-session', (data) =>
      this.onRequestStart(member, data),
    )
    connection.addEventListener('request-end-session', (data) =>
      this.onRequestEnd(member, data),
    )
    connection.addEventListener('request-config-update', (data) =>
      this.onRequestConfigUpdate(member, data),
    )
    connection.addEventListener('request-kick', (data) =>
      this.onRequestKick(member, data),
    )
    connection.addEventListener('request-ban', (data) =>
      this.onRequestBan(member, data),
    )
    connection.addEventListener('request-assign-force', (data) =>
      this.onRequestAssignForce(member, data),
    )
    connection.addEventListener('request-assign-role', (data) =>
      this.onRequestAssignRole(member, data),
    )
    connection.addEventListener('request-open-node', (data) =>
      this.onRequestOpenNode(member, data),
    )
    connection.addEventListener('request-execute-action', (data) =>
      this.onRequestExecuteAction(member, data),
    )
    connection.addEventListener('request-send-output', (data) =>
      this.onRequestSendOutput(member, data),
    )
  }

  /**
   * Removes session-specific listeners for the given participant.
   */
  private removeListeners(member: ServerSessionMember): void {
    member.connection.clearEventListeners([
      'request-start-session',
      'request-end-session',
      'request-config-update',
      'request-kick',
      'request-ban',
      'request-assign-force',
      'request-assign-role',
      'request-open-node',
      'request-execute-action',
    ])
  }

  /**
   * Emits an event to all the members joined in the session.
   * @param method The method of the event to emit.
   * @param payload The payload of the event to emit.
   */
  public emitToAll<
    TMethod extends TServerMethod,
    TPayload extends Omit<TServerEvents[TMethod], 'method'>,
  >(method: TMethod, payload: TPayload): void {
    for (let member of this._members) member.emit(method, payload)
  }

  /**
   * Called when a member requests to start the session.
   * @param member The member requesting to start the session.
   * @param event The event emitted by the member.
   */
  public onRequestStart = (
    member: ServerSessionMember,
    event: TClientEvents['request-start-session'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the session has already previously started,
    // then emit an error.
    if (this._state !== 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request },
        ),
      )
    }

    // Mark the session as started.
    this._state = 'started'

    // Loop through all members and find any
    // that have no force availability, and
    // mark them for dismissal.
    let toDismiss: ServerSessionMember[] = []
    for (let member of this.members) {
      if (!member.isAssigned && !member.isAuthorized('completeVisibility')) {
        toDismiss.push(member)
      }
    }

    // Dismiss members found.
    for (let member of toDismiss) {
      // Remove the member from the list.
      this._members = this._members.filter(({ _id }) => _id !== member._id)
      // Remove session-specific listeners.
      this.removeListeners(member)
      // Handle quitting the session for the member.
      member.connection.login.handleQuit()
      // Emit an event to the member that they have
      // been dismissed.
      member.emit('dismissed', { data: {} })
    }

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })

    // Cache used to not export the same force twice
    // for two members assigned to the same force.
    const assignmentForceCache: SingleTypeObject<TCommonMissionJson> = {}
    // Cache complete visibility export.
    let completeVisibilityCache = this.mission.toJson({
      exportType: 'session-complete',
      userId: member.userId,
    })

    // Loop through members, and emit a start event to
    // all of them, including mission data specific to
    // their permissions.
    for (let member of this.members) {
      let hasCompleteVisibility = member.isAuthorized('completeVisibility')
      let isAssigned = member.isAssigned

      // If the member does not have complete visibility
      // and is assigned to a force, then export force-specific
      // data.
      if (!hasCompleteVisibility && isAssigned) {
        // Get the force ID for the member.
        let forceId = member.forceId!

        // If the force has not been cached, then cache it.
        if (!assignmentForceCache[forceId]) {
          assignmentForceCache[forceId] = this.mission.toJson({
            exportType: 'session-force-specific',
            forceId,
            userId: member.userId,
          })
        }

        // Get relevant data from the mission for the member.
        let { nodeStructure, forces } = assignmentForceCache[forceId]

        // Emit the event to the member.
        member.emit('session-started', {
          data: { nodeStructure, forces },
          request,
        })
      }
      // Else if the member has complete visibility, then
      // provide all data.
      else if (hasCompleteVisibility) {
        // Emit the event to the member.
        member.emit('session-started', {
          data: {
            nodeStructure: completeVisibilityCache.nodeStructure,
            forces: completeVisibilityCache.forces,
          },
          request,
        })
      }
      // Else, export nothing.
      else {
        // Emit the event to the member.
        member.emit('session-started', {
          data: {
            nodeStructure: {},
            forces: [],
          },
          request,
        })
      }
    }
  }

  /**
   * Called when a member requests to end the session.
   * @param member The member requesting to end the session.
   * @param event The event emitted by the member.
   */
  public onRequestEnd = (
    member: ServerSessionMember,
    event: TClientEvents['request-end-session'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the session is not in the 'started' state,
    // then emit an error.
    if (this._state !== 'started') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request },
        ),
      )
    }

    // Mark the session as ended.
    this._state = 'ended'
    // Emit an event to all users that the session has ended.
    this.emitToAll('session-ended', { data: {}, request })

    // Perform clean up.
    this.clearMembers()
    this.destroy()
  }

  /**
   * Called when a member requests to update the configuration
   * for the session.
   * @param member The member requesting to update the configuration.
   * @param event The event emitted by the member.
   */
  public onRequestConfigUpdate = (
    member: ServerSessionMember,
    event: TClientEvents['request-config-update'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('configureSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the session is not in the 'unstarted' state,
    // then emit an error.
    if (this._state !== 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request },
        ),
      )
    }

    // Assign the new configuration to the session.
    Object.assign(this._config, event.data.config)

    // Emit an event to all users that the session configuration
    // has been updated.
    this.emitToAll('session-config-updated', {
      data: { config: this.config },
      request,
    })
  }

  /**
   * Called when a member requests to kick another member from the session.
   * @param member The member requesting to kick another member.
   * @param event The event emitted by the member.
   */
  public onRequestKick = (
    member: ServerSessionMember,
    event: TClientEvents['request-kick'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to kick.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to kick participants,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member has the `manageSessionMembers`
    // permission, then they cannot be kicked.
    if (targetMember.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Remove the member from the list.
    this._members = this._members.filter(
      (member) => member._id !== targetMember._id,
    )
    // Remove session-specific listeners.
    this.removeListeners(targetMember)
    // Handle quitting the session for the member.
    targetMember.connection.login.handleQuit()

    // Emit an event to the target member and to the
    // requester that the target member has been kicked.
    let payload = {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    }
    member.emit('kicked', payload)
    targetMember.emit('kicked', payload)
    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Called when a member requests to ban another member from the session.
   * @param member The member requesting to ban another member.
   * @param event The event emitted by the member.
   */
  public onRequestBan = (
    member: ServerSessionMember,
    event: TClientEvents['request-ban'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId } = event.data
    // Get the target member to ban.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to ban participants,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member has the `manageSessionMembers`
    // permission, then they cannot be banned.
    if (targetMember.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Add the user to the ban list.
    this._banList.push(targetMember.userId)
    // Remove the member from the list.
    this._members = this._members.filter(
      (member) => member._id !== targetMember._id,
    )
    // Remove session-specific listeners.
    this.removeListeners(targetMember)
    // Handle quitting the session for the member.
    targetMember.connection.login.handleQuit()

    // Emit an event to the target member and to the
    // requester that the target member has been banned.
    let payload = {
      data: {
        sessionId: this._id,
        memberId: targetMemberId,
        userId: targetMember.userId,
      },
      request,
    }
    member.emit('banned', payload)
    targetMember.emit('banned', payload)
    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   *  Called when a member requests to assign another member to a force.
   * @param member The member requesting to assign another member to a force.
   * @param event The event emitted by the member.
   */
  public onRequestAssignForce = (
    member: ServerSessionMember,
    event: TClientEvents['request-assign-force'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId, forceId } = event.data
    // Get the target member to assign.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to assign forces,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member does not have the permission
    // to be assigned to a force, then emit an error.
    if (!targetMember.isAuthorized('forceAssignable')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Assign the target member to the force.
    targetMember.forceId = forceId

    // Update the target member's force assignment.
    if (forceId === null) {
      delete this.assignments[targetMember.userId]
    } else {
      let assignment = this.assignments[targetMember.userId] ?? {}
      assignment.forceId = forceId
      this.assignments[targetMember.userId] = assignment
    }

    // Emit a response that the assignment has
    // been made.
    member.emit('force-assigned', {
      data: { sessionId: this._id, memberId: targetMemberId, forceId },
      request,
    })

    // Emit to all members that the user list has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Called when a member requests to assign a role to another member.
   * @param member The member requesting to assign a role to another member.
   * @param event The event emitted by the member.
   */
  public onRequestAssignRole = (
    member: ServerSessionMember,
    event: TClientEvents['request-assign-role'],
  ): void => {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Parse data from event.
    const { memberId: targetMemberId, roleId } = event.data
    // Get the target member to assign.
    const targetMember = this.getMember(targetMemberId)

    // If the member requesting does not have the
    // correct permissions to assign roles,
    // then emit an error.
    if (!member.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request },
        ),
      )
    }
    // If the target member is not found, then emit
    // an error.
    if (!targetMember) {
      return member.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_MEMBER_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the target member has the `manageSessionMembers`
    // permission, then they cannot have their role
    // changed.
    if (targetMember.isAuthorized('manageSessionMembers')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // Assign the target member to the role.
    targetMember.role = MemberRole.get(roleId)

    // Update the target member's role assignment.
    let assignment = this.assignments[targetMember.userId] ?? {}
    assignment.roleId = roleId
    this.assignments[targetMember.userId] = assignment

    // Emit a response that the assignment has
    // been made.
    member.emit('role-assigned', {
      data: { sessionId: this._id, memberId: targetMemberId, roleId: roleId },
      request,
    })

    // Emit to all members that the user list has changed.
    this.emitToAll('session-members-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Called when a member requests to open a node.
   * @param member The member requesting to open a node.
   * @param event The event emitted by the member.
   */
  public onRequestOpenNode = (
    member: ServerSessionMember,
    event: TClientEvents['request-open-node'],
  ): void => {
    // Organize data.
    let mission: ServerMission = this.mission
    let { connection } = member
    let { nodeId } = event.data

    // If the member doesn't have the permission
    // to manipulate nodes, then emit an error.
    if (!member.isAuthorized('manipulateNodes')) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }

    // Find the node, given the ID.
    let node: ServerMissionNode | undefined = mission.getNode(nodeId)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }
    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }
    // If the node is executable, then emit
    // an error.
    if (!node.openable) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_OPENABLE, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }

    try {
      // Open the node.
      node.open()

      // Construct open event payload.
      let payload: TServerEvents['node-opened'] = {
        method: 'node-opened',
        data: {
          nodeId: nodeId,
          revealedChildNodes: node.children.map((node) =>
            node.toJson({ includeSessionData: true }),
          ),
        },
        request: { event, requesterId: member.userId, fulfilled: true },
      }

      // Emit open event.
      for (let { connection } of this.getMembersForForce(node.force._id)) {
        connection.emit('node-opened', payload)
      }
    } catch (error) {
      // Emit an error if the node could not be opened.
      connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: connection.buildResponseReqData(event),
          message: 'Failed to open node.',
        }),
      )
    }
  }

  /**
   * Called when a member requests to execute an action on a node.
   * @param member The member requesting to execute an action.
   * @param event The event emitted by the member.
   * @resolves When the action has been executed or a client error is found.
   */
  public onRequestExecuteAction = async (
    member: ServerSessionMember,
    event: TClientEvents['request-execute-action'],
  ): Promise<void> => {
    // Gather data.
    let { environmentContextProvider, config } = this
    const { effectsEnabled, infiniteResources } = config
    let { connection } = member
    let { actionId, cheats = {} } = event.data
    let { zeroCost } = cheats
    let action: ServerMissionAction | undefined = this.actions.get(actionId)
    let request = connection.buildResponseReqData(event)

    // Clear the cheats if the member is not authorized
    // to use them.
    if (!member.isAuthorized('cheats')) cheats = {}

    // If the member doesn't have the permission
    // to manipulate nodes, then emit an error.
    if (!member.isAuthorized('manipulateNodes')) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          {
            request,
          },
        ),
      )
    }

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request,
          },
        ),
      )
    }
    // If the action is undefined, then emit
    // an error.
    if (action === undefined) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
          request,
        }),
      )
    }
    // If the action is not executable, then
    // emit an error.
    if (!action.node.executable) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
          request,
        }),
      )
    }
    // If the node is not revealed, then
    // emit an error.
    if (!action.node.revealed) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
          request,
        }),
      )
    }
    // If the participant does not have enough
    // resources to execute the action, then
    // emit an error.
    if (
      action.force.resourcesRemaining < action.resourceCost &&
      !zeroCost &&
      !infiniteResources
    ) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
          {
            request,
          },
        ),
      )
    }

    try {
      // Execute the action, awaiting result.
      let outcome = await action.execute({
        sessionConfig: config,
        cheats,
        onInit: (execution: ServerActionExecution) => {
          // Construct payload for action execution
          // initiated event.
          let initiationPayload: TServerEvents['action-execution-initiated'] = {
            method: 'action-execution-initiated',
            data: {
              execution: execution.toJson(),
              resourcesRemaining: action!.force.resourcesRemaining,
            },
            request: {
              event,
              requesterId: member.userId,
              fulfilled: false,
            },
          }

          // Emit action execution initiated event
          // to each member.
          for (let member of this.getMembersForForce(action!.force._id)) {
            member.emit('action-execution-initiated', initiationPayload)
          }

          // Create a new output JSON object.
          let outputJson: Partial<TCommonOutputJson> = {
            key: 'execution-started',
            forceId: action!.force._id,
            nodeId: action!.node._id,
            actionId: action!._id,
            prefix: `${member.user.username.replaceAll(' ', '-')}:`,
          }
          // Send the output JSON to the force.
          this.sendOutput(outputJson, { userId: member.userId, execution })
        },
      })

      // Construct payload for action execution
      // completed event.
      let completionPayload: TServerEvents['action-execution-completed'] = {
        method: 'action-execution-completed',
        data: {
          outcome: outcome.toJson(),
        },
        request,
      }

      // If the action was successful, then...
      if (outcome.successful) {
        // Add child nodes to the completion payload.
        completionPayload.data.revealedChildNodes = action.node.children.map(
          (node) => node.toJson({ includeSessionData: true }),
        )

        // Create a new output JSON object.
        let outputJson: Partial<TCommonOutputJson> = {
          key: 'execution-succeeded',
          forceId: action.force._id,
          nodeId: action.node._id,
          prefix: `${member.user.username.replaceAll(' ', '-')}:`,
          message: action.postExecutionSuccessText,
        }
        // Send the output to the force.
        this.sendOutput(outputJson, { userId: member.userId })

        // If the effects are enabled...
        if (effectsEnabled) {
          // ...iterate through the effects and apply them.
          action.effects.forEach(async (effect) => {
            try {
              // Apply the effect to the target.
              await environmentContextProvider.applyEffect(effect, member.user)

              // todo: implement feedback for modifiers
              // participant.emit('effect-successful', {
              //   message: 'The effect was successfully applied to its target.',
              // })
            } catch (error: any) {
              // Log the error.
              plcApiLogger.error(error)

              // todo: implement feedback for modifiers
              // participant.emitError(
              //   new ServerEmittedError(ServerEmittedError.CODE_EFFECT_FAILED),
              // )
            }
          })
        }
      }
      // Otherwise, if the action failed, then...
      else {
        // Create a new output JSON object.
        let outputJson: Partial<TCommonOutputJson> = {
          key: 'execution-failed',
          forceId: action.force._id,
          nodeId: action.node._id,
          prefix: `${member.user.username.replaceAll(' ', '-')}:`,
          message: action.postExecutionFailureText,
        }
        // Send the output to the force.
        this.sendOutput(outputJson, {
          userId: member.userId,
        })
      }

      // Emit the action execution completed
      // event to each member for the force.
      for (let { connection } of this.getMembersForForce(action.force._id)) {
        connection.emit('action-execution-completed', completionPayload)
      }
    } catch (error) {
      // Emit an error if the action could not be executed.
      connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
          request: connection.buildResponseReqData(event),
          message: 'Failed to execute action.',
        }),
      )
    }
  }

  /**
   * Called when a member requests to send an output.
   * @param member The member requesting to send an output.
   * @param event The event emitted by the member.
   */
  public onRequestSendOutput = (
    member: ServerSessionMember,
    event: TClientEvents['request-send-output'],
  ): void => {
    // Gather details.
    let { key } = event.data
    let request = member.connection.buildResponseReqData(event)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          {
            request,
          },
        ),
      )
    }

    switch (key) {
      case 'pre-execution':
        // Extract the node ID from the event data.
        let { nodeId } = event.data

        // Find the node given the ID.
        let node: ServerMissionNode | undefined = this.mission.getNode(nodeId)

        // If the node is undefined, then emit
        // an error.
        if (node === undefined) {
          return member.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_FOUND, {
              request,
            }),
          )
        }

        // If the node is not revealed, then
        // emit an error.
        if (!node.revealed) {
          return member.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
              request,
            }),
          )
        }

        try {
          if (node.preExecutionText === '') {
            // Emit an event to the participant that the
            // pre-execution message was sent.
            member.emit('output-sent', {
              data: {
                key: 'pre-execution',
                nodeId,
              },
              request: {
                event,
                requesterId: member.userId,
                fulfilled: true,
              },
            })
            return
          }

          // Create a new output JSON object.
          let outputJson: Partial<TCommonOutputJson> = {
            key: 'pre-execution',
            forceId: node.force._id,
            nodeId: node._id,
            prefix: `${member.user.username.replaceAll(' ', '-')}:`,
            message: node.preExecutionText,
          }
          // Send the output to the force.
          this.sendOutput(outputJson, {
            userId: member.userId,
            broadcastType: 'user',
          })

          // Emit an event to the participant that the
          // pre-execution message was sent.
          member.emit('output-sent', {
            data: {
              key: 'pre-execution',
              nodeId,
            },
            request: {
              event,
              requesterId: member.userId,
              fulfilled: true,
            },
          })
        } catch (error: any) {
          // Emit an error if the pre-execution message could not be sent.
          member.emitError(
            new ServerEmittedError(ServerEmittedError.CODE_SERVER_ERROR, {
              request,
              message: 'Failed to send pre-execution message.',
            }),
          )
        }
    }
  }

  /**
   * Handles the blocking and unblocking of a node during a session.
   * @param nodeId The ID of the node to block or unblock.
   * @param forceId The ID of the force that the node belongs to.
   * @param blocked Whether or not the node is blocked.
   */
  public updateNodeBlockStatus = (
    nodeId: ServerMissionNode['_id'],
    forceId: ServerMissionForce['_id'],
    blocked: boolean,
  ) => {
    // Find the node given the ID...
    let node = this.mission.getNode(nodeId)

    // If the node is undefined, then throw
    // an error.
    if (node === undefined) {
      throw new Error(
        `Could not update block status for the node with ID "${nodeId}" in force with ID "${forceId}" because the node was not found.`,
      )
    }

    // Block or unblock the node.
    node.updateBlockStatus(blocked)

    // Emit an event to all members in the force
    // that a modifier has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('modifier-enacted', {
        data: {
          key: 'node-update-block',
          nodeId,
          blocked,
        },
      })
    }
  }

  /**
   * Modifies the success chance of all the node's actions.
   * @param nodeId The ID of the node with the actions to modify.
   * @param forceId The ID of the force that the node belongs to.
   * @param successChanceOperand The operand to modify the success chance by.
   */
  public modifySuccessChance = (
    nodeId: ServerMissionNode['_id'],
    forceId: ServerMissionForce['_id'],
    successChanceOperand: number,
  ) => {
    // Find the node given the ID...
    let node = this.mission.getNode(nodeId)

    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      throw new Error(
        `Could not modify the success chance for all actions in the node with ID "${nodeId}" in force with ID "${forceId}" because the node was not found.`,
      )
    }

    // Modify the success chance for all of its actions.
    node.modifySuccessChance(successChanceOperand)
    // Emit an event to all members in the force
    // that a modifier has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('modifier-enacted', {
        data: {
          key: 'node-action-success-chance',
          nodeId,
          successChanceOperand,
        },
      })
    }
  }

  /**
   * Modifies the processing time of all the node's actions.
   * @param nodeId The ID of the node with the actions to modify.
   * @param forceId The ID of the force that the node belongs to.
   * @param processTimeOperand The operand to modify the process time by.
   */
  public modifyProcessTime = (
    nodeId: ServerMissionNode['_id'],
    forceId: ServerMissionForce['_id'],
    processTimeOperand: number,
  ) => {
    // Find the node given the ID...
    let node = this.mission.getNode(nodeId)

    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      throw new Error(
        `Could not modify the process time for all actions in the node with ID "${nodeId}" in force with ID "${forceId}" because the node was not found.`,
      )
    }

    // Modify the process time for all of its actions.
    node.modifyProcessTime(processTimeOperand)
    // Emit an event to all users in the force
    // that a modifier has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('modifier-enacted', {
        data: {
          key: 'node-action-process-time',
          nodeId,
          processTimeOperand,
        },
      })
    }
  }

  /**
   * Modifies the resource cost of all the node's actions.
   * @param nodeId The ID of the node with the actions to modify.
   * @param forceId The ID of the force that the node belongs to.
   * @param resourceCostOperand The operand to modify the resource cost by.
   */
  public modifyResourceCost = (
    nodeId: ServerMissionNode['_id'],
    forceId: ServerMissionForce['_id'],
    resourceCostOperand: number,
  ) => {
    // Find the node given the ID...
    let node = this.mission.getNode(nodeId)

    // If the node is undefined, then emit
    // an error.
    if (node === undefined) {
      throw new Error(
        `Could not modify the resource cost for all actions in the node with ID "${nodeId}" in force with ID "${forceId}" because the node was not found.`,
      )
    }

    // Modify the resource cost for all of its actions.
    node.modifyResourceCost(resourceCostOperand)
    // Emit an event to all members in the force
    // that a modifier has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('modifier-enacted', {
        data: {
          key: 'node-action-resource-cost',
          nodeId,
          resourceCostOperand,
        },
      })
    }
  }

  /**
   * Sends an output to the force's output panel.
   * @param output The output to send to the force.
   * @param options Options for sending the output.
   */
  public sendOutput = (
    outputJson: Partial<TCommonOutputJson>,
    options: TServerOutputOptions = {},
  ) => {
    // Extract data.
    let { key, forceId } = outputJson

    // Find the force given the ID.
    let force = this.mission.getForce(forceId)

    // If the force is undefined, throw an error.
    if (!force) {
      throw new Error(
        `Could not send output with key "${key}" to the force with ID "${forceId}" because the force was not found.`,
      )
    }

    // Create a new output object.
    let output = new ServerOutput(force, outputJson, options)
    // Store the output in the force.
    force.storeOutput(output)

    // If the broadcast type is "force', then send the output to all members in the force.
    if (output.broadcastType === 'force') {
      for (let member of this.getMembersForForce(force._id)) {
        member.emit('send-output', {
          data: {
            outputData: output.toJson(),
          },
        })
      }
    }

    // If the broadcast type is "user", then send the output to the user.
    if (output.broadcastType === 'user') {
      // If the user ID is not provided, then throw an error.
      if (!output.userId) {
        throw new Error(
          `Could not send output with key "${key}" to the user with ID "${output.userId}" because the user ID was not provided.`,
        )
      }

      // Find the member with the user ID.
      let member = this.getMemberByUserId(output.userId)
      // If the member is not found, then throw an error.
      if (!member) {
        throw new Error(
          `Could not send output with key "${key}" to the user with ID "${output.userId}" because the user was not found in the session.`,
        )
      }

      // Send the output to the member.
      member.emit('send-output', {
        data: {
          outputData: output.toJson(),
        },
      })
    }
  }

  /**
   * A registry of all sessions currently launched.
   */
  private static registry: Map<string, SessionServer> = new Map<
    string,
    SessionServer
  >()

  /**
   * Launches a new session with a new session ID.
   * @param mission The mission from which to launch a session.
   * @param config The configuration for the session.
   * @param ownerId The ID of the user that owns the session.
   * @returns A promise of the session server for the newly launched session.
   */
  public static launch(
    mission: ServerMission,
    config: Partial<TSessionConfig> = {},
    ownerId: ServerUser['_id'],
  ): SessionServer {
    // Generate the intro message output for every force.
    mission.forces.forEach((force) => {
      force.sendIntroMessage()
    })

    return new SessionServer(
      generateHash().substring(0, 12),
      mission.name,
      ownerId,
      config,
      mission,
    )
  }

  /**
   * @returns the session associated with the given session ID.
   */
  public static get(_id: string | undefined): SessionServer | undefined {
    if (_id === undefined) {
      return undefined
    } else {
      return SessionServer.registry.get(_id)
    }
  }

  /**
   * @returns All sessions in the registry.
   */
  public static getAll(): SessionServer[] {
    return Array.from(SessionServer.registry.values())
  }

  /**
   * Destroys the session associated with the given session ID.
   * @param _id The ID of the session to destroy.
   */
  public static destroy(_id: string | undefined): void {
    // Find the session.
    let session: SessionServer | undefined = SessionServer.get(_id)

    // If found...
    if (_id !== undefined && session !== undefined) {
      // Destroy session.
      session.destroy()
    }
  }
}

/* -- TYPES -- */

/**
 * Options for converting a session to JSON.
 */
export type TSessionServerJsonOptions = {
  /**
   * The user client requesting the JSON.
   * @default undefined
   * @note If defined, then only the data accessible by the user will be included.
   */
  requester?: ServerSessionMember
}
