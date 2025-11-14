import type {
  ServerConnection,
  TServerHandler,
} from '@client/connect/ServerConnection'
import { ClientActionExecution } from '@client/missions/actions/ClientActionExecution'
import { ClientExecutionOutcome } from '@client/missions/actions/ClientExecutionOutcome'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { ClientMission } from '@client/missions/ClientMission'
import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { ClientOutput } from '@client/missions/forces/ClientOutput'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { ClientUser } from '@client/users/ClientUser'
import type {
  TFileAccessModifierData,
  TGenericServerEvents,
  TNodeOpenStateData,
  TResponseEvents,
  TServerEvents,
  TServerMethod,
} from '@shared/connect'
import type {
  TActionExecutionJson,
  TExecutionCheats,
} from '@shared/missions/actions/ActionExecution'
import type { TExecutionOutcomeJson } from '@shared/missions/actions/ExecutionOutcome'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionMemberJson } from '@shared/sessions/members/SessionMember'
import type {
  TSessionBasicJson,
  TSessionConfig,
  TSessionJson,
} from '@shared/sessions/MissionSession'
import { MissionSession } from '@shared/sessions/MissionSession'
import axios from 'axios'
import type { TMetisClientComponents } from '..'
import { ClientSessionMember } from './ClientSessionMember'
import { SessionBasic } from './SessionBasic'

/**
 * Client instance for sessions. Handles client-side logic for sessions. Communicates with server to conduct a session.
 */
export class SessionClient extends MissionSession<TMetisClientComponents> {
  /**
   * The server connection used to communicate with the server.
   */
  protected server: ServerConnection

  private memberId: ClientSessionMember['_id']

  /**
   * The session member for this client connection.
   */
  public get member(): ClientSessionMember {
    // Find the member associated with this client connection.
    let member = this.getMember(this.memberId)

    // Throw an error if the member could not
    // be found in the members JSON passed.
    if (!member) {
      throw new Error('Member not found in session.')
    }

    // Return the member.
    return member
  }

  /**
   * The role of the member associated with this client connection.
   */
  public get role(): MemberRole {
    return this.member.role
  }

  /**
   * The role ID of the member associated with this client connection.
   */
  public get roleId(): TMemberRoleId {
    return this.member.roleId
  }

  /**
   * @param data Core data used to build the session object.
   * @param server The connection to the server used to synchronize
   * game logic.
   * @param memberId The ID of the member associated with this
   * client connection.
   */
  public constructor(
    data: TSessionJson,
    server: ServerConnection,
    memberId: string,
  ) {
    // Gather details.
    let mission: ClientMission = ClientMission.fromExistingJson(data.mission, {
      nonRevealedDisplayMode: 'blur',
    })
    let {
      _id,
      state,
      name,
      ownerId,
      ownerUsername,
      ownerFirstName,
      ownerLastName,
      launchedAt,
      members: memberData,
      banList,
      config,
    } = data

    // Call super constructor with base data.
    super(
      _id,
      name,
      ownerId,
      ownerUsername,
      ownerFirstName,
      ownerLastName,
      new Date(launchedAt),
      config,
      mission,
      memberData,
      banList,
    )

    // Set the rest of the data.
    this.server = server
    this.memberId = memberId
    this._state = state

    this.listeners = [
      ['session-starting', this.onStarting],
      ['session-started', this.onStart],
      ['session-ending', this.onEnding],
      ['session-ended', this.onEnd],
      ['session-reset', this.onReset],
      ['session-config-updated', this.onConfigUpdate],
      ['session-members-updated', this.onUsersUpdated],
      ['force-assigned', this.onForceAssigned],
      ['role-assigned', this.onRoleAssigned],
      ['node-opened', this.onNodeOpenedResponse],
      ['action-execution-initiated', this.onActionExecutionInitiated],
      ['action-execution-completed', this.onActionExecutionCompleted],
      ['modifier-enacted', this.onModifierEnacted],
      ['send-output', this.onSendOutput],
      ['output-sent', this.onOutputSent],
      ['kicked', this.onKicked],
      ['banned', this.onBanned],
      ['dismissed', this.onDismissed],
      ['session-destroyed', this.onDestroyed],
      ['session-quit', this.onQuit],
    ]

    // Add listeners to detect events that are
    // emitted to the client.
    this.addListeners()
  }

