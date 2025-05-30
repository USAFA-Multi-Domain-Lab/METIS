import FileReference from './files/references'
import Mission from './missions'
import MissionAction from './missions/actions'
import ActionExecution from './missions/actions/executions'
import ExecutionOutcome from './missions/actions/outcomes'
import Effect from './missions/effects'
import MissionFile from './missions/files'
import { MissionForce } from './missions/forces'
import MissionOutput from './missions/forces/output'
import MissionNode from './missions/nodes'
import MissionPrototype from './missions/nodes/prototypes'
import Session from './sessions'
import SessionMember from './sessions/members'
import TargetEnvironment from './target-environments'
import Target from './target-environments/targets'
import User from './users'

/**
 * A fundamental concept used in the application.
 * (e.g. a user, a mission, a session, etc.)
 */
export abstract class MetisComponent {
  /**
   * A human-readable title for the component.
   */
  private _name: string
  /**
   * A human-readable title for the component.
   */
  public get name(): string {
    return this._name
  }
  public set name(name: string) {
    this._name = name
  }

  public constructor(
    /**
     * Uniquely identifies the component.
     */
    public _id: string,
    /**
     * A human-readable title for the component.
     */
    name: string,
    /**
     * Whether the component is considered deleted in the
     * system.
     */
    public deleted: boolean,
  ) {
    this._name = name
  }
}

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
  effect: Effect
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
