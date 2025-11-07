import type { ClientConnection } from '@server/connect/ClientConnection'
import type { ServerActionExecution } from '@server/missions/actions/ServerActionExecution'
import type { ServerExecutionOutcome } from '@server/missions/actions/ServerExecutionOutcome'
import type { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerEffect } from '@server/missions/effects/ServerEffect'
import type { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import { ServerOutput } from '@server/missions/forces/ServerOutput'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import { ServerMission } from '@server/missions/ServerMission'
import { ServerTargetEnvironment } from '@server/target-environments/ServerTargetEnvironment'
import { TargetEnvContext } from '@server/target-environments/TargetEnvContext'
import type { ServerUser } from '@server/users/ServerUser'
import type {
  TClientEvents,
  TRequestOfResponse,
  TServerEvents,
  TServerMethod,
} from '@shared/connect'
import { ServerEmittedError } from '@shared/connect/errors/ServerEmittedError'
import type {
  TEffectExecutionTriggered,
  TEffectSessionTriggered,
  TEffectTrigger,
} from '@shared/missions/effects/Effect'
import type { TOutputContext } from '@shared/missions/forces/MissionOutput'
import type {
  TMissionJson,
  TMissionJsonOptions,
} from '@shared/missions/Mission'
import type { MissionComponent } from '@shared/missions/MissionComponent'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionMemberJson } from '@shared/sessions/members/SessionMember'
import type {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
} from '@shared/sessions/Session'
import { MissionSession } from '@shared/sessions/Session'
import type { TSingleTypeObject } from '@shared/toolbox/objects/ObjectToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { User } from '@shared/users/User'
import { targetEnvLogger } from '../logging'
import { ServerSessionMember } from './ServerSessionMember'

/**
 * Server instance for sessions. Handles server-side logic for a session with participating clients. Communicates with clients to conduct the session.
 */
export class SessionServer extends MissionSession<TMetisServerComponents> {
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
   * Assignments of users to forces (userID to forceID).
   * @note Assignments are also stored in the `SessionMember` class,
   * but this will help with rejoining, since a new `SessionMember`
   * object is created each time a user joins.
   */
  private assignments: TSingleTypeObject<{
    forceId: string
    roleId: TMemberRoleId
  }>

