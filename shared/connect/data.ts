import {
  TGameConfig,
  TGameJoinMethod,
  TGameJson,
  TGameState,
} from 'metis/games'
import { TActionExecutionJSON } from 'metis/missions/actions/executions'
import { TActionOutcomeJson } from 'metis/missions/actions/outcomes'
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
   * Occurs when the state of the game changes (unstarted, started, ended).
   */
  'game-state-change': TConnectEvent<
    'game-state-change',
    {
      /**
       * The current state of the game.
       */
      state: TGameState
      /**
       * The current configuration of the game.
       */
      config: TGameConfig
      /**
       * The current list of participants in the game.
       */
      participants: TCommonUserJson[]
      /**
       * The current list of supervisors in the game.
       */
      supervisors: TCommonUserJson[]
    }
  >
  /**
   * Occurs for a participant who has been kicked from the game.
   */
  'kicked': TConnectEvent<
    'kicked',
    {
      /**
       * The ID of the game from which the participant was kicked.
       */
      gameId: string
    }
  >
  /**
   * Occurs for a participant who has been banned from the game.
   */
  'banned': TConnectEvent<
    'banned',
    {
      /**
       * The ID of the game from which the participant was banned.
       */
      gameId: string
    }
  >
  /**
   * Occurs when the game has been destroyed while the participant was in it.
   */
  'game-destroyed': TConnectEvent<
    'game-destroyed',
    {
      /**
       * The ID of the game that was destroyed.
       */
      gameId: string
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
      revealedChildNodes: Array<TCommonMissionNodeJson>
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
      execution: NonNullable<TActionExecutionJSON>
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
      revealedChildNodes?: Array<TCommonMissionNodeJson>
    },
    TClientEvents['request-execute-action']
  >
  /**
   * Occurs to send the requested, currently-joined game to the client.
   */
  'current-game': TResponseEvent<
    'current-game',
    {
      /**
       * The game that is currently joined by the client.
       * @note If null, no game is currently joined.
       */
      game: TGameJson | null
      /**
       * The join method that was used by the client to join the game.
       */
      joinMethod: TGameJoinMethod
    },
    TClientEvents['request-current-game']
  >
  /**
   * Occurs when the client has successfully joined a game on the server.
   */
  'game-joined': TResponseEvent<
    'game-joined',
    {
      /**
       * The game that was joined.
       */
      game: TGameJson
      /**
       * The join method that was used by the client to join the game.
       */
      joinMethod: TGameJoinMethod
    },
    TClientEvents['request-join-game']
  >
  /**
   * Occurs when the client has successfully quit a game on the server.
   */
  'game-quit': TResponseEvent<
    'game-quit',
    {},
    TClientEvents['request-quit-game']
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
   * Occurs when the client requests to fetch the currently joined game.
   */
  'request-current-game': TRequestEvent<'request-current-game'>
  /**
   * Occurs when the client requests to join a game.
   */
  'request-join-game': TRequestEvent<
    'request-join-game',
    {
      /**
       * The ID of the game to join.
       */
      gameId: string
      /**
       * The method of joining the game.
       */
      joinMethod: TGameJoinMethod
    }
  >
  /**
   * Occurs when the client requests to quit a game.
   */
  'request-quit-game': TRequestEvent<'request-quit-game'>
}

/**
 * WS events emitted by the client, or caused due to a change in the connection with the client.
 */
export type TClientEvents = TGenericClientEvents & TRequestEvents
