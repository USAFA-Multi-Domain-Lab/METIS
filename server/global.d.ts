import type { Session as ExpressSession } from 'express-session'
import type { TEffectType } from 'metis/missions'
import type { ServerFileReference } from './files'
import type {
  ServerActionExecution,
  ServerEffect,
  ServerExecutionOutcome,
  ServerMission,
  ServerMissionAction,
  ServerMissionFile,
  ServerMissionForce,
  ServerMissionNode,
  ServerMissionPrototype,
  ServerOutput,
} from './missions'
import type { ServerSessionMember, SessionServer } from './sessions'
import type {
  ServerTarget,
  ServerTargetEnvironment,
} from './target-environments'
import type { ServerUser } from './users'

declare module 'http' {
  export interface SessionData {
    userId: string
  }
  export interface IncomingMessage {
    session: ExpressSession & Partial<SessionData>
  }
}

declare global {
  /**
   * Server registry of METIS components types.
   * @note This is used for all server-side METIS
   * component classes.
   */
  export type TMetisServerComponents = {
    session: SessionServer
    member: ServerSessionMember
    user: ServerUser
    targetEnv: ServerTargetEnvironment
    target: ServerTarget
    fileReference: ServerFileReference
    mission: ServerMission
    prototype: ServerMissionPrototype
    missionFile: ServerMissionFile
    force: ServerMissionForce
    output: ServerOutput
    node: ServerMissionNode
    action: ServerMissionAction
    execution: ServerActionExecution
    outcome: ServerExecutionOutcome
  } & {
    [TType in TEffectType]: ServerEffect<TType>
  }

  /**
   * Options for creating the METIS server.
   */
  export interface TMetisServerOptions {
    /**
     * The type of environment in which METIS is running.
     */
    envType: string
    /**
     * The port on which to run the server.
     * @default 8080
     */
    port: number
    /**
     * The name of the MongoDB database to use.
     * @default "metis"
     */
    mongoDB: string
    /**
     * The host of the MongoDB database to use.
     * @default "localhost"
     */
    mongoHost: string
    /**
     * The port of the MongoDB database to use.
     * @default 27017
     */
    mongoPort: number
    /**
     * The username of the MongoDB database to use. Defaults to undefined.
     * @default undefined
     */
    mongoUsername?: string
    /**
     * The password of the MongoDB database to use.
     * @default undefined
     */
    mongoPassword?: string
    /**
     * The maximum number of http requests allowed per second.
     * @default undefined
     */
    httpRateLimit: number
    /**
     * The duration of the rate limit for the http server.
     * @default 1 (second)
     */
    httpRateLimitDuration: number
    /**
     * The maximum number of websocket messages allowed per second.
     */
    wsRateLimit: number
    /**
     * The duration of the rate limit for the web socket server.
     * @default 1 (second)
     */
    wsRateLimitDuration: number
    /**
     * The location of the file store.
     * @default "./files/store"
     */
    fileStoreDir: string

    /**
     * The path to the SSL key file (if any).
     */
    sslKeyPath?: string

    /**
     * The path to the SSL cert file (if any).
     */
    sslCertPath?: string
  }
}
