import {
  TActionExecutionJson,
  TExecutionCheats,
} from 'metis/missions/actions/executions'
import { TExecutionOutcomeJson } from 'metis/missions/actions/outcomes'
import { TMissionFileJson } from 'metis/missions/files'
import { TMissionForceSaveJson } from 'metis/missions/forces'
import { TOutputJson } from 'metis/missions/forces/output'
import { TMissionPrototypeJson } from 'metis/missions/nodes/prototypes'
import { TSessionConfig, TSessionJson } from 'metis/sessions'
import SessionMember, { TSessionMemberJson } from 'metis/sessions/members'
import MemberRole from 'metis/sessions/members/roles'
import { AnyObject } from 'metis/toolbox/objects'
import { MetisComponent } from '..'
import { TMissionNodeJson } from '../missions/nodes'

/* -- TYPES -- */

/**
 * Represents the status of a server connection.
 */
export type TServerConnectionStatus = 'open' | 'closed' | 'connecting'

/**
 * Represents an event emitted by the client or server over a web socket connection.
 */
export interface TConnectEvent<TMethod extends string, TData extends {} = {}> {
  method: TMethod
  data: TData
}

/**
 * Represents an event emitted by the client that expects a response by the server.
 */
export interface TRequestEvent<TMethod extends string, TData extends {} = {}>
  extends TConnectEvent<TMethod, TData> {
  requestId: string
}

/**
 * The request that triggered this response,
 * stored in the response for reference by
 * the client.
 */
export type TRequestOfResponse = {
  /**
   * The request event.
   */
  event: TRequestEvent<TClientMethod>
  /**
   * The ID of the client that made the request.
   */
  requesterId: string
  /**
   * Whether the request has been fulfilled.
   */
  fulfilled: boolean
}

/**
 * Represents an event emitted by the server in response to a request by the client.
 */
export interface TResponseEvent<
  TMethod extends string,
  TData extends {},
  TReqEvent extends TRequestEvent<string, {}>,
> extends TConnectEvent<TMethod, TData> {
  request: TRequestOfResponse
}

/**
 * Represents any event emitted by the server in response to a request by the client.
 */
export type TAnyResponseEvent = TResponseEvent<
  string,
  {},
  TRequestEvent<string, {}>
>

/**
 * Represents a type of generic event that occurs on the client that is sent to the server over a web
 * socket.
 */
export type TGenericClientMethod = keyof TGenericClientEvents

/**
 * Represents a type of event that occurs on the client that is sent to the server over a web
 * socket as a request, expecting a response.
 */
export type TRequestMethod = keyof TRequestEvents

/**
 * Represents the type of any event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientMethod = keyof TClientEvents

/**
 * Represents an event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientEvent = TClientEvents[TClientMethod]

/**
 * Represents a type of generic event that occurs on the server that is sent to the client over a web socket.
 */
export type TGenericServerMethod = keyof TGenericServerEvents

/**
 * Represents a type of event that occurs on the server that is sent to the client over a web socket as a response
 * to a request.
 */
export type TResponseMethod = keyof TResponseEvents

/**
 * Represents a type of event that occurs on the server that is sent to the client over a web socket.
 */
export type TServerMethod = keyof TServerEvents

/**
 * Represents an event that occurs on the server that is sent to the client over a web socket.
 */
export type TServerEvent = TServerEvents[TServerMethod]

/**
 * Used to identify the data structure.
 * @option `"node-update-block-status":` The data needed to block or unblock a node.
 * @option `"node-update-open-state":` The data needed to open or close a node determining if its descendants are revealed.
 * @option `"node-action-success-chance":` The data needed to modify the success chance of all the node's actions.
 * @option `"node-action-process-time":` The data needed to modify the process time of all the node's actions.
 * @option `"node-action-resource-cost":` The data needed to modify the resource cost of all the node's actions.
 * @option `"force-resource-pool":` The data needed to modify the resource pool of a force.
 * @option `"file-update-access":` The data needed to modify the access of a file for a force.
 */
type TModifierDataKey =
  | 'node-update-block-status'
  | 'node-update-open-state'
  | 'node-action-success-chance'
  | 'node-action-process-time'
  | 'node-action-resource-cost'
  | 'force-resource-pool'
  | 'file-update-access'

