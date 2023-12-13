import { IActionOutcomeJSON } from 'metis/missions/actions/outcomes'
import { TMissionNodeJson } from '../missions/nodes'
import { TActionExecutionJSON } from 'metis/missions/actions/executions'

/**
 * Represents the types of data sent from the server to the client over a web socket.
 */
export interface IServerDataTypes {
  'open': {
    method: 'open'
  }
  'close': {
    method: 'close'
  }
  'connection-loss': {
    method: 'connection-loss'
  }
  'error': {
    method: 'error'
    code: number
    message: string
    request?: {
      method: TClientMethod
      requestID: string
    }
  }
  'node-opened': {
    method: 'node-opened'
    nodeID: string
    revealedChildNodes: Array<TMissionNodeJson>
    request: IClientDataTypes['request-open-node']
    requesterID: string
  }
  'action-execution-initiated': {
    method: 'action-execution-initiated'
    execution: NonNullable<TActionExecutionJSON>
    request: IClientDataTypes['request-execute-action']
  }
  'action-execution-completed': {
    method: 'action-execution-completed'
    outcome: IActionOutcomeJSON
    revealedChildNodes?: Array<TMissionNodeJson>
    request: IClientDataTypes['request-execute-action']
    requesterID: string
  }
}

/**
 * Represents a type of event that occurs on the server that is sent to the client over a web socket.
 */
export type TServerMethod = keyof IServerDataTypes

export type TServerData<TMethod extends TServerMethod> =
  IServerDataTypes[TMethod]

/**
 * Represents the types of data sent from the client to the server over a web socket during various events.
 */
export interface IClientDataTypes {
  'close': {
    method: 'close'
  }
  'error': {
    method: 'error'
    code: number
    message: string
  }
  'request-open-node': {
    method: 'request-open-node'
    requestID: string
    nodeID: string
  }
  'request-execute-action': {
    method: 'request-execute-action'
    requestID: string
    actionID: string
  }
}

/**
 * Represents the type of event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientMethod = keyof IClientDataTypes

export type TClientData<TMethod extends TClientMethod> =
  IClientDataTypes[TMethod]
