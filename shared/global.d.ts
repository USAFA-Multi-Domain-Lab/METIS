import type { MetisComponent } from '.'
import type { FileReference } from './files'
import type {
  ActionExecution,
  Effect,
  ExecutionOutcome,
  Mission,
  MissionAction,
  MissionFile,
  MissionForce,
  MissionNode,
  MissionOutput,
  MissionPrototype,
  TEffectType,
} from './missions'
import type { Session, SessionMember } from './sessions'
import type { Target, TargetEnvironment } from './target-environments'
import type { User } from './users'

declare global {
  /**
   * Base, shared registry of METIS components types.
   * @note Used as a generic argument for all base,
   * METIS component classes.
   */
  export type TMetisBaseComponents = {
    session: Session
    member: SessionMember
    user: User
    targetEnv: TargetEnvironment
    target: Target
    fileReference: FileReference
    mission: Mission
    prototype: MissionPrototype
    missionFile: MissionFile
    force: MissionForce
    output: MissionOutput
    node: MissionNode
    action: MissionAction
    execution: ActionExecution
    outcome: ExecutionOutcome
  } & {
    [TType in TEffectType]: Effect<TMetisBaseComponents, TType>
  }

  /**
   * Creates a JSON representation type from a METIS component type.
   * @param T The METIS component type (TCommonMission, TCommonMissionNode, etc.).
   * @param TDirect The keys of T to translate directly to the JSON as the exact same type (string -> string, number -> number).
   * @param TIndirect The keys of T to translate to the JSON as a different type (string -> string[], number -> string).
   * @returns The JSON representation type.
   */
  export type TCreateJsonType<
    T extends MetisComponent,
    TDirect extends keyof T,
    TIndirect extends { [k in keyof T]?: any } = {},
  > = {
    -readonly [k in TDirect]: T[k]
  } & {
    [k in keyof TIndirect]: TIndirect[k]
  }

  /**
   * JSON representation of {@link MetisComponent}.
   */
  export interface TMetisComponentJson {
    /**
     * @see {@link MetisComponent._id}
     */
    _id: string
    /**
     * @see {@link MetisComponent.name}
     */
    name: string
    /**
     * @see {@link MetisComponent.deleted}
     */
    deleted: boolean
  }

  /**
   * Info for the METIS project.
   */
  export type TMetisInfo = {
    /**
     * The name of the project.
     */
    name: string
    /**
     * The description for the project.
     */
    description: string
    /**
     * The version of the project.
     */
    version: string
  }
}
