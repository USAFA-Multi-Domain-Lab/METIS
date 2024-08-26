import { TActionExecutionJson } from 'metis/missions/actions/executions'
import { TActionOutcomeJson } from 'metis/missions/actions/outcomes'
import { TCommonMissionForceJson } from 'metis/missions/forces'
import { TSessionConfig, TSessionJson, TSessionRole } from 'metis/sessions'
import { AnyObject } from 'metis/toolbox/objects'
import { TCommonUserJson } from 'metis/users'
import { TCommonMissionNodeJson } from '../missions/nodes'

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
 * The data necessary to enact an internal effect based on their key.
 */
type TInternalEffectData = [
  {
    /**
     * Used to identify the data structure.
     * @option `"node-block":` The data needed to block or unblock a node.
     * @option `"node-action-success-chance":` The data needed to modify the success chance of all the node's actions.
     * @option `"node-action-process-time":` The data needed to modify the process time of all the node's actions.
     * @option `"node-action-resource-cost":` The data needed to modify the resource cost of all the node's actions.
     * @option `"output":` The data needed to send a message to the output panel.
     */
    key: 'node-update-block'
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
     * Used to identify the data structure.
     * @option `"node-block":` The data needed to block or unblock a node.
     * @option `"node-action-success-chance":` The data needed to modify the success chance of all the node's actions.
     * @option `"node-action-process-time":` The data needed to modify the process time of all the node's actions.
     * @option `"node-action-resource-cost":` The data needed to modify the resource cost of all the node's actions.
     * @option `"output":` The data needed to send a message to the output panel.
     */
    key: 'node-action-success-chance'
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * The operand used to modify the chance of succes for all the node's actions.
     */
    successChanceOperand: number
  },
  {
    /**
     * Used to identify the data structure.
     * @option `"node-block":` The data needed to block or unblock a node.
     * @option `"node-action-success-chance":` The data needed to modify the success chance of all the node's actions.
     * @option `"node-action-process-time":` The data needed to modify the process time of all the node's actions.
     * @option `"node-action-resource-cost":` The data needed to modify the resource cost of all the node's actions.
     * @option `"output":` The data needed to send a message to the output panel.
     */
    key: 'node-action-process-time'
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * The operand used to modify the process time for all the node's actions.
     */
    processTimeOperand: number
  },
  {
    /**
     * Used to identify the data structure.
     * @option `"node-block":` The data needed to block or unblock a node.
     * @option `"node-action-success-chance":` The data needed to modify the success chance of all the node's actions.
     * @option `"node-action-process-time":` The data needed to modify the process time of all the node's actions.
     * @option `"node-action-resource-cost":` The data needed to modify the resource cost of all the node's actions.
     * @option `"output":` The data needed to send a message to the output panel.
     */
    key: 'node-action-resource-cost'
    /**
     * The ID of the node to modify.
     */
    nodeId: string
    /**
     * The operand used to modify the resource cost for all the node's actions.
     */
    resourceCostOperand: number
  },
  {
    /**
     * Used to identify the data structure.
     * @option `"node-block":` The data needed to block or unblock a node.
     * @option `"node-action-success-chance":` The data needed to modify the success chance of all the node's actions.
     * @option `"node-action-process-time":` The data needed to modify the process time of all the node's actions.
     * @option `"node-action-resource-cost":` The data needed to modify the resource cost of all the node's actions.
     * @option `"output":` The data needed to send a message to the output panel.
     */
    key: 'output'
    /**
     * The ID of the force where the output panel belongs.
     */
    forceId: string
    /**
     * The message to send to the force's output panel.
     */
    message: string
  },
]

/**
 * The data needed to apply an internal effect.
 */
type TInternalEffectDatum = TInternalEffectData[number]

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
   * Occurs when the session starts while the client is joined.
   */
  'session-started': TConnectEvent<
    'session-started',
    {
      /**
       * The node structure available to the client.
       */
      nodeStructure: AnyObject
      /**
       * The force(s) the client has access to.
       */
      forces: TCommonMissionForceJson[]
    }
  >
  /**
   * Occurs when the session ends while the client is joined.
   */
  'session-ended': TConnectEvent<'session-ended'>
  /**
   * Occurs when configuration of the session is updated.
   */
  'session-config-updated': TConnectEvent<
    'session-config-updated',
    {
      /**
       * The updated configuration of the session.
       */
      config: TSessionConfig
    }
  >
  /**
   * Occurs when a user joins or quits the session.
   */
  'session-users-updated': TConnectEvent<
    'session-users-updated',
    {
      /**
       * The updated list of participants in the session.
       */
      participants: TCommonUserJson[]
      /**
       * The updated list of supervisors in the session.
       */
      supervisors: TCommonUserJson[]
    }
  >
  /**
   * Occurs when an internal effect is enacted.
   */
  'internal-effect-enacted': TConnectEvent<
    'internal-effect-enacted',
    TInternalEffectDatum
  >

  /**
   * Occurs for a participant who has been kicked from the session.
   */
  'kicked': TConnectEvent<
    'kicked',
    {
      /**
       * The ID of the session from which the participant was kicked.
       */
      sessionId: string
    }
  >
  /**
   * Occurs for a participant who has been banned from the session.
   */
  'banned': TConnectEvent<
    'banned',
    {
      /**
       * The ID of the session from which the participant was banned.
       */
      sessionId: string
    }
  >
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
   * Occurs when a node has been opened on the server.
   */
  'node-opened': TResponseEvent<
    'node-opened',
    {
      /**
       * The node that was opened.
       */
      nodeId: string
      /**
       * The nodes that were revealed as a result of opening the node.
       */
      revealedChildNodes: TCommonMissionNodeJson[]
    },
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
      execution: NonNullable<TActionExecutionJson>
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
      outcome: TActionOutcomeJson
      /**
       * The nodes that were revealed as a result of executing the action.
       */
      revealedChildNodes?: TCommonMissionNodeJson[]
    },
    TClientEvents['request-execute-action']
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
       * The role of the client in the session.
       */
      role: TSessionRole
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
       * The role of the client in the session.
       */
      role: TSessionRole
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
    }
  >
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
      /**
       * The role the client wants to join as.
       */
      role: TSessionRole
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