  public constructor(
    _id: string,
    name: string,
    owner: ServerUser,
    config: Partial<TSessionConfig>,
    mission: ServerMission,
  ) {
    super(
      _id,
      name,
      owner._id,
      owner.username,
      owner.firstName,
      owner.lastName,
      new Date(),
      config,
      mission,
      [],
      [],
    )
    this._state = 'unstarted'
    this._destroyed = false
    this.initializeMission()
    this.register()
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
    let missionOptions: TMissionJsonOptions = {
      forceExposure: { expose: 'none' },
      fileExposure: { expose: 'none' },
      sessionDataExposure: { expose: 'all' },
      rootEffectsExposure: { expose: 'none' },
    }
    let banList: string[] = []

    // Handler a requester being passed.
    if (requester) {
      // Gather details.
      let { forceId } = requester

      // Update the session-data exposure to be user
      // specific to the requester.
      missionOptions.sessionDataExposure = {
        expose: 'member-specific',
        memberId: requester._id,
      }

      // If the requester is assigned to a force,
      // then update the mission options to include
      // data pertinent to the force.
      if (forceId) {
        missionOptions.forceExposure = {
          expose: 'force-with-revealed-nodes',
          forceId,
        }
        missionOptions.fileExposure = {
          expose: 'accessible',
          forceId,
        }
      }

      // If the requester has complete visibility,
      // then update the mission options to expose
      // all force data and file data.
      if (requester.isAuthorized('completeVisibility')) {
        missionOptions.forceExposure = { expose: 'all' }
        missionOptions.fileExposure = { expose: 'all' }
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
      ownerUsername: this.ownerUsername,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      launchedAt: this.launchedAt.toISOString(),
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
    if (requester?.user.isAuthorized('sessions_write_native')) {
      banList = this.banList
    }

    // Construct and return JSON.
    return {
      _id: this._id,
      missionId: this.missionId,
      state: this.state,
      name: this.name,
      ownerId: this.ownerId,
      ownerUsername: this.ownerUsername,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      launchedAt: this.launchedAt.toISOString(),
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
  public getRole(userId: User['_id']): MemberRole | undefined {
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
   * Handles any actions that are executing on a node.
   */
  private async handleExecutions(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      let allExecutions: Promise<void>[] = []

      this.mission.nodes.forEach((node) => {
        if (node.executing) {
          let execution = node.latestExecution!
          execution.abort()

          // Once the execution is aborted, push a promise
          // to the array of all executions.
          execution.addEventListener('aborted', () => {
            allExecutions.push(new Promise((resolve) => resolve()))
          })
        }
      })

      // If there are no executions, resolve.
      if (allExecutions.length === 0) resolve()
      // Resolve all executions.
      await Promise.all(allExecutions)
      resolve()
    })
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

    // If the session is already starting/started, ensure that
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
    client.login.onMetisSessionJoin(this._id)

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
   * Gets the file from the mission with the given ID.
   * @param missionFileId The ID of the file to get.
   * @returns The file, or undefined if not found.
   */
  public getFile(missionFileId: string): ServerMissionFile | undefined {
    return this.mission.files.find(({ _id }) => missionFileId === _id)
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
        // If the session is for testing, then tear it
        // down and destroy it.
        if (this.config.accessibility === 'testing') {
          this._state = 'ending'
          ServerTargetEnvironment.tearDown(this).then(() => {
            this._state = 'ended'
            this.destroy()
          })
        }
        // Handle quitting the session for the member.
        member.connection.login.onMetisSessionQuit()
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
    this.members.forEach(({ connection }) =>
      connection.login.onMetisSessionQuit(),
    )
    this.members.forEach((member) => this.removeListeners(member))
    // Clear member list.
    this._members = []
  }

  /**
   * Initializes the mission for the session.
   */
  private initializeMission(): void {
    this.mission.forces.forEach((force) => {
      // Generate the intro message output for every force.
      force.sendIntroMessage()
      force.handleExcludedNodes()
    })
  }

  // todo: There should be a strict requirement with this method
  // todo: for session-specific event listeners to be added.
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
    connection.addEventListener('request-reset-session', (data) =>
      this.onRequestReset(member, data),
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
      'request-reset-session',
      'request-config-update',
      'request-kick',
      'request-ban',
      'request-assign-force',
      'request-assign-role',
      'request-open-node',
      'request-execute-action',
      'request-send-output',
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
   * Builds and emits the response events to all members of the session
   * when the session is started or is reset.
   * @param member The member that emitted the initial request.
   * @param event The associated request event.
   * @param responseMethod The method of the event to emit (start or reset).
   */
  private emitStartResponses(
    event: TClientEvents['request-start-session' | 'request-reset-session'],
    member: ServerSessionMember,
    responseMethod: 'session-started' | 'session-reset',
  ): void {
    // Build request for response data.
    let request = member.connection.buildResponseReqData(event)
    // Cache used to not export the same force twice
    // for two members assigned to the same force.
    const assignmentForceCache: TSingleTypeObject<TMissionJson> = {}
    // Cache complete visibility export.
    let completeVisibilityCache = this.mission.toJson({
      forceExposure: { expose: 'all' },
      fileExposure: { expose: 'all' },
      sessionDataExposure: { expose: 'all' },
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
            forceExposure: { expose: 'force-with-revealed-nodes', forceId },
            fileExposure: { expose: 'accessible', forceId },
            sessionDataExposure: {
              expose: 'all',
            },
          })
        }

        // Get relevant data from the mission for the member.
        let { structure, forces, prototypes, files } =
          assignmentForceCache[forceId]

        // Filter the outputs not relevant to the member.
        forces.forEach(({ filterOutputs }) => {
          if (filterOutputs) filterOutputs(member._id)
        })

        // Emit the event to the member.
        member.emit(responseMethod, {
          method: responseMethod,
          data: { structure, forces, prototypes, files },
          request,
        })
      }
      // Else if the member has complete visibility, then
      // provide all data.
      else if (hasCompleteVisibility) {
        // Filter the outputs not relevant to the member.
        completeVisibilityCache.forces.forEach(({ filterOutputs }) => {
          if (filterOutputs) filterOutputs(member._id)
        })

        // Emit the event to the member.
        member.emit(responseMethod, {
          method: responseMethod,
          data: {
            structure: completeVisibilityCache.structure,
            forces: completeVisibilityCache.forces,
            prototypes: completeVisibilityCache.prototypes,
            files: completeVisibilityCache.files,
          },
          request,
        })
      }
      // Else, export nothing.
      else {
        // Emit the event to the member.
        member.emit(responseMethod, {
          method: responseMethod,
          data: {
            structure: {},
            forces: [],
            prototypes: [],
            files: [],
          },
          request,
        })
      }
    }
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
    let fulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
    }
    // If the session has already previously started,
    // then emit an error.
    if (this._state !== 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request: fulfilledRequest },
        ),
      )
    }

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
      member.connection.login.onMetisSessionQuit()
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

    // Emit starting event. Then, once set up is complete,
    // emit started event.
    this._state = 'starting'
    this.emitToAll('session-starting', {
      data: {},
      request: unfulfilledRequest,
    })
    ServerTargetEnvironment.setUp(this).then(() => {
      this._state = 'started'
      this.emitStartResponses(event, member, 'session-started')
      this.applyMissionEffects('session-start')
    })
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
    let fulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
    }
    // If the session is not in the 'started' state,
    // then emit an error.
    if (this._state !== 'started') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request: fulfilledRequest },
        ),
      )
    }

    // Emit ending event. Then, once tear down is complete,
    // emit ended event.
    this._state = 'ending'
    this.emitToAll('session-ending', {
      data: {},
      request: unfulfilledRequest,
    })
    this.clearMembers()

    ServerTargetEnvironment.tearDown(this).then(() => {
      this._state = 'ended'
      member.emit('session-ended', {
        data: { sessionId: this._id },
        request: fulfilledRequest,
      })
      this.destroy()
    })
  }

  /**
   * Called when a member requests to reset the session.
   * @param member The member requesting to reset the session.
   * @param event The event emitted by the member.
   */
  public onRequestReset = async (
    member: ServerSessionMember,
    event: TClientEvents['request-reset-session'],
    // Build request for response data.
  ): Promise<void> => {
    let fulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: true,
    })
    let unfulfilledRequest = member.connection.buildResponseReqData(event, {
      fulfilled: false,
    })

    // If the member does not have the correct permissions
    // to start the session, then emit an error.
    if (!member.isAuthorized('startEndSessions')) {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_UNAUTHORIZED_OPERATION,
          { request: fulfilledRequest },
        ),
      )
    }
    // If the session has not been started
    // then emit an error.
    if (this._state === 'unstarted') {
      return member.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_CONFLICTING_STATE,
          { request: fulfilledRequest },
        ),
      )
    }

    this._state = 'resetting'
    this.emitToAll('session-resetting', {
      data: {},
      request: unfulfilledRequest,
    })

    // Handle any action executions that are executing.
    await this.handleExecutions()

    // Tear down the target environments.
    await ServerTargetEnvironment.tearDown(this)

    // Recreate the new mission from the JSON of
    // the current mission.
    this._mission = ServerMission.fromSaveJson(this.mission.toSaveJson())
    this.initializeMission()
    this.mapActions()

    // Set up the target environments.
    await ServerTargetEnvironment.setUp(this)

    // Mark as started and emit the response to
    // all members.
    this._state = 'started'
    this.emitStartResponses(event, member, 'session-reset')
    this.applyMissionEffects('session-start')
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
    // Parse data from event.
    let { config: configUpdates } = event.data

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
    Object.assign(this._config, configUpdates)
    // Update the session name if it has changed.
    if (this.name !== configUpdates.name && configUpdates.name) {
      this.name = configUpdates.name
    }

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
    targetMember.connection.login.onMetisSessionQuit()

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
    targetMember.connection.login.onMetisSessionQuit()

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
    let node: ServerMissionNode | undefined = mission.getNodeById(nodeId)

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
      node.openState(true)

      // Extract data from the node.
      const {
        revealedStructure: structure,
        revealedDescendants: descendants,
        revealedDescendantPrototypes: prototypes,
      } = node

      // Construct open event payload.
      let payload: TServerEvents['node-opened'] = {
        method: 'node-opened',
        data: {
          nodeId,
          opened: true,
          structure: structure,
          revealedDescendants: descendants.map((n) => n.toJson()),
          revealedDescendantPrototypes: prototypes.map((p) => p.toJson()),
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
    let { config } = this
    let { connection } = member
    let { actionId, cheats = {} } = event.data
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
    if (!this.areEnoughResources(action, cheats)) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
          {
            request,
          },
        ),
      )
    }
    // If the action has exceeded its maximum
    // number of executions, then emit an error.
    if (action.executionLimitReached) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_EXECUTION_LIMIT, {
          request,
        }),
      )
    }

    try {
      // Execute the action, awaiting result.
      let outcome = await action.execute({
        sessionConfig: config,
        cheats,
        onInit: (execution: ServerActionExecution) =>
          this.onExecution(member, request, execution),
      })

      // Handle the outcome of the action.
      this.onOutcome(member, request, outcome)
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
   * Sub-handler of `onRequestExecuteAction` which processes the
   * initiation of an action execution.
   * @param member The member provided to `onRequestExecuteAction`.
   * @param event The event provided to `onRequestExecuteAction`.
   * @param execution The execution that was initiated.
   */
  private onExecution(
    member: ServerSessionMember,
    request: TRequestOfResponse,
    execution: ServerActionExecution,
  ): void {
    let { action } = execution

    // Construct payload for action execution
    // initiated event.
    let initiationPayload: TServerEvents['action-execution-initiated'] = {
      method: 'action-execution-initiated',
      data: {
        execution: execution.toJson(),
        resourcesRemaining: action!.force.resourcesRemaining,
      },
      request: {
        event: request.event,
        requesterId: member._id,
        fulfilled: false,
      },
    }

    // Emit action execution initiated event
    // to each member.
    for (let member of this.getMembersForForce(action!.force._id)) {
      member.emit('action-execution-initiated', initiationPayload)
    }

    // Create a new output JSON object.
    let message = /*html*/ `
              <p>Executing <i><action-name></action-name></i> on <i><node-name></node-name></i>.</p>
              <i><action-description></action-description></i>
              <p></p>
              <p class="DetailDisplay">
                <span class="Label">Success Chance</span>
                <span class="Value">
                  <success-chance></success-chance>
                </span>
              </p>
              <p class="DetailDisplay">
                <span class="Label">Time</span>
                <span class="Value">
                  <time-remaining></time-remaining> (<process-time></process-time>)
                </span>
              </p>
              <p class="DetailDisplay">
                <span class="Label">Cost</span>
                <span class="Value">
                  <resource-cost></resource-cost>
                </span>
              </p>
              <p class="DetailDisplay">
                <span class="Label">Opens Node</span>
                <span class="Value">
                  <opens-node></opens-node>
                </span>
              </p>
            `

    // Send the output JSON to the force.
    this.sendOutput(
      member.outputPrefix,
      message,
      { type: 'execution-initiation', sourceExecutionId: execution._id },
      { forceKey: action.force.localKey, memberId: member._id },
    )
    // Apply the effects for the action that are triggered
    // immediately.
    this.applyActionEffects(member, action, 'execution-initiation', execution)
  }

  /**
   * Sub-handler of `onRequestExecuteAction` which processes the
   * outcome of an action execution.
   */
  private onOutcome(
    member: ServerSessionMember,
    request: TRequestOfResponse,
    outcome: ServerExecutionOutcome,
  ): void {
    const { action, node } = outcome

    // Construct payload for action execution
    // completed event.
    let completionPayload: TServerEvents['action-execution-completed'] = {
      method: 'action-execution-completed',
      data: {
        outcome: outcome.toJson(),
      },
      request,
    }

    // If the node has been opened, then process this
    // information in the completion payload.
    if (node.opened) {
      // Extract data from the node.
      const {
        revealedStructure: structure,
        revealedDescendants: descendants,
        revealedDescendantPrototypes: prototypes,
      } = node

      // Update the payload with the gathered data.
      completionPayload.data = {
        ...completionPayload.data,
        structure: structure,
        revealedDescendants: descendants.map((n) =>
          n.toJson({
            sessionDataExposure: {
              expose: 'member-specific',
              memberId: member._id,
            },
          }),
        ),
        revealedDescendantPrototypes: prototypes.map((p) => p.toJson()),
      }
    }

    // Determine effect details based on the status of the outcome.
    let effectTrigger: TEffectTrigger | null = null
    switch (outcome.status) {
      case 'success':
        effectTrigger = 'execution-success'
        break
      case 'failure':
        effectTrigger = 'execution-failure'
        break
    }

    // Emit the action execution completed
    // event to each member for the force.
    for (let { connection } of this.getMembersForForce(outcome.forceId)) {
      connection.emit('action-execution-completed', completionPayload)
    }

    // Apply effects, if the outcome calls for it.
    if (effectTrigger)
      this.applyActionEffects(member, action, effectTrigger, outcome.execution)
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
        let node: ServerMissionNode | undefined =
          this.mission.getNodeById(nodeId)

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

          // Send an output to the force.
          this.sendOutput(
            member.outputPrefix,
            node.preExecutionText,
            { type: 'pre-execution', sourceNodeId: node._id },
            {
              forceKey: node.force.localKey,
              memberId: member._id,
            },
          )

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
   * Applies a session-triggered effect to the session.
   * @param effect The effect to apply.
   */
  private async applyMissionEffect(
    effect: ServerEffect<'sessionTriggeredEffect'>,
  ): Promise<void> {
    // If the effect doesn't have a target environment,
    // log an error.
    if (effect.environment === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    // If the effect doesn't have a target,
    // log an error.
    if (effect.target === null) {
      throw new Error(
        `"${effect.name}" doesn't have a target or the target doesn't exist.`,
      )
    }

    // Create and expose a new context for the target
    // environment.
    let context = TargetEnvContext.createSessionContext(effect, this).expose()

    // Apply the effect to the target.
    try {
      if (!effect.defective) {
        await effect.target.script(context)
      }
    } catch (error: any) {
      // Give additional information about the error.
      let message =
        `Failed to apply effect - "${effect.name}" - to target - "${effect.target.name}" - found in the environment - "${effect.environment.name}".\n` +
        `The effect - "${effect.name}" - can be found here:\n` +
        `mission - "${this.mission.name}" - effect - "${effect.name}".\n`
      // Log the error.
      targetEnvLogger.error(message, error)
    }
  }

  /**
   * Processes the effects of the mission, enacting
   * those of the given trigger.
   * @param trigger The trigger to look for in the effects.
   */
  public async applyMissionEffects(
    trigger: TEffectSessionTriggered,
  ): Promise<void> {
    // If the effects are enabled...
    if (this.config.effectsEnabled) {
      // Get the effects for the given trigger.
      let effects = this.mission.effects.filter(
        (effect) => effect.trigger === trigger,
      )
      // Iterate through each effect and apply it.
      for (let effect of effects) {
        try {
          await this.applyMissionEffect(effect)
        } catch (error: any) {
          // Log the error.
          targetEnvLogger.error(error)
        }
      }
    }
  }

  /**
   * Applies an execution-triggered effect to a target environment.
   * @param effect The effect to apply.
   * @param member The member applying the effect.
   * @param execution The action execution that triggered the effect.
   */
  private async applyActionEffect(
    effect: ServerEffect<'executionTriggeredEffect'>,
    member: ServerSessionMember,
    execution: ServerActionExecution,
  ): Promise<void> {
    // If the effect doesn't have a target environment,
    // log an error.
    if (effect.environment === null) {
      throw new Error(
        `The force - "${effect.sourceForce.name}" - has a node - "${effect.sourceNode.name}" - has an action - "${effect.sourceAction.name}" - with an effect - "${effect.name}" - that doesn't have a target environment or the target environment doesn't exist.`,
      )
    }
    // If the effect doesn't have a target,
    // log an error.
    if (effect.target === null) {
      throw new Error(
        `The force - "${effect.sourceForce.name}" - has a node - "${effect.sourceNode.name}" - has an action - "${effect.sourceAction.name}" - with an effect - "${effect.name}" - that doesn't have a target or the target doesn't exist.`,
      )
    }

    // Create and expose a new context for the target
    // environment.
    let context = TargetEnvContext.createExecutionContext(
      effect,
      this,
      member,
      execution,
    ).expose()

    // Apply the effect to the target.
    try {
      if (!effect.defective) {
        await effect.target.script(context)
      }
    } catch (error: any) {
      // Give additional information about the error.
      let message =
        `Failed to apply effect - "${effect.name}" - to target - "${effect.target.name}" - found in the environment - "${effect.environment.name}".\n` +
        `The effect - "${effect.name}" - can be found here:\n` +
        `force - "${effect.sourceForce.name}" - node - "${effect.sourceNode.name}" - action - "${effect.sourceAction.name}" - effect - "${effect.name}".\n`
      // Log the error.
      targetEnvLogger.error(message, error)
    }
  }

  /**
   * Processes the effects of the given action, enacting
   * those of the given trigger.
   * @param member The member to apply the effects to.
   * @param action The action to process.
   * @param trigger The trigger to look for in the effects.
   * @param execution The action execution that is being processed.
   */
  private async applyActionEffects(
    member: ServerSessionMember,
    action: ServerMissionAction,
    trigger: TEffectExecutionTriggered,
    execution: ServerActionExecution,
  ): Promise<void> {
    // If the effects are enabled...
    if (this.config.effectsEnabled) {
      // Get the effects for the given trigger.
      let effects = action.effects.filter(
        (effect) => effect.trigger === trigger,
      )
      // Iterate through each effect and apply it.
      for (let effect of effects) {
        try {
          await this.applyActionEffect(effect, member, execution)

          // todo: implement feedback for modifiers
          // participant.emit('effect-successful', {
          //   message: 'The effect was successfully applied to its target.',
          // })
        } catch (error: any) {
          // Log the error.
          targetEnvLogger.error(error)

          // todo: implement feedback for modifiers
          // participant.emitError(
          //   new ServerEmittedError(ServerEmittedError.CODE_EFFECT_FAILED),
          // )
        }
      }
    }
  }

  /**
   * Confirms the mission component is a part of the mission
   * the session is using.
   * @param component The component to check.
   * @throws If the force does not belong to the mission.
   */
  private confirmComponentInMission(
    component: MissionComponent<any, any>,
  ): void {
    if (!this.mission.has(component)) {
      throw new Error(
        `Could not perform the operation on the component with ID "${component._id}" because it does not belong to the mission with ID "${this.mission._id}".`,
      )
    }
  }

  /**
   * Emites a 'modifier-enacted' event to all members in the force
   * that a modifier has been enacted.
   * @param node The node on which the modifier was enacted.
   * @param data The payload for the event.
   */
  private emitModifierEnacted = (
    force: ServerMissionForce,
    data: TServerEvents['modifier-enacted']['data'],
  ) => {
    for (let { connection } of this.getMembersForForce(force._id)) {
      connection.emit('modifier-enacted', { data })
    }
  }

  /**
   * Handles the blocking and unblocking of a node during a session.
   * @param nodeId The node to block or unblock.
   * @param blocked Whether to block or unblock the node.
   */
  public updateNodeBlockStatus = (
    node: ServerMissionNode,
    blocked: boolean,
  ) => {
    // Confirm the node exists, update the block status,
    // then emit an event to the members.
    this.confirmComponentInMission(node)
    node.blocked = blocked
    this.emitModifierEnacted(node.force, {
      key: 'node-update-block-status',
      nodeId: node._id,
      blocked,
    })
  }

  /**
   * Updates a node's open/closed state during an active session and notifies all force members.
   * @param node The node whose open state should be changed.
   * @param open True to open the node (revealing descendants), false to close it (hiding descendants).
   * @note This method is idempotent - calling it when the node is already in the desired state is a no-op.
   * @note If the node has `revealAllNodes` enabled, open/close operations are not allowed and will be skipped.
   */
  public updateNodeOpenState = (node: ServerMissionNode, open: boolean) => {
    // Confirm the node belongs to this session's mission.
    this.confirmComponentInMission(node)

    // Validate the operation is permitted (idempotent check).
    if (open && !node.openable) {
      targetEnvLogger.warn(
        `Skipping open on node "${node.name}" (${node._id}): already opened or revealAllNodes enabled`,
      )
      return
    } else if (!open && !node.closable) {
      targetEnvLogger.warn(
        `Skipping close on node "${node.name}" (${node._id}): already closed or revealAllNodes enabled`,
      )
      return
    }

    // Perform the open/close operation (may abort executing actions).
    node.openState(open)

    // Extract the revealed structure and descendants from the node.
    // These properties reflect what should be visible to clients based on the new state.
    const {
      revealedStructure: structure,
      revealedDescendants: descendants,
      revealedDescendantPrototypes: prototypes,
    } = node

    const member = this.getMembersForForce(node.force._id)[0]

    if (!member) {
      targetEnvLogger.warn(
        `No members found for force "${node.force.name}" (${node.force._id}) when updating open state of node "${node.name}" (${node._id})`,
      )
      return
    }

    // Construct the payload containing the node's new state and revealed data.
    let payload: TServerEvents['modifier-enacted']['data'] = {
      key: 'node-update-open-state',
      nodeId: node._id,
      opened: open,
      structure: structure,
      revealedDescendants: descendants.map((n) =>
        n.toJson({
          sessionDataExposure: {
            expose: 'member-specific',
            memberId: member._id,
          },
        }),
      ),
      revealedDescendantPrototypes: prototypes.map((p) => p.toJson()),
    }

    // Notify all members of this force about the node's state change.
    this.emitModifierEnacted(node.force, payload)
  }

  /**
   * Modifies the success chance of a specific action within a node or
   * all actions within a node.
   * @param data The data for the modification.
   * @param data.operand The operand to modify the success chance by.
   * @param data.node The node containing the action to modify.
   * @param data.action The action to modify.
   * @note If the action is not provided, the success chance of all actions
   * within the node will be modified.
   */
  public modifySuccessChance = (data: {
    operand: number
    node: ServerMissionNode
    action?: ServerMissionAction
  }) => {
    const { operand, node, action } = data

    // Confirm the node exists.
    this.confirmComponentInMission(node)

    // If the action is provided, confirm it exists
    // and belongs to the node.
    if (action) this.confirmComponentInMission(action)

    // Modify the success chance of the action or
    // all actions within the node.
    node.modifySuccessChance(operand, action?._id)
    this.emitModifierEnacted(node.force, {
      key: 'node-action-success-chance',
      successChanceOperand: operand,
      nodeId: node._id,
      actionId: action?._id,
    })
  }

  /**
   * Modifies the processing time of a specific action within a node or
   * all actions within a node.
   * @param data The data for the modification.
   * @param data.operand The operand to modify the processing time by.
   * @param data.node The node containing the action to modify.
   * @param data.action The action to modify.
   * @note If the action is not provided, the processing time of all actions
   * within the node will be modified.
   */
  public modifyProcessTime = (data: {
    operand: number
    node: ServerMissionNode
    action?: ServerMissionAction
  }) => {
    const { operand, node, action } = data

    // Confirm the node exists.
    this.confirmComponentInMission(node)

    // If the action is provided, confirm it exists
    // and belongs to the node.
    if (action) this.confirmComponentInMission(action)

    // Modify the processing time of the action or
    // all actions within the node.
    node.modifyProcessTime(operand, action?._id)
    this.emitModifierEnacted(node.force, {
      key: 'node-action-process-time',
      processTimeOperand: operand,
      nodeId: node._id,
      actionId: action?._id,
    })
  }

  /**
   * Modifies the resource cost of a specific action within a node or
   * all actions within a node.
   * @param data The data for the modification.
   * @param data.operand The operand to modify the resource cost by.
   * @param data.node The node containing the action to modify.
   * @param data.action The action to modify.
   * @note If the action is not provided, the resource cost of all actions
   * within the node will be modified.
   */
  public modifyResourceCost = (data: {
    operand: number
    node: ServerMissionNode
    action?: ServerMissionAction
  }) => {
    const { operand, node, action } = data

    // Confirm the node exists.
    this.confirmComponentInMission(node)

    // If the action is provided, confirm it exists
    // and belongs to the node.
    if (action) this.confirmComponentInMission(action)

    // Modify the resource cost of the action or
    // all actions within the node.
    node.modifyResourceCost(operand, action?._id)
    this.emitModifierEnacted(node.force, {
      key: 'node-action-resource-cost',
      resourceCostOperand: operand,
      nodeId: node._id,
      actionId: action?._id,
    })
  }

  /**
   * Modifies resource pool by applying the given amount
   * to the resource pool.
   * @param force The force containing the resource pool.
   * @param operand The amount by which to modify the resource pool.
   * @note A negative value will subtract and a positive
   * value will add to the resource pool.
   */
  public modifyResourcePool = (force: ServerMissionForce, operand: number) => {
    // Confirm the force exists, modify the resource pool,
    // then emit an event to the members.
    this.confirmComponentInMission(force)
    force.modifyResourcePool(operand)
    this.emitModifierEnacted(force, {
      key: 'force-resource-pool',
      forceId: force._id,
      operand,
    })
  }

  /**
   * Updates the access to the given file in the mission to the
   * given force.
   * @param file The file to which access is granted/revoked.
   * @param force The force which will have access to the file.
   */
  public updateFileAccess = (
    file: ServerMissionFile,
    force: ServerMissionForce,
    granted: boolean,
  ): void => {
    this.confirmComponentInMission(file)

    // Grant/revoke access based on the parameter
    // passed.
    if (granted) file.grantAccess(force)
    else file.revokeAccess(force)

    // Emit an event to members of the force,
    // including file-data if the access
    // to the file is now granted.
    let eventPartialPayload = {
      key: 'file-update-access',
      fileId: file._id,
      forceId: force._id,
    } as const

    if (granted) {
      this.emitModifierEnacted(force, {
        ...eventPartialPayload,
        granted: true,
        fileData: file.toJson(),
      })
    } else {
      this.emitModifierEnacted(force, {
        ...eventPartialPayload,
        granted: false,
      })
    }
  }

  /**
   * Sends an output to the force's output panel.
   * @param output The output to send to the force.
   * @param options Options for sending the output.
   */
  public sendOutput = (
    prefix: string,
    message: string,
    context: TOutputContext,
    to?: TOutputTo,
  ) => {
    // Extract data.
    const { type } = context
    let forceRecipients: ServerMissionForce[] = []
    let member: ServerSessionMember | undefined = undefined

    // Find the member with the member ID,
    // if provided.
    if (to?.memberId) {
      member = this.getMember(to.memberId)
      // If the member is not found, then throw an error.
      if (!member) {
        throw new Error(
          `Could not send output with key "${type}" to the member with ID "${to.memberId}" because the member was not found in the session.`,
        )
      }
    }

    // Mark all forces as recipients if
    // no recipient is specified.
    if (!to) {
      forceRecipients = this.mission.forces
    }
    // Mark only specified force as recipient,
    // otherwise.
    else {
      // Send to a specific force.
      let force = this.mission.getForceByLocalKey(to.forceKey)
      // If the force is undefined, throw an error.
      if (!force) {
        throw new Error(
          `Could not send output of type "${type}" to the force with ID "${to.forceKey}" because the force was not found.`,
        )
      }
      forceRecipients = [force]
    }

    // Loop through any forceRecipients and send the
    // output to each.
    for (let force of forceRecipients) {
      // Create a new output object.
      let output = ServerOutput.generate(
        force,
        prefix,
        message,
        context,
        to?.memberId,
      )

      // Store the output in the force.
      force.storeOutput(output)

      // If a member is specified, only send the output to that member.
      if (member) {
        member.emit('send-output', {
          data: {
            outputData: output.toJson(),
          },
        })
        continue
      }

      // Otherwise, send the output to all members
      // of the force.
      for (let member of this.getMembersForForce(force._id)) {
        member.emit('send-output', {
          data: {
            outputData: output.toJson(),
          },
        })
      }
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
    owner: ServerUser,
  ): SessionServer {
    return new SessionServer(
      StringToolbox.generateRandomId().substring(0, 8),
      config.name ?? mission.name,
      owner,
      config,
      mission,
    )
  }

  /**
   * @returns the session associated with the given session ID.
   */
  public static get(_id: string | null | undefined): SessionServer | undefined {
    if (!_id) {
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

  /**
   * Handles a user quitting a METIS session.
   * @param metisSessionId The ID of the METIS session to quit.
   * @param userId The ID of the user quitting the METIS session.
   */
  public static quit(metisSessionId: string, userId: string): void {
    // Find the METIS session.
    const metisSession = SessionServer.get(metisSessionId)
    metisSession?.quit(userId)
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

/**
 * Defines who will receive the output.
 * @default {}
 * @note To broadcast to the entire session, pass nothing.
 * @note To broadcast to a specific force, pass `forceKey`.
 * @note To broadcast to a specific member in the force, pass `memberId`.
 */
export type TOutputTo = {
  /**
   * The key of the force to which the output is sent.
   */
  forceKey: string
  /**
   * The session member ID of the member to whom the output is sent.
   */
  memberId?: string
}