  // Implemented
  protected parseMemberData(data: TSessionMemberJson[]): ClientSessionMember[] {
    return data.map(
      ({ _id, user: userData, roleId, forceId }) =>
        new ClientSessionMember(
          _id,
          ClientUser.fromExistingJson(userData),
          roleId,
          forceId,
          this,
        ),
    )
  }

  // Implemented
  protected mapActions(): void {
    // Initialize the actions map.
    this.actions = new Map<string, ClientMissionAction>()

    // Loops through and add each action found.
    this.mission.forces.forEach((force) =>
      force.nodes.forEach((node) =>
        node.actions.forEach((action) => this.actions.set(action._id, action)),
      ),
    )
  }

  /**
   * Cache for event listeners added by this SessionClient instance.
   */
  private listeners: [TServerMethod, TServerHandler<any>][]

  /**
   * Creates session-specific listeners.
   */
  private addListeners(): void {
    this.listeners.forEach(([event, handler]) => {
      this.server.addEventListener(event, handler)
    })
  }

  /**
   * Removes session-specific listeners.
   */
  private removeListeners(): void {
    this.listeners.forEach(([event, handler]) => {
      this.server.removeEventListener(event, handler)
    })
  }

  // Implemented
  public toJson(): TSessionJson {
    return {
      _id: this._id,
      state: this.state,
      name: this.name,
      ownerId: this.ownerId,
      ownerUsername: this.ownerUsername,
      ownerFirstName: this.ownerFirstName,
      ownerLastName: this.ownerLastName,
      launchedAt: this.launchedAt.toISOString(),
      mission: this.mission.toExistingJson({
        forceExposure: { expose: 'none' },
        fileExposure: { expose: 'none' },
        sessionDataExposure: {
          expose: 'member-specific',
          memberId: this.member._id,
        },
        rootEffectsExposure: { expose: 'none' },
      }),
      members: this.members.map((member) => member.toJson()),
      banList: this.banList,
      config: this.config,
    }
  }

