import { TClientEvents, TServerEvents, TServerMethod } from 'metis/connect/data'
import { ServerEmittedError } from 'metis/connect/errors'
import { TMissionJsonOptions } from 'metis/missions'
import ServerMission from 'metis/server/missions'
import ServerMissionAction from 'metis/server/missions/actions'
import ServerMissionNode from 'metis/server/missions/nodes'
import Session, {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
} from 'metis/sessions'
import MemberRole, { TMemberRoleId } from 'metis/sessions/members/roles'
import { TCommonUser } from 'metis/users'
import { v4 as generateHash } from 'uuid'
import ClientConnection from '../connect/clients'
import ServerActionExecution from '../missions/actions/executions'
import ServerMissionForce from '../missions/forces'
import EnvironmentContextProvider from '../target-environments/context-provider'
import ServerSessionMember from './members'

/**
 * Server instance for sessions. Handles server-side logic for a session with participating clients. Communicates with clients to conduct the session.
 */
export default class SessionServer extends Session<
  ServerSessionMember,
  ServerMission,
  ServerMissionForce,
  ServerMissionNode,
  ServerMissionAction
> {
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

  public constructor(
    _id: string,
    name: string,
    config: Partial<TSessionConfig>,
    mission: ServerMission,
    members: ServerSessionMember[],
    banList: string[],
  ) {
    super(_id, name, config, mission, members, banList)
    this._state = 'unstarted'
    this._destroyed = false
    this.register()
    this.environmentContextProvider = new EnvironmentContextProvider(this)
  }

  // Implemented
  public getAssignedForce(
    member: ServerSessionMember,
  ): ServerMissionForce | undefined {
    let forceId: string | undefined = this.assignments.get(member._id)
    return this.mission.getForce(forceId)
  }

  /**
   * Gets the users that have access to the force with the given ID.
   * @param forceId The ID of the force.
   * @returns The users.
   */
  public getMembersForForce(forceId: string): ServerSessionMember[] {
    // todo: Update this code to work with new member-permission system.
    return [
      ...this.participants.filter(
        (participant) => this.assignments.get(participant._id) === forceId,
      ),
      ...this.observers,
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
      let forceId: string | undefined = this.assignments.get(requester._id)

      // If the requester is a participant, then
      // update the mission options to include
      // data pertinent to the participant.
      if (forceId !== undefined) {
        missionOptions = {
          exportType: 'session-participant',
          forceId,
        }
      }
      // If the requester is an observer, then
      // update the mission options to include
      // data pertinent to the observer.
      else if (requester.isObserver) {
        missionOptions = {
          exportType: 'session-observer',
        }
      }
      // If the requester is a manager, then
      // update the mission options to include
      // data pertinent to the manager.
      else if (requester.isManager) {
        missionOptions = {
          exportType: 'session-manager',
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
    return this.getMember(userId)?.role
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
    // Emit an event to all users that the session has been destroyed.
    for (let { connection } of members) {
      connection.emit('session-destroyed', { data: { sessionId: this._id } })
    }
  }

  /**
   * Has the given client connection join as a member of the session.
   * @param client The user joining the session.
   * @param method The method of joining (Whether as a participant, a manager, or as an observer).
   * @returns The new `ServerSessionMember` object that was created.
   * @throws The server emitted error code of any error that occurs.
   * @note Establishes listeners to handle events emitted by the user's web socket connection.
   */
  public join(
    client: ClientConnection,
    roleId: TMemberRoleId,
  ): ServerSessionMember {
    // Throw error if the user is in the ban list.
    if (this._banList.includes(client.userId)) {
      throw ServerEmittedError.CODE_SESSION_BANNED
    }
    // Throw error if the user is already in the session.
    if (this.isJoined(client.userId)) {
      throw ServerEmittedError.CODE_ALREADY_IN_SESSION
    }

    // If the client does not have the required permissions
    // to join the session with the given role, then throw
    // an error.
    switch (roleId) {
      case 'participant':
        if (!client.user.isAuthorized('sessions_join_participant'))
          throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
        break
      case 'observer':
        if (!client.user.isAuthorized('sessions_join_observer'))
          throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
        break
      case 'manager':
        if (!client.user.isAuthorized('sessions_join_manager'))
          throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
        break
      default:
        throw ServerEmittedError.CODE_SESSION_UNAUTHORIZED_JOIN
    }

    // Create a new session member.
    let member = ServerSessionMember.create(client, roleId)

    // Handle joining the session for the client.
    client.login.handleJoin(this._id)

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-users-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })

    // Return the new member.
    return member
  }

  /**
   * Updates the configuration of the session.
   * @param config Updated configuration options to assign to the session config.
   */
  public updateConfig(config: Partial<TSessionConfig>): void {
    Object.assign(this._config, config)

    // Emit an event to all users that the session state has changed.
    this.emitToAll('session-config-updated', {
      data: {
        config: this.config,
      },
    })
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
      member.connection = newConnection
      this.addListeners(member)
    }
    // Return whether the member was found.
    return !!member
  }

  /**
   * Starts the session.
   */
  public start(): void {
    // todo: Update this code to work with new member-permission system.
    //     // Mark the session as started.
    //     this._state = 'started'
    //
    //     // If the session is in the 'started' state,
    //     // then auto-assign participants to forces.
    //     if (this.state === 'started') {
    //       this.autoAssign()
    //     }
    //
    //     // Cache used to not export the same force twice
    //     // for a participant.
    //     const participantForceCache: SingleTypeObject<TCommonMissionJson> = {}
    //
    //     // Emit an event to all participants that the session has
    //     // started.
    //     for (let participant of this.participants) {
    //       // Find the force ID for the participant.
    //       let forceId = this.assignments.get(participant.userId)
    //
    //       // Skip if the participant is not assigned to a force.
    //       if (forceId === undefined) {
    //         continue
    //       }
    //
    //       // If the force has not been cached, then cache it.
    //       if (!participantForceCache[forceId]) {
    //         participantForceCache[forceId] = this.mission.toJson({
    //           exportType: 'session-participant',
    //           forceId,
    //         })
    //       }
    //
    //       // Get relevant data from the mission for the
    //       // participant.
    //       let { nodeStructure, forces } = participantForceCache[forceId]
    //
    //       // Emit the event to the participant.
    //       participant.emit('session-started', {
    //         data: { nodeStructure, forces },
    //       })
    //     }
    //
    //     // Get observer export.
    //     let observerExport = this.mission.toJson({
    //       exportType: 'session-observer',
    //     })
    //
    //     // Emit an event to all observers that the session has
    //     // started.
    //     for (let observer of this.observers) {
    //       observer.emit('session-started', {
    //         data: {
    //           nodeStructure: observerExport.nodeStructure,
    //           forces: observerExport.forces,
    //         },
    //       })
    //     }
    //
    //     // Get manager export.
    //     let managerExport = this.mission.toJson({
    //       exportType: 'session-manager',
    //     })
    //
    //     // Emit an event to all managers that the session has
    //     // started.
    //     for (let manager of this.managers) {
    //       manager.emit('session-started', {
    //         data: {
    //           nodeStructure: managerExport.nodeStructure,
    //           forces: managerExport.forces,
    //         },
    //       })
    //     }
  }

  /**
   * Ends the session.
   */
  public end(): void {
    // Mark the session as ended.
    this._state = 'ended'
    // Emit an event to all users that the session has ended.
    this.emitToAll('session-ended', { data: {} })
    // Clear all users.
    this.clearMembers()
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
    this.emitToAll('session-users-updated', {
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
   * Kicks the given user from the session.
   * @param participantId The ID of the participant to kick from the session.
   * @throws The correct HTTP status code for any errors that occur.
   */
  public kick(participantId: string): void {
    // todo: Update this code to work with new member-permission system.
    // Find the participant in the list, if present.
    //     this._participants.forEach(
    //       (participant: ServerSessionMember, index: number) => {
    //         if (participant.userId === participantId) {
    //           // If the participant has observer permissions,
    //           // then throw 403 forbidden error.
    //           if (participant.user.isAuthorized('sessions_join_observer')) {
    //             throw 403
    //           }
    //
    //           // Remove the participant from the list.
    //           this._participants.splice(index, 1)
    //
    //           // Remove session-specific listeners.
    //           this.removeListeners(participant)
    //
    //           // Handle quitting the session for the participant.
    //           participant.login.handleQuit()
    //
    //           // Emit an event to the participant
    //           // that they have been kicked.
    //           participant.emit('kicked', { data: { sessionId: this._id } })
    //         }
    //       },
    //     )

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-users-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Bans the given user from the session.
   * @param participantId The ID of the participant to ban from the session.
   * @throws The correct HTTP status code for any errors that occur.
   */
  public ban(participantId: string): void {
    // todo: Update this code to work with new member-permission system.
    //     // Find the participant in the list, if present.
    //     this._participants.forEach(
    //       (participant: ServerSessionMember, index: number) => {
    //         if (participant.userId === participantId) {
    //           // If the participant is has observer permissions,
    //           // then throw 403 forbidden error.
    //           if (participant.user.isAuthorized('sessions_join_observer')) {
    //             throw 403
    //           }
    //
    //           // Remove the participant from the list.
    //           this._participants.splice(index, 1)
    //
    //           // Remove session-specific listeners.
    //           this.removeListeners(participant)
    //
    //           // Handle quitting the session for the participant.
    //           participant.login.handleQuit()
    //
    //           // Emit an event to the participant
    //           // that they have been kicked.
    //           participant.emit('banned', { data: { sessionId: this._id } })
    //         }
    //       },
    //     )

    // Add the participant to the ban list.
    this._banList.push(participantId)

    // Emit an event to all users that the user list
    // has changed.
    this.emitToAll('session-users-updated', {
      data: {
        members: this.members.map((member) => member.toJson()),
      },
    })
  }

  /**
   * Auto-assigns participants to forces using a
   * round-robin algorithm.
   */
  private autoAssign(): void {
    // Initialize force index.
    let forceIndex: number = 0

    // todo: Update this code to work with new member-permission system.
    //
    //     // Loop through each participant.
    //     this._participants.forEach((participant: ServerSessionMember) => {
    //       // Assign the participant to the force.
    //       this.assignments.set(
    //         participant.userId,
    //         this.mission.forces[forceIndex]._id,
    //       )
    //
    //       // Increment the force index.
    //       forceIndex = (forceIndex + 1) % this.mission.forces.length
    //     })
  }

  /**
   * Creates session-specific listeners for the given member.
   */
  private addListeners(member: ServerSessionMember): void {
    let { connection } = member

    connection.addEventListener('request-open-node', (data) =>
      this.onRequestOpenNode(member, data),
    )
    connection.addEventListener('request-execute-action', (data) =>
      this.onRequestExecuteAction(member, data),
    )
  }

  /**
   * Removes session-specific listeners for the given participant.
   */
  private removeListeners(member: ServerSessionMember): void {
    member.connection.clearEventListeners([
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
    for (let { connection } of this._members) connection.emit(method, payload)
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

    // Find the node, given the ID.
    let node: ServerMissionNode | undefined = mission.getNode(nodeId)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_PROGRESS_LOCKED,
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
    let { connection } = member
    let { actionId } = event.data
    let action: ServerMissionAction | undefined = this.actions.get(actionId)

    // If the session is not in the 'started' state,
    // then emit an error.
    if (this.state !== 'started') {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_SESSION_PROGRESS_LOCKED,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }
    // If the action is undefined, then emit
    // an error.
    if (action === undefined) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_ACTION_NOT_FOUND, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }
    // If the action is not executable, then
    // emit an error.
    if (!action.node.executable) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_EXECUTABLE, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }
    // If the node is not revealed, then
    // emit an error.
    if (!action.node.revealed) {
      return connection.emitError(
        new ServerEmittedError(ServerEmittedError.CODE_NODE_NOT_REVEALED, {
          request: connection.buildResponseReqData(event),
        }),
      )
    }
    // If the participant does not have enough
    // resources to execute the action, then
    // emit an error.
    if (action.force.resourcesRemaining < action.resourceCost) {
      return connection.emitError(
        new ServerEmittedError(
          ServerEmittedError.CODE_ACTION_INSUFFICIENT_RESOURCES,
          {
            request: connection.buildResponseReqData(event),
          },
        ),
      )
    }

    try {
      // Execute the action, awaiting result.
      let outcome = await action.execute({
        environmentContextProvider: this.environmentContextProvider,
        effectsEnabled: this.config.effectsEnabled,
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
          for (let { connection } of this.getMembersForForce(
            action!.force._id,
          )) {
            connection.emit('action-execution-initiated', initiationPayload)
          }
        },
      })

      // Construct payload for action execution
      // completed event.
      let completionPayload: TServerEvents['action-execution-completed'] = {
        method: 'action-execution-completed',
        data: {
          outcome: outcome.toJson(),
        },
        request: {
          event,
          requesterId: member.userId,
          fulfilled: true,
        },
      }

      // Add child nodes if the action was
      // successful.
      if (outcome.successful) {
        completionPayload.data.revealedChildNodes = action.node.children.map(
          (node) => node.toJson({ includeSessionData: true }),
        )
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
    // that an internal effect has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('internal-effect-enacted', {
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
    // that an internal effect has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('internal-effect-enacted', {
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
    // that an internal effect has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('internal-effect-enacted', {
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
    // that an internal effect has been enacted.
    for (let { connection } of this.getMembersForForce(forceId)) {
      connection.emit('internal-effect-enacted', {
        data: {
          key: 'node-action-resource-cost',
          nodeId,
          resourceCostOperand,
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
   * @returns A promise of the session server for the newly launched session.
   */
  public static launch(
    mission: ServerMission,
    config: Partial<TSessionConfig> = {},
  ): SessionServer {
    return new SessionServer(
      generateHash().substring(0, 12),
      mission.name,
      config,
      mission,
      [],
      [],
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