/**
 * The data necessary to apply a modifier to an object in METIS.
 */
type TModifierData = [
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'node-update-block-status'
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * Whether the node is blocked or not.
     */
    blocked: boolean
  },
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'node-update-open-state'
  } & TNodeOpenStateData,
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'node-action-success-chance'
    /**
     * The operand used to modify the chance of succes for all the node's actions.
     */
    successChanceOperand: number
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * The ID of the action to modify.
     * @note If not provided, all actions will be modified.
     */
    actionId?: string
  },
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'node-action-process-time'
    /**
     * The operand used to modify the process time for all the node's actions.
     */
    processTimeOperand: number
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * The ID of the action to modify.
     * @note If not provided, all actions will be modified.
     */
    actionId?: string
  },
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'node-action-resource-cost'
    /**
     * The operand used to modify the resource cost for all the node's actions.
     */
    resourceCostOperand: number
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * The ID of the action to modify.
     * @note If not provided, all actions will be modified.
     */
    actionId?: string
  },
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'force-resource-pool'
    /**
     * The ID of the force to modify.
     */
    forceId: string
    /**
     * The operand used to modify the resource pool of the force.
     */
    operand: number
  },
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'file-update-access'
    /**
     * The ID of the force to modify.
     */
    forceId: string
    /**
     * The ID of the file to modify.
     */
    fileId: string
    /**
     * The access to grant or revoke.
     */
    granted: true
    /**
     * The data for the file now accessible to
     * the force.
     */
    fileData: TMissionFileJson
  },
  {
    /**
     * @see {@link TModifierDataKey}
     */
    key: 'file-update-access'
    /**
     * The ID of the force to modify.
     */
    forceId: string
    /**
     * The ID of the file to modify.
     */
    fileId: string
    /**
     * The access to grant or revoke.
     */
    granted: false
  },
]

/**
 * Modifier data for granting/revoking access to a file.
 */
export type TFileAccessModifierData = Extract<
  TModifierData[number],
  { key: 'file-update-access' }
>

/**
 * The data needed to apply a modifier to an object in METIS.
 */
type TModifierDatum = Extract<TModifierData[number], { key: TModifierDataKey }>

/**
 * The data necessary to send a message to the output panel.
 */
type TOutputData = [
  {
    /**
     * Used to identify the data structure.
     * @option `"pre-execution":` The data needed to send a node's pre-execution message to the output panel.
     */
    key: 'pre-execution'
    /**
     * The ID of the node with the pre-execution message to send.
     */
    nodeId: string
  },
]

/**
 * The data needed to send a message to the output panel.
 */
export type TOutputDatum = TOutputData[number]

/**
 * The data needed to open or close a node, determining if its descendants are revealed.
 */
export type TNodeOpenStateData = {
  /**
   * The ID of the node to modify.
   */
  nodeId: string
  /**
   * Whether the node is open or closed.
   */
  opened: boolean
  /**
   * The structure of the nodes that were revealed as a result of opening the node.
   */
  structure: AnyObject
  /**
   * The nodes that were revealed as a result of opening the node.
   */
  revealedDescendants: TMissionNodeJson[]
  /**
   * The prototypes of the nodes that were revealed as a result of opening the node.
   */
  revealedDescendantPrototypes: TMissionPrototypeJson[]
}

/**
 * General WS events emitted by the server, or caused due to a change in the connection with the server.
 */
