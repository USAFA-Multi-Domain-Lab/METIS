import type { FileReference } from './files/FileReference'
import type { MetisComponent } from './MetisComponent'
import type { ActionExecution } from './missions/actions/ActionExecution'
import type { ExecutionOutcome } from './missions/actions/ExecutionOutcome'
import type { MissionAction } from './missions/actions/MissionAction'
import type { Effect, TEffectType } from './missions/effects/Effect'
import type { MissionFile } from './missions/files/MissionFile'
import type { MissionForce } from './missions/forces/MissionForce'
import type { MissionOutput } from './missions/forces/MissionOutput'
import type { Mission } from './missions/Mission'
import type { MissionNode } from './missions/nodes/MissionNode'
import type { MissionPrototype } from './missions/nodes/MissionPrototype'
import type { SessionMember } from './sessions/members/SessionMember'
import type { MissionSession } from './sessions/Session'
import type { TargetEnvironment } from './target-environments/TargetEnvironment'
import type { Target } from './target-environments/targets/Target'
import type { User } from './users/User'

declare global {
  /**
   * Base, shared registry of METIS components types.
   * @note Used as a generic argument for all base,
   * METIS component classes.
   */
  export type TMetisBaseComponents = {
    session: MissionSession
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
