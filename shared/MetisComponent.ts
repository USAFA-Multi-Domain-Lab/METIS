import type { FileReference } from './files/FileReference'
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
import type { MissionSession } from './sessions/MissionSession'
import type { TargetEnvironment } from './target-environments/TargetEnvironment'
import type { Target } from './target-environments/targets/Target'
import type { User } from './users/User'

/**
 * A fundamental concept used in the application.
 * (e.g. a user, a mission, a session, etc.)
 */
export abstract class MetisComponent {
  /**
   * A human-readable title for the component.
   */
  protected _name: string
  /**
   * A human-readable title for the component.
   * @note This can be overridden in any subclass
   * to customize this property.
   */
  public get name(): string {
    return this._name
  }
  public set name(name: string) {
    this._name = name
  }

  /**
   * @see {@link MetisComponent.disabled}
   */
  private _disabled: boolean
  /**
   * Whether the component is considered enabled for use.
   * This will make the component interactive in various
   * UI contexts.
   */
  public get enabled(): boolean {
    return !this._disabled
  }
  /**
   * Whether the component is considered disabled from use.
   * This will make the component non-interactive in various
   * UI contexts.
   */
  public get disabled(): boolean {
    return this._disabled
  }

  /**
   * Array of callbacks that get triggered when disabled state changes.
   */
  private _disabledChangeCallbacks: Array<(isDisabled: boolean) => void> = []

  /**
   * Registers a callback for disabled state changes.
   * @param callback Function to call when disabled state changes.
   * @returns Function to unregister the callback.
   */
  public onDisabledChange(callback: (isDisabled: boolean) => void): () => void {
    this._disabledChangeCallbacks.push(callback)

    // Return a function that removes this specific callback
    return () => {
      this._disabledChangeCallbacks = this._disabledChangeCallbacks.filter(
        (cb) => cb !== callback,
      )
    }
  }

  /**
   * @see {@link MetisComponent.disabled}
   */
  private _disabledReason: string
  /**
   * Text that can be displayed to the user to explain
   * why the component is disabled.
   */
  public get disabledReason(): string {
    return this._disabledReason
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
    this._disabled = false
    this._disabledReason = ''
  }

  /**
   * Enables the previously disabled component.
   */
  public enable(): void {
    const wasDisabled = this._disabled
    this._disabled = false
    this._disabledReason = ''

    // Notify all registered callbacks.
    if (wasDisabled && this._disabledChangeCallbacks.length > 0) {
      this._disabledChangeCallbacks.forEach((callback) => callback(false))
    }
  }

  /**
   * Disables the previously enabled component.
   * @param reason A reason for why the component is
   * being disabled. This can be left blank if no
   * explanation is needed.
   */
  public disable(reason: string = ''): void {
    const wasEnabled = !this._disabled
    this._disabled = true
    this._disabledReason = reason

    // Notify all registered callbacks.
    if (wasEnabled && this._disabledChangeCallbacks.length > 0) {
      this._disabledChangeCallbacks.forEach((callback) => callback(true))
    }
  }

  /**
   * Sets the disabled state of the component.
   * @param disabled Whether the component should be disabled.
   * @param reason The reason why the component is being disabled.
   * This can be left blank if no explanation is needed. Note that
   * this will only be used if the component is being disabled,
   * not enabled.
   */
  public setDisabled(disabled: boolean, reason: string = ''): void {
    if (disabled) {
      this.disable(reason)
    } else {
      this.enable()
    }
  }
}

/* -- TYPES -- */

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