export type TGenericServerEvents = {
  /**
   * Occurs when any activity occurs with the connection to the server.
   * @note Includes emitted events to and from the server, connection changes, and errors.
   * @note This will be the last in the call chain, and will be handled after all other event types
   * by the connection.
   */
  'activity': TConnectEvent<'activity'>
  /**
   * Occurs when the client is successful in its initial connection to the server.
   */
  'connection-success': TConnectEvent<'connection-success'>
  /**
   * Occurs when the connection with the server is closed purposefully.
   */
  'connection-closed': TConnectEvent<'connection-closed'>
  /**
   * Occurs when the client loses connection to the server unexpectedly.
   */
  'connection-loss': TConnectEvent<'connection-loss'>
  /**
   * Occurs when the client fails to connect to the server.
   */
  'connection-failure': TConnectEvent<'connection-failure'>
  /**
   * Occurs when the client successfully reconnects to the server.
   */
  'reconnection-success': TConnectEvent<'reconnection-success'>
  /**
   * Occurs when the client fails to reconnect to the server.
   */
  'reconnection-failure': TConnectEvent<'reconnection-failure'>
  /**
   * Occurs during any change in the connection status of the client.
   */
  'connection-change': TConnectEvent<
    'connection-change',
    {
      /**
       * The new status of the connection, after the change.
       */
      status: TServerConnectionStatus
    }
  >
  /**
   * Occurs for a member who was dismissed from the session,
   * due to not being assigned to a force when the session starts.
   */
  'dismissed': TConnectEvent<'dismissed', {}>
  /**
   * Occurs when a user joins or quits the session.
   */
  'session-members-updated': TConnectEvent<
    'session-members-updated',
    {
      /**
       * The updated list of members in the session.
       */
      members: TSessionMemberJson[]
    }
  >
  /**
   * Occurs when modifiers are applied to an object in METIS.
   */
  'modifier-enacted': TConnectEvent<'modifier-enacted', TModifierDatum>
  /**
   * Occurs when the session has been destroyed while the participant was in it.
   */
  'session-destroyed': TConnectEvent<
    'session-destroyed',
    {
      /**
       * The ID of the session that was destroyed.
       */
      sessionId: string
    }
  >
  /**
   * Occurs when a message is sent to the output panel.
   */
  'send-output': TConnectEvent<
    'send-output',
    {
      /**
       * The message to send to the force's output panel.
       */
      outputData: TOutputJson
    }
  >
  /**
   * Occurs when the client needs to be logged out due to the user account being updated.
   */
  'logout-user-update': TConnectEvent<'logout-user-update', {}>
  /**
   * Occurs when the server intentionally emits an error to client.
   */
  'error': {
    /**
     * The event method (Always "error").
     */
    method: 'error'
    /**
     * The error code (See shared/connect/errors.ts).
     */
    code: number
    /**
     * The message explaining the error.
     */
    message: string
    /**
     * The request that caused the error, if any.
     */
    request?: TRequestOfResponse
  }
}

/**
 * WS events emitted by the server as a response to a request made by the client.
 */
