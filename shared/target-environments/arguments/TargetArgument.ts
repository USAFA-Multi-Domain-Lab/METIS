import type { Effect, TEffectType } from '@shared/missions/effects/Effect'
import type { TSatisfies } from '@shared/toolbox/objects/ObjectToolbox'
import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMission } from '../../missions/Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../../missions/MissionComponent'
import type { TDropdownTargetParameterOptionVal } from '../parameters/DropdownTargetParameter'
import type { TMissionComponentMetadata } from '../parameters/mission-component/MissionComponentTargetParameter'
import type {
  TTargetParameter,
  TTargetParameterType,
} from '../parameters/TargetParameter'
import type {
  TActionMetadata,
  TFileMetadata,
  TForceMetadata,
  TNodeMetadata,
  TPoolMetadata,
  TResourceMetadata,
} from '../types'

/**
 * Represents a single argument supplied to an effect — a binding between
 * a target parameter and its assigned value.
 * Each target argument in an effect's `arguments` array corresponds to one
 * parameter defined on the effect's target.
 */
export abstract class TargetArgument<
  T extends TMetisBaseComponents = TMetisBaseComponents,
  TParameterType extends TTargetParameterType = TTargetParameterType,
>
  extends MissionComponent<T, TargetArgument<T, TParameterType>>
  implements TJsonSerializable<TTargetArgumentJson>
{
  /**
   * The effect that uses this argument when calling
   * the target script.
   */
  public readonly effect:
    | T['executionTriggeredEffect']
    | T['sessionTriggeredEffect']

  /**
   * The unique identifier for the effect that uses
   * this argument when calling the target script.
   */
  public get effectId(): string {
    return this.effect._id
  }

  /**
   * The type of the parameter this argument satisfies. This is a
   * discriminant field that determines the type of `parameter` and `value`.
   * @note If this conflicts with the parameter's actual type, an issue
   * will be generated on the argument.
   */
  public readonly type: TParameterType

  /**
   * The `_id` of the {@link parameter}.
   */
  public readonly parameterId: string

  /**
   * The {@link TTargetParameter} this argument satisfies.
   * @note If `null`, the parameter could not be found for
   * the {@link parameterId} on the target.
   */
  public readonly parameter: TTargetParameter | undefined

  // Implemented
  public get mission(): TMission<T> {
    return this.effect.mission as TMission<T>
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.effect.path, this]
  }

  /**
   * Cache for {@link additionalIssues} to avoid recomputing on every access.
   */
  protected _additionalIssues: TMissionComponentIssue[]

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
  }

  /**
   * The value supplied for the parameter.
   * The type of this field is determined by `P` — when `P` is a
   * concrete parameter type (e.g. `TNumberTargetParameter`) this
   * resolves to its corresponding value type (e.g. `number`).
   */
  public value: TSelectArgumentValue[TParameterType]

  // Implemented
  public get json(): TTargetArgumentJson {
    return this.serialize()
  }

  /**
   * @param effect The effect that uses this argument when calling
   * the target script.
   * @param _id The unique identifier for this argument entry.
   * @param parameterId The `_id` of the parameter this argument satisfies.
   * @param type The type of the parameter this argument satisfies.
   * @param value The value supplied for the parameter.
   */
  protected constructor(
    effect: T[TEffectType] | Effect<T, any>,
    _id: string,
    parameterId: string,
    type: TParameterType,
    value: TSelectArgumentValue[TParameterType],
  ) {
    super(_id, '', false)
    this.parameterId = parameterId
    this.type = type
    this.value = value

    this.effect = effect.normalize()
    this.parameter = this.effect.target?.getParameterById(parameterId)

    this._additionalIssues = []

    this.scanForIssues()
  }

  // Implemented
  public serialize(): TTargetArgumentJson {
    return serializeJson(this, ['_id', 'parameterId', 'value'], () => {
      let type: TTargetParameterType = this.type
      if (type === 'unknown' && this.parameter) {
        type = this.parameter.type
      }
      return { type }
    })
  }

  /**
   * Scans the argument for issues and adds them to
   * {@link additionalIssues}.
   */
  private scanForIssues() {
    this._additionalIssues = []

    // Do not push issues if the target is missing.
    // This should be handled at the effect level.
    if (!this.effect.target) return

    // Push an issue if the parameter cannot be found on the target.
    if (!this.parameter) {
      this._additionalIssues.push({
        component: this,
        type: 'general',
        message: `Effect "${this.effect.name}" with parameter ID "${this.parameterId}" not found on target "${this.effect.target.name}".`,
      })
    }
    // Push an issue if the parameter type does not match the expected type.
    // 'unknown' is a migration placeholder — skip the check until it is promoted.
    else if (this.type !== 'unknown' && this.parameter.type !== this.type) {
      this._additionalIssues.push({
        component: this,
        type: 'general',
        message: `Effect "${this.effect.name}" has a type mismatch for parameter "${this.parameter.name}": expected "${this.parameter.type}", got "${this.type}".`,
      })
    }
  }

  /**
   * The default properties for a {@link TargetArgument} object.
   */
  public static get DEFAULT_PROPERTIES(): Omit<
    TTargetArgumentJson,
    'parameterId' | 'value'
  > {
    return {
      _id: StringToolbox.generateRandomId(),
      type: 'string',
    }
  }
}

/* -- TYPES -- */

/**
 * Allows the selection of an argument value's type
 * based on a given parameter type.
 */
export type TSelectArgumentValue = TSatisfies<
  {
    'number': number
    'string': string
    'large-string': string
    'boolean': boolean
    'dropdown': TDropdownTargetParameterOptionVal
    'force': TForceMetadata
    'node': TNodeMetadata
    'action': TActionMetadata
    'file': TFileMetadata
    'resource': TResourceMetadata
    'pool': TPoolMetadata
    'mission-component': string | string[]
    'unknown': TTargetArgumentValue
  },
  Record<TTargetParameterType, unknown>
>

/**
 * The union of all possible values a {@link TargetArgument} can hold.
 * Equivalent to the union of every branch in {@link TArgumentValueForParameter}.
 */
export type TTargetArgumentValue =
  | number
  | string
  | boolean
  | string[]
  | TMissionComponentMetadata
  | TDropdownTargetParameterOptionVal

/**
 * A discriminated union of all typed {@link TargetArgument} variants.
 * Switch on `argument.parameter.type` to narrow both `parameter` and
 * `value` to their concrete types for that parameter kind.
 *
 * @example
 * ```typescript
 * switch (argument.parameter.type) {
 *   case 'number':  // argument.value: number
 *   case 'string':  // argument.value: string
 *   case 'force':   // argument.value: TMissionComponentMetadata
 * }
 * ```
 */
export type TTargetArgument<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> = {
  [K in TTargetParameterType]: Omit<
    TargetArgument<T, K>,
    'value' | 'parameter' | 'type'
  > &
    TargetArgument<T, K>
}[TTargetParameterType]

/**
 * The JSON representation of {@link TargetArgument}.
 */
export type TTargetArgumentJson = {
  /**
   * @see {@link TargetArgument._id}
   */
  _id: string
  /**
   * @see {@link TargetArgument.parameterId}
   */
  parameterId: string
  /**
   * @see {@link TargetArgument.type}
   */
  type: TTargetParameterType
  /**
   * @see {@link TargetArgument.value}
   */
  value: TTargetArgumentValue
}