  // Implemented
  public toBasicJson(): TSessionBasicJson {
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
      participantIds: this.participants.map(({ _id: memberId }) => memberId),
      banList: this.banList,
      observerIds: this.observers.map(({ _id: memberId }) => memberId),
      managerIds: this.managers.map(({ _id: memberId }) => memberId),
    }
  }

  /**
   * Opens a node.
   * @param nodeId The ID of the node to be opened.
   */
  public openNode(nodeId: string, options: TSessionRequestOptions = {}): void {
    // Gather details.
    let server: ServerConnection = this.server
    let node: ClientMissionNode | undefined = this.mission.getNodeById(nodeId)

    // Callback for errors.
    const onError = (message: string) => {
      console.error(message)
      if (options.onError) options.onError(message)
    }

    // If the member is not authorized to open nodes,
    // callback an error.
    if (!this.member.isAuthorized('manipulateNodes')) {
      return onError('You do not have the correct permissions to open nodes.')
    }
    // Callback error if the node is not in
    // the mission associated with this
    // session.
    if (node === undefined) {
      return onError('Node was not found in the mission.')
    }
    // If the node is not openable, callback
    // an error.
    if (!node.openable) {
      return onError('Node is not openable.')
    }

    // Emit a request to open the node.
    server.request(
      'request-open-node',
      {
        nodeId,
      },
      `Opening "${node.name}".`,
      {
        // Handle error emitted by server concerning the
        // request.
        onResponse: (event) => {
          if (event.method === 'node-opened') {
            this.mission.emitEvent('autopan')
          }

          if (event.method === 'error') {
            onError(event.message)
            node!.handleRequestFailed('request-open-node')
          }
        },
      },
    )

    // Handle request within node.
    node.handleRequestMade('request-open-node')
  }

  /**
   * Executes an action.
   * @param actionId The ID of the action to be executed.
   */
  public executeAction(
    actionId: string,
    options: TExecuteActionOptions = {},
  ): void {
    let server: ServerConnection = this.server
    let action: ClientMissionAction | undefined = this.actions.get(actionId)
    const { cheats } = options

    // Callback for errors.
    const onError = (message: string) => {
      console.error(message)
      if (options.onError) options.onError(message)
    }

    // If the member is not authorized to execute actions,
    // callback an error.
    if (!this.member.isAuthorized('manipulateNodes')) {
      return onError(
        'You do not have the correct permissions to execute actions.',
      )
    }
    // Callback error if the action is not in
    // the mission associated with this
    // session.
    if (action === undefined) {
      return onError('Action was not found in the mission.')
    }
    // If the action is not executable, callback
    // an error.
    if (!action.node.executable) {
      return onError('Node is not executable.')
    }

    // Emit a request to execute the action.
    server.request(
      'request-execute-action',
      {
        actionId,
        cheats,
      },
      `Executing "${action.name}" on "${action.node.name}".`,
      {
        onResponse: (event) => {
          // Handle error emitted by server concerning the
          // request.
          if (event.method === 'error') {
            onError(event.message)
            action!.node.handleRequestFailed('request-execute-action')
          }
        },
      },
    )

    // Handle request within node.
    action.node.handleRequestMade('request-execute-action')
  }

  /**
   * Sends the node's pre-execution message to the output panel.
   * @param nodeId The ID of the node with the pre-execution message.
   * @param options The options for sending the pre-execution message.
   */
  public sendPreExecutionMessage(
    nodeId: ClientMissionNode['_id'],
    options: TSessionRequestOptions = {},
  ) {
    // Gather details.
    let server: ServerConnection = this.server
    let node: ClientMissionNode | undefined = this.mission.getNodeById(nodeId)
    let { onError = () => {} } = options

    // If the node doesn't have a pre-execution message,
    // or is currently executing, don't send the message.
    if (!node?.preExecutionText || node.executing) return

    // If the member does not have the correct permissions,
    // callback an error.
    if (!this.member.isAuthorized('manipulateNodes')) {
      return onError('You are not authorized to send pre-execution messages.')
    }

    // Callback error if the node is not in
    // the mission associated with this
    // session.
    if (node === undefined) {
      return onError('Node was not found in the mission.')
    }

    // Emit a request to send the pre-execution message.
    server.request(
      'request-send-output',
      {
        key: 'pre-execution',
        nodeId,
      },
      `Sending pre-execution message for "${node.name}".`,
      {
        // Handle error emitted by server concerning the
        // request.
        onResponse: (event) => {
          if (event.method === 'error') {
            onError(event.message)
            node?.handleRequestFailed('request-send-output')
          }
        },
      },
    )

    // Handle request within node.
    node.handleRequestMade('request-send-output')
  }

  /**
   * Request to quit the session.
   * @returns A promise that resolves when the session is quitted.
   */
  public async $quit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.server.request('request-quit-session', {}, 'Quitting session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-quit':
              resolve()
              break
            case 'error':
              reject(new Error(event.message))
              break
            default:
              let error: Error = new Error(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
              console.log(error)
              console.log(event)
              reject(error)
          }
        },
      })
    })
  }

  /**
   * Starts the session.
   * @resolves When the session has started.
   * @rejects If the session failed to start, or if the session has already
   * started or ended.
   */
  public async $start(options: TSessionLifecycleOptions = {}): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { onInit = () => {} } = options

      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session has already started, throw an error.
      if (this.state === 'started') {
        return onError('Session has already started.')
      }
      // If the session has already ended, throw an error.
      if (this.state === 'ended') {
        return onError('Session has already ended.')
      }

      // Emit a request to start the session.
      this.server.request('request-start-session', {}, 'Starting session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-starting':
              this._state = 'starting'
              onInit()
              break
            case 'session-started':
              this._state = 'started'
              return resolve()
            case 'error':
              return onError(event.message)
            default:
              return onError(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
          }
        },
      })
    })
  }

  /**
   * Ends the session.
   * @resolves When the session has ended.
   * @rejects If the session failed to end, or if the session has already
   * ended or has not yet started.
   */
  public async $end(options: TSessionLifecycleOptions = {}): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { onInit = () => {} } = options

      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session is unstarted, throw an error.
      if (this.state === 'unstarted') {
        return onError('Session has not yet started.')
      }
      // If the session has already ended, throw an error.
      if (this.state === 'ended') {
        return onError('Session has already ended.')
      }

      // Emit a request to end the session.
      this.server.request('request-end-session', {}, 'Ending session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-ending':
              this._state = 'ending'
              onInit()
              break
            case 'session-ended':
              this._state = 'ended'
              return resolve()
            case 'error':
              return onError(event.message)
            default:
              return onError(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
          }
        },
      })
    })
  }

  /**
   * Resets the session.
   * @resolves When the session has been reset.
   * @rejects If the session failed to reset, or if the session
   * has not yet started.
   */
  public async $reset(options: TSessionLifecycleOptions = {}): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const { onInit = () => {} } = options

      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session has not started, throw an error.
      if (this.state === 'unstarted') {
        return onError('Session has not yet started.')
      }

      // Emit a request to reset the session.
      this.server.request('request-reset-session', {}, 'Resetting session.', {
        onResponse: (event) => {
          switch (event.method) {
            case 'session-resetting':
              this._state = 'resetting'
              onInit()
              break
            case 'session-reset':
              this._state = 'started'
              return resolve()
            case 'error':
              return onError(event.message)
            default:
              return onError(
                `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
              )
          }
        },
      })
    })
  }

  /**
   * Updates the session config.
   * @param configUpdates The updates to the session config.
   * @resolves When the session config has been updated.
   * @rejects If the session failed to update config, or if the session has already
   * started or ended.
   */
  public async $updateConfig(
    configUpdates: Partial<TSessionConfig>,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // If the session has already started, throw an error.
      if (this.state === 'started') {
        return onError('Session has already started.')
      }
      // If the session has already ended, throw an error.
      if (this.state === 'ended') {
        return onError('Session has already ended.')
      }

      // Emit a request to end the session.
      this.server.request(
        'request-config-update',
        { config: configUpdates },
        'Updating config.',
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'session-config-updated':
                // Update the session config.
                Object.assign(this._config, configUpdates)
                // Update the session name if it has changed.
                if (this.name !== configUpdates.name && configUpdates.name) {
                  this.name = configUpdates.name
                }
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Kicks a member from the session.
   * @param memberId The ID of the member to be kicked.
   * @resolves When the member has been kicked.
   * @rejects If the member failed to be kicked.
   */
  public async $kick(memberId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to kick the user.
      this.server.request(
        'request-kick',
        { memberId },
        `Kicking "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'kicked':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Bans a member from the session.
   * @param memberId The ID of the member to be banned.
   * @resolves When the member has been banned.
   * @rejects If the member failed to be banned.
   */
  public async $ban(memberId: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to ban the user.
      this.server.request(
        'request-ban',
        { memberId },
        `Banning "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'banned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Assigns a force to a member.
   * @param memberId The ID of the member to be assigned.
   * @param forceId The ID of the force to be assigned, `null` if unassigning.
   * @resolves When the force has been assigned.
   * @rejects If the force failed to be assigned.
   */
  public async $assignForce(
    memberId: string,
    forceId: string | null,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to assign the force.
      this.server.request(
        'request-assign-force',
        { memberId, forceId },
        `Assigning force to "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'force-assigned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Assigns a role to a member.
   * @param memberId The ID of the member to be assigned.
   * @param roleId The ID of the role to be assigned.
   * @resolves When the role has been assigned.
   * @rejects If the role failed to be assigned.
   */
  public async $assignRole(
    memberId: string,
    roleId: TMemberRoleId,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Callback for errors.
      const onError = (message: string) => {
        let error: Error = new Error(message)
        console.error(message)
        console.error(error)
        reject(error)
      }

      // Get the member.
      let member = this.getMember(memberId)

      // If the member is not found,
      // callback an error.
      if (member === undefined) {
        return onError('Member not found.')
      }

      // Emit a request to assign the role.
      this.server.request(
        'request-assign-role',
        { memberId, roleId },
        `Assigning role to "${member.user.username}".`,
        {
          onResponse: (event) => {
            switch (event.method) {
              case 'role-assigned':
                return resolve()
              case 'error':
                return onError(event.message)
              default:
                return onError(
                  `Unknown response method for ${event.request.event.method}: '${event.method}'.`,
                )
            }
          },
        },
      )
    })
  }

  /**
   * Imports data provided to a member when the session
   * is started or reset.
   * @param event The event emitted by the server.
   */
  private importStartData(
    event: TResponseEvents['session-started' | 'session-reset'],
  ): void {
    // Gather details.
    let { structure, forces, prototypes, files } = event.data
    // Mark the session as started.
    this._state = 'started'
    // Import start data, revealing forces to user.
    this.mission.importStartData(structure, forces, prototypes, files)
    // Remap actions.
    this.mapActions()
  }

  /**
   * Handles the blocking and unblocking of nodes.
   * @param nodeId The ID of the node to be blocked or unblocked.
   * @param blocked Whether or not the node is blocked.
   */
  private updateNodeBlockStatus = (nodeId: string, blocked: boolean): void => {
    // Find the node, given the ID.
    let node = this.mission.getNodeById(nodeId)
    // Handle the blocking and unblocking of the node.
    if (node) node.blocked = blocked
  }

  /**
   * Modifies the success chance of a specific action within a node or
   * all actions within a node.
   * @param successChanceOperand The operand to modify the success chance by.
   * @param nodeId The ID of the node.
   * @param actionId The ID of the action.
   * @note If the action is not provided, the success chance of all actions
   * within the node will be modified.
   */
  private modifySuccessChance = (
    successChanceOperand: number,
    nodeId: string,
    actionId?: string,
  ): void => {
    // Find the node, given the ID.
    let node = this.mission.getNodeById(nodeId)
    // Modify the success chance for all the node's actions.
    node?.modifySuccessChance(successChanceOperand, actionId)
  }

  /**
   * Modifies the process time of a specific action within a node or
   * all actions within a node.
   * @param processTimeOperand The operand to modify the process time by.
   * @param nodeId The ID of the node.
   * @param actionId The ID of the action.
   * @note If the action is not provided, the process time of all actions
   * within the node will be modified.
   */
  private modifyProcessTime = (
    processTimeOperand: number,
    nodeId: string,
    actionId?: string,
  ): void => {
    // Find the node, given the ID.
    let node = this.mission.getNodeById(nodeId)
    // Modify the process time for all the node's actions.
    node?.modifyProcessTime(processTimeOperand, actionId)
  }

  /**
   * Modifies the resource cost of a specific action within a node or
   * all actions within a node.
   * @param resourceCostOperand The operand to modify the resource cost by.
   * @param nodeId The ID of the node.
   * @param actionId The ID of the action.
   * @note If the action is not provided, the resource cost of all actions
   * within the node will be modified.
   */
  private modifyResourceCost = (
    resourceCostOperand: number,
    nodeId: string,
    actionId?: string,
  ): void => {
    // Find the node, given the ID.
    let node = this.mission.getNodeById(nodeId)
    // Modify the resource cost for all the node's actions.
    node?.modifyResourceCost(resourceCostOperand, actionId)
  }

  /**
   * Modifies the resource pool of a force.
   * @param forceId The ID of the force.
   * @param operand The operand to modify the resource pool by.
   */
  private modifyResourcePool = (forceId: string, operand: number): void => {
    // Find the force, given the ID.
    let force = this.mission.getForceById(forceId)
    // Modify the resource pool for the force.
    force?.modifyResourcePool(operand)
  }

  /**
   * Handles the granting/revoking of access to a file.
   * @param fileId The ID of the file in question.
   * @param forceId The ID of the force with newly granted/revoked access.
   * @param granted Whether or not the access is granted.
   */
  private updateFileAccess = (data: TFileAccessModifierData): void => {
    let force = this.mission.getForceById(data.forceId)
    let file = this.mission.getFileById(data.fileId)

    // If the force is not found, abort.
    if (!force) return

    // Handle file-access change based on whether
    // access is granted or revoked.
    if (data.granted) {
      // If the file is not found in the mission,
      // add it to the mission.
      if (!file) {
        file = ClientMissionFile.fromJson(data.fileData, this.mission)
        this.mission.files.push(file)
      }
      // Grant access for the force to the file.
      file.grantAccess(force)
    } else {
      // If the following conditions are met, remove
      // the file from the mission entirely:
      // 1. The file currently is found in the mission.
      // 2. The member is assigned to the force in question.
      // 3. The member does not have complete visibility, which
      //    would otherwise negate file-access restrictions.
      if (
        file &&
        this.member.forceId === data.forceId &&
        !this.member.isAuthorized('completeVisibility')
      ) {
        this.mission.files = this.mission.files.filter(
          (f) => f._id !== file!._id,
        )
      }
      // Revoke access for the force to the file.
      if (file) file.revokeAccess(force)
    }
  }

  /**
   * Handles clean-up when a session is quitted, ended,
   * or destroyed.
   */
  private cleanUp(): void {
    this.removeListeners()
    this.server.clearUnfulfilledRequests()
  }

  /**
   * Handles when the session is starting.
   * @param event The event emitted by the server.
   */
  private onStarting = (event: TResponseEvents['session-starting']): void => {
    this._state = 'starting'
  }

  /**
   * Handles when the session is started.
   * @param event The event emitted by the server.
   */
  private onStart = (event: TResponseEvents['session-started']): void => {
    this.importStartData(event)
  }

  /**
   * Handles when the session is ending.
   * @param event The event emitted by the server.
   */
  private onEnding = (event: TResponseEvents['session-ending']): void => {
    this._state = 'ending'
  }

  /**
   * Handles when the session is ended.
   * @param event The event emitted by the server.
   */
  private onEnd = (): void => {
    this._state = 'ended'
    this.cleanUp()
  }

  /**
   * Handles when the session is reset.
   * @param event The event emitted by the server.
   */
  private onReset = (event: TResponseEvents['session-reset']): void => {
    this.importStartData(event)
  }

  /**
   * Handles when the member is kicked from the session.
   */
  private onKicked = (event: TServerEvents['kicked']): void => {
    if (event.data.memberId === this.memberId) {
      this.cleanUp()
    }
  }

  /**
   * Handles when the member is banned from the session.
   */
  private onBanned = (event: TServerEvents['banned']): void => {
    if (event.data.memberId === this.memberId) {
      this.cleanUp()
    }
  }

  /**
   * Handles when the member is dismissed from the session.
   */
  private onDismissed = (event: TServerEvents['dismissed']): void => {
    this.cleanUp()
  }

  /**
   * Handles when the session is destroyed.
   */
  private onDestroyed = (event: TServerEvents['session-destroyed']): void => {
    this._state = 'ended'
    this.cleanUp()
  }

  /**
   * Handles when the member quits the session.
   */
  private onQuit = (event: TServerEvents['session-quit']): void => {
    this.cleanUp()
  }

  /**
   * Handles when the session configuration is updated.
   * @param event The event emitted by the server.
   */
  private onConfigUpdate = (
    event: TServerEvents['session-config-updated'],
  ): void => {
    this._config = event.data.config
  }

  /**
   * Handles when the lists of users joined in the session
   * changes, due to a join, quit, kick, or ban.
   * @param event The event emitted by the server.
   */
  private onUsersUpdated = (
    event: TGenericServerEvents['session-members-updated'],
  ): void => {
    let { members } = event.data
    this._members = members.map(
      ({ _id, user: userData, roleId, forceId }) =>
        new ClientSessionMember(
          _id,
          ClientUser.fromExistingJson(userData),
          roleId,
          forceId,
          this,
        ),
    )
  }

  /**
   * Handles when a force is assigned to a member.
   * @param event The event emitted by the server.
   */
  private onForceAssigned = (event: TServerEvents['force-assigned']): void => {
    let { memberId, forceId } = event.data
    let member = this.getMember(memberId)
    if (member === undefined) {
      return console.warn(
        `Event "force-assigned" was triggered, but the member with the given memberId ("${memberId}") could not be found.`,
      )
    }
    member.forceId = forceId
  }

  /**
   * Handles when a role is assigned to a member.
   * @param event The event emitted by the server.
   */
  private onRoleAssigned = (event: TServerEvents['role-assigned']): void => {
    let { memberId, roleId } = event.data
    let member = this.getMember(memberId)
    let role = MemberRole.get(roleId)
    if (member === undefined) {
      return console.warn(
        `Event "role-assigned" was triggered, but the member with the given memberId ("${memberId}") could not be found.`,
      )
    }
    member.role = role
  }

  /**
   * Handles when a modifier has been enacted.
   * @param event The event emitted by the server.
   */
  private onModifierEnacted = (
    event: TServerEvents['modifier-enacted'],
  ): void => {
    // Extract data.
    const { data } = event
    // Handle the data.
    switch (data.key) {
      case 'node-update-block-status':
        this.updateNodeBlockStatus(data.nodeId, data.blocked)
        break
      case 'node-update-open-state':
        this.onChangeNodeOpenState({
          nodeId: data.nodeId,
          opened: data.opened,
          structure: data.structure,
          revealedDescendants: data.revealedDescendants,
          revealedDescendantPrototypes: data.revealedDescendantPrototypes,
        })
        break
      case 'node-action-success-chance':
        this.modifySuccessChance(
          data.successChanceOperand,
          data.nodeId,
          data.actionId,
        )
        break
      case 'node-action-process-time':
        this.modifyProcessTime(
          data.processTimeOperand,
          data.nodeId,
          data.actionId,
        )
        break
      case 'node-action-resource-cost':
        this.modifyResourceCost(
          data.resourceCostOperand,
          data.nodeId,
          data.actionId,
        )
        break
      case 'force-resource-pool':
        this.modifyResourcePool(data.forceId, data.operand)
        break
      case 'file-update-access':
        this.updateFileAccess(data)
        break
      default:
        return console.warn(
          `Error: Data format sent to modifier handler is not recognized. Data: ${data}`,
        )
    }
  }

  /**
   * Handles when an output has been sent.
   * @param event The event emitted by the server.
   */
  private onSendOutput = (event: TServerEvents['send-output']): void => {
    let { outputData } = event.data
    let { forceId } = outputData
    let force = this.mission.getForceById(forceId)
    if (force) {
      let output = new ClientOutput(force, outputData)
      force.storeOutput(output)
    }
  }

  /**
   * Handles when an output has been sent.
   * @param event The event emitted by the server.
   */
  private onOutputSent = (event: TServerEvents['output-sent']): void => {
    // Extract data.
    let { key } = event.data

    switch (key) {
      case 'pre-execution':
        let { nodeId } = event.data
        let node = this.mission.getNodeById(nodeId)
        node?.onOutput()
    }
  }

  /**
   * Handles when a node-opened response is received from the server.
   * @param event The event emitted by the server.
   */
  private onNodeOpenedResponse = (
    event: TServerEvents['node-opened'],
  ): void => {
    const {
      nodeId,
      opened,
      structure,
      revealedDescendants,
      revealedDescendantPrototypes,
    } = event.data

    return this.onChangeNodeOpenState({
      nodeId,
      opened,
      structure,
      revealedDescendants,
      revealedDescendantPrototypes,
    })
  }

  /**
   * Handles when action execution has been initiated.
   * @param event The event emitted by the server.'
   */
  private onActionExecutionInitiated = (
    event: TServerEvents['action-execution-initiated'],
  ): void => {
    // Extract data.
    const { resourcesRemaining } = event.data
    // Type is defined here below because for some reason
    // there are type issues when I extract it using
    // the destructuring syntax above.
    const executionData: TActionExecutionJson = event.data.execution
    const { actionId } = executionData

    // Find the action and node, given the action ID.
    let action: ClientMissionAction | undefined = this.actions.get(actionId)
    let node: ClientMissionNode

    // Handle action not found.
    if (action === undefined) {
      return console.error(
        `Event "action-execution-initiated" was triggered, but the action with the given actionId ("${actionId}") could not be found.`,
      )
    }

    // Handle action found.
    node = action.node
    // Create a new execution object.
    let execution = new ClientActionExecution(
      executionData._id,
      action,
      executionData.start,
      executionData.end,
    )

    // Handle execution on the node.
    node.onExecution(execution)

    // Update the resources remaining for
    // the force.
    action.force.resourcesRemaining = resourcesRemaining
  }

  /**
   * Handles when action execution has been completed.
   * @param event The event emitted by the server.
   */
  private onActionExecutionCompleted = (
    event: TServerEvents['action-execution-completed'],
  ): void => {
    // Gather data.
    const { structure, revealedDescendants, revealedDescendantPrototypes } =
      event.data

    const outcomeData: TExecutionOutcomeJson = event.data.outcome
    const { executionId } = outcomeData
    const execution = this.mission.getExecution(executionId)
    if (!execution) {
      return console.error(`Execution "${executionId}" could not be found.`)
    }
    const { node } = execution
    const { prototype } = node

    const outcome = new ClientExecutionOutcome(
      outcomeData._id,
      outcomeData.state,
      execution,
    )

    // Handle outcome on different levels.
    execution.onOutcome(outcome)
    prototype.onOpen(revealedDescendantPrototypes, structure)
    node.onOpen(revealedDescendants)

    node.emitEvent('exec-state-change')

    // Remap actions if there are revealed nodes, since
    // those revealed nodes may contain new actions.
    if (revealedDescendants) this.mapActions()
  }

  /**
   * Handles node open/close state change events from the server.
   * @param data The event data containing the node ID, new state, and revealed descendants.
   * @note This coordinates updates at both the prototype (template) and node (instance) levels.
   * @note If the node hasn't been revealed to this member yet, the event is ignored with a warning.
   */
  private onChangeNodeOpenState = (data: TNodeOpenStateData): void => {
    // Extract the event data.
    const {
      nodeId,
      opened,
      structure,
      revealedDescendants,
      revealedDescendantPrototypes,
    } = data

    // Find the target node in the mission.
    const node = this.mission.getNodeById(nodeId)
    if (!node) {
      return console.warn(
        `Node "${nodeId}" was not found. This is likely due to an effect being applied to a node that has not yet been revealed to the user.`,
      )
    }
    const { prototype } = node

    // Update both the prototype (template level) and node (instance level).
    if (opened) {
      // Opening: Reveal descendants and establish structure relationships.
      prototype.onOpen(revealedDescendantPrototypes, structure)
      node.onOpen(revealedDescendants)
    } else {
      // Closing: Hide descendants (unless member has complete visibility).
      prototype.onClose(this.member)
      node.onClose(this.member)
    }

    // Rebuild the action map if new nodes were revealed during opening.
    if (revealedDescendants) this.mapActions()
  }

  /**
   * Fetches all sessions publicly available.
   * @resolves To the sessions.
   * @rejects If the sessions failed to be fetched.
   */
  public static $fetchAll(): Promise<SessionBasic[]> {
    return new Promise<SessionBasic[]>(
      async (
        resolve: (sessions: SessionBasic[]) => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to fetch all sessions.
          let sessionData: TSessionBasicJson[] = (
            await axios.get<TSessionBasicJson[]>(MissionSession.API_ENDPOINT, {
              params: { timeStamp: Date.now().toString() },
            })
          ).data
          return resolve(sessionData.map((datum) => new SessionBasic(datum)))
        } catch (error) {
          console.error('Failed to fetch sessions.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }

  /**
   * Launches a new session with a new session ID.
   * @param missionId  The ID of the mission being executed in the session.
   * @resolves To the session ID.
   * @rejects If the session failed to launch.
   */
  public static async $launch(
    missionId: string,
    sessionConfig: Partial<TSessionConfig>,
  ): Promise<string> {
    try {
      // Call API to launch new session with
      // the mission ID. Await the generated
      // session ID.
      let { sessionId } = (
        await axios.post<{ sessionId: string }>(
          `${MissionSession.API_ENDPOINT}/launch/`,
          {
            missionId,
            ...sessionConfig,
          },
        )
      ).data
      return sessionId
    } catch (error) {
      console.error('Failed to launch session.')
      console.error(error)
      throw error
    }
  }

  /**
   * Deletes a session with the given ID.
   * @param _id The ID of the session to be deleted.
   * @resolves When the session has been deleted.
   * @rejects If the session failed to be deleted.
   */
  public static $delete(_id: string): Promise<void> {
    return new Promise<void>(
      async (
        resolve: () => void,
        reject: (error: any) => void,
      ): Promise<void> => {
        try {
          // Call API to delete session.
          await axios.delete(`${MissionSession.API_ENDPOINT}/${_id}`)
          return resolve()
        } catch (error) {
          console.error('Failed to delete session.')
          console.error(error)
          return reject(error)
        }
      },
    )
  }
}

/* -- TYPES -- */

/**
 * Options for methods that make requests to
 * the server via WS.
 */
type TSessionRequestOptions = {
  /**
   * Callback for errors.
   * @param message The error message.
   */
  onError?: (message: string) => void
}

/**
 * Options to pass to {@link SessionClient.$start},
 * {@link SessionClient.$end} and {@link SessionClient.$reset}
 * methods.
 */
type TSessionLifecycleOptions = {
  /**
   * Callback for when the server acknowledges
   * the request to start the session and has
   * marked the session as 'starting'.
   */
  onInit?: () => void
}

/**
 * Options for `executeAction` method.
 */
interface TExecuteActionOptions extends TSessionRequestOptions {
  /**
   * The cheats to be applied when executing the action.
   * @note If the member is not authorized to use cheats, this
   * will be ignored.
   * @note Any ommitted cheats will be considered `false`.
   */
  cheats?: Partial<TExecutionCheats>
}