export type TResponseEvents = {
  /**
   * Occurs when the session is starting (transitionary state).
   */
  'session-starting': TResponseEvent<
    'session-starting',
    {},
    TClientEvents['request-start-session']
  >
  /**
   * Occurs when the session starts while the client is joined.
   */
  'session-started': TResponseEvent<
    'session-started',
    {
      /**
       * The node structure available to the client.
       */
      structure: AnyObject
      /**
       * The force(s) the client has access to.
       */
      forces: TMissionForceSaveJson[]
      /**
       * The prototype data used to create the mission's structure of nodes.
       */
      prototypes: TMissionPrototypeJson[]
      /**
       * The file(s) that the client has access to.
       */
      files: TMissionFileJson[]
    },
    TClientEvents['request-start-session']
  >
  /**
   * Occurs when the session is ending (transitionary state).
   */
  'session-ending': TResponseEvent<
    'session-ending',
    {},
    TClientEvents['request-end-session']
  >
  /**
   * Occurs when the session ends while the client is joined.
   */
  'session-ended': TResponseEvent<
    'session-ended',
    {},
    TClientEvents['request-end-session']
  >
  /**
   * Occurs when the session is resetting (transitionary state).
   */
  'session-resetting': TResponseEvent<
    'session-resetting',
    {},
    TClientEvents['request-reset-session']
  >
  /**
   * Occurs when the session has been reset.
   */
  'session-reset': TResponseEvent<
    'session-reset',
    {
      /**
       * The node structure available to the client.
       */
      structure: AnyObject
      /**
       * The force(s) the client has access to.
       */
      forces: TMissionForceSaveJson[]
      /**
       * The prototype data used to create the mission's structure of nodes.
       */
      prototypes: TMissionPrototypeJson[]
      /**
       * The file(s) that the client has access to.
       */
      files: TMissionFileJson[]
    },
    TClientEvents['request-reset-session']
  >
  /**
   * Occurs when configuration of the session is updated.
   */
  'session-config-updated': TResponseEvent<
    'session-config-updated',
    {
      /**
       * The updated configuration of the session.
       */
      config: TSessionConfig
    },
    TClientEvents['request-config-update']
  >
  /**
   * Occurs for a member who has been kicked from the session.
   */
  'kicked': TResponseEvent<
    'kicked',
    {
      /**
       * The ID of the session from which the member was kicked.
       */
      sessionId: string
      /**
       * The ID of the member who was kicked.
       */
      memberId: string
      /**
       * The ID of the user who was kicked.
       */
      userId: string
    },
    TClientEvents['request-kick']
  >
  /**
   * Occurs for a member who has been banned from the session.
   */
  'banned': TResponseEvent<
    'banned',
    {
      /**
       * The ID of the session from which the member was banned.
       */
      sessionId: string
      /**
       * The ID of the member who was banned.
       */
      memberId: string
      /**
       * The ID of the user who was kicked.
       */
      userId: string
    },
    TClientEvents['request-ban']
  >
  /**
   * Occurs when a force assignment change has been made.
   */
  'force-assigned': TResponseEvent<
    'force-assigned',
    {
      /**
       * The ID of the member who was assigned to the force.
       */
      memberId: SessionMember['_id']
      /**
       * The ID of the force to which the member was assigned.
       * @note If `null`, the member is now unassigned from any force.
       */
      forceId: string | null
    },
    TClientEvents['request-assign-force']
  >
  /**
   * Occurs when a role assignment change has been made.
   */
  'role-assigned': TResponseEvent<
    'role-assigned',
    {
      /**
       * The ID of the member who was assigned the role.
       */
      memberId: string
      /**
       * The ID of the role assigned to the member.
       */
      roleId: MemberRole['_id']
    },
    TClientEvents['request-assign-role']
  >
  /**
   * Occurs when a node has been opened on the server.
   */
  'node-opened': TResponseEvent<
    'node-opened',
    TNodeOpenStateData,
    TClientEvents['request-open-node']
  >
  /**
   * Occurs when the execution of an action is initiated on the server.
   */
  'action-execution-initiated': TResponseEvent<
    'action-execution-initiated',
    {
      /**
       * The action that was executed.
       */
      execution: TActionExecutionJson
      /**
       * The resource remaining for the force after the
       * action's execution cost was deducted.
       */
      resourcesRemaining: number
    },
    TClientEvents['request-execute-action']
  >
  /**
   * Occurs when the execution of an action has finished on the server.
   */
  'action-execution-completed': TResponseEvent<
    'action-execution-completed',
    {
      /**
       * The outcome of the action being executed.
       */
      outcome: TExecutionOutcomeJson
    } & Partial<TNodeOpenStateData>,
    TClientEvents['request-execute-action']
  >
  /**
   * Occurs when the client has successfully sent a message to the output panel.
   */
  'output-sent': TResponseEvent<
    'output-sent',
    TOutputDatum,
    TClientEvents['request-send-output']
  >
  /**
   * Occurs to send the requested, currently-joined session to the client.
   */
  'current-session': TResponseEvent<
    'current-session',
    {
      /**
       * The session that is currently joined by the client.
       * @note If null, no session is currently joined.
       */
      session: TSessionJson | null
      /**
       * The ID of the member associated with the session client.
       */
      memberId: MetisComponent['_id']
    },
    TClientEvents['request-current-session']
  >
  /**
   * Occurs when the client has successfully joined a session on the server.
   */
  'session-joined': TResponseEvent<
    'session-joined',
    {
      /**
       * The session that was joined.
       */
      session: TSessionJson
      /**
       * The ID of the member in the session.
       */
      memberId: MetisComponent['_id']
    },
    TClientEvents['request-join-session']
  >
  /**
   * Occurs when the client has successfully quit a session on the server.
   */
  'session-quit': TResponseEvent<
    'session-quit',
    {},
    TClientEvents['request-quit-session']
  >
}

