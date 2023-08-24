import { IGameJSON } from '../games'

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
  'response-join': {
    method: 'response-launch'
    requestID: string
    game: IGameJSON
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
  'request-launch': {
    method: 'request-launch'
    requestID: string
    missionID: string
  }
}

/**
 * Represents the type of event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientMethod = keyof IClientDataTypes

export type TClientData<TMethod extends TClientMethod> =
  IClientDataTypes[TMethod]