/**
 * All WS events emitted by the server, or caused due to a change in the connection with the server.
 */
export type TServerEvents = TGenericServerEvents & TResponseEvents

/**
 * General WS events emitted by the client, or caused due to a change in the connection with the client.
 */
export type TGenericClientEvents = {
  /**
   * Occurs when the connection to the client is closed.
   */
  close: TConnectEvent<'close'>
  /**
   * Occurs when the client emits an error.
   */
  error: {
    /**
     * The event method (Always "error").
     */
    method: 'error'
    /**
     * The error code (See shared/connect/errors.ts).
     */
    code: number
    /**
     * The message explaining the error.
     */
    message: string
    data: {}
  }
}

/**
 * WS events emitted by the client as a request to the server, expecting a response or responses of some kind.
 */
export type TRequestEvents = {
  /**
   * Occurs when the client requests to start the joined
   * session.
   */
  'request-start-session': TRequestEvent<'request-start-session'>
  /**
   * Occurs when the client requests to end the joined
   * session.
   */
  'request-end-session': TRequestEvent<'request-end-session'>
  /**
   * Occurs when the client requests to reset the joined
   * session.
   */
  'request-reset-session': TRequestEvent<'request-reset-session'>
  /**
   * Occurs when the client requests to update the configuration
   * of the joined session.
   */
  'request-config-update': TRequestEvent<
    'request-config-update',
    {
      /**
       * The updated configuration of the session.
       */
      config: Partial<TSessionConfig>
    }
  >
  /**
   * Occurs when the client requests to kick a member from the session.
   */
  'request-kick': TRequestEvent<
    'request-kick',
    {
      /**
       * The ID of the member to kick.
       */
      memberId: string
    }
  >
  /**
   * Occurs when the client requests to ban a member from the session.
   */
  'request-ban': TRequestEvent<
    'request-ban',
    {
      /**
       * The ID of the member to ban.
       */
      memberId: string
    }
  >
  /**
   * Occurs when the client requests to assign a force to a member.
   */
  'request-assign-force': TRequestEvent<
    'request-assign-force',
    {
      /**
       * The ID of the member to assign the force to.
       */
      memberId: string
      /**
       * The ID of the force to assign to the member.
       * @note If `null`, the member will be unassigned from any force.
       */
      forceId: string | null
    }
  >
  /**
   * Occurs when the client requests to assign a different role to a member.
   */
  'request-assign-role': TRequestEvent<
    'request-assign-role',
    {
      /**
       * The ID of the member to assign the role to.
       */
      memberId: SessionMember['_id']
      /**
       * The ID of the role to assign to the member.
       */
      roleId: MemberRole['_id']
    }
  >
  /**
   * Occurs when the client requests to open a node.
   */
  'request-open-node': TRequestEvent<'request-open-node', { nodeId: string }>
  /**
   * Occurs when the client requests to execute an action.
   */
  'request-execute-action': TRequestEvent<
    'request-execute-action',
    {
      /**
       * The ID of the action to execute.
       */
      actionId: string
      /**
       * Cheats to apply when executing the action.
       * @note Any cheats ommitted will be treated
       * as `false`, or disabled.
       * @note Only relevant to members authorized to perform
       * cheats.
       */
      cheats?: Partial<TExecutionCheats>
    }
  >
  /**
   * Occurs when the client requests to send a pre-execution message to the output panel.
   */
  'request-send-output': TRequestEvent<'request-send-output', TOutputDatum>
  /**
   * Occurs when the client requests to fetch the currently joined session.
   */
  'request-current-session': TRequestEvent<'request-current-session'>
  /**
   * Occurs when the client requests to join a session.
   */
  'request-join-session': TRequestEvent<
    'request-join-session',
    {
      /**
       * The ID of the session to join.
       */
      sessionId: string
    }
  >
  /**
   * Occurs when the client requests to quit a session.
   */
  'request-quit-session': TRequestEvent<'request-quit-session'>
}

/**
 * WS events emitted by the client, or caused due to a change in the connection with the client.
 */
export type TClientEvents = TGenericClientEvents & TRequestEvents
