import { MissionAction } from '@shared/missions/actions/MissionAction'
import type { Effect, TEffectType } from '@shared/missions/effects/Effect'
import { MissionFile } from '@shared/missions/files/MissionFile'
import { MissionForce } from '@shared/missions/forces/MissionForce'
import { ResourcePool } from '@shared/missions/forces/ResourcePool'
import type { MissionComponentIssueRegistry } from '@shared/missions/MissionComponentIssueRegistry'
import { MissionResource } from '@shared/missions/MissionResource'
import { MissionNode } from '@shared/missions/nodes/MissionNode'
import type { TMissionComponentSerializedSelection } from '@shared/target-environments/parameters/mission-component/MissionComponentTargetParameter2'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { BooleanToolbox } from '@shared/toolbox/booleans/BooleanToolbox'
import {
  ObjectToolbox,
  type TSatisfies,
} from '@shared/toolbox/objects/ObjectToolbox'
import { type TJsonSerializable } from '@shared/toolbox/serialization/json'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import zod from 'zod'
import { Mission, type TMission } from '../../missions/Mission'
import { MissionComponent } from '../../missions/MissionComponent'
import type {
  TDropdownTargetParameter,
  TDropdownTargetParameterOptionVal,
} from '../parameters/DropdownTargetParameter'
import type { TLargeStringTargetParameter } from '../parameters/LargeStringTargetParameter'
import type { TNumberTargetParameter } from '../parameters/NumberTargetParameter'
import type { TStringTargetParameter } from '../parameters/StringTargetParameter'
import type {
  TTargetParameter,
  TTargetParameterType,
} from '../parameters/TargetParameter'

/**
 * Represents a single argument supplied to an effect — a binding between
 * a target parameter and its assigned value.
 * Each target argument in an effect's `arguments` array corresponds to one
 * parameter defined on the effect's target.
 */
export abstract class TargetArgument<
  T extends TMetisBaseComponents = TMetisBaseComponents,
>
  extends MissionComponent<T, TargetArgument<T>>
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
   * The context of this argument, which includes the type of the parameter
   * it satisfies and the value assigned to that parameter. The type of
   * `value` is determined by the `type` field.
   */
  public readonly context: TTargetArgumentContext<T>

  /**
   * The type of the parameter this argument satisfies. This is a
   * discriminant field that determines the type of `parameter` and `value`.
   * @note If this conflicts with the parameter's actual type, an issue
   * will be generated on the argument.
   */
  public get type(): TTargetParameterType {
    return this.context.type
  }

  /**
   * The `_id` of the {@link parameter}.
   */
  public readonly parameterId: string

  /**
   * The {@link TTargetParameter} this argument satisfies.
   * @note If `null`, the parameter could not be found for
   * the {@link parameterId} on the target.
   */
  public get parameter(): TTargetParameter | undefined {
    return this.effect.target?.getParameterById(this.parameterId)
  }

  // Implemented
  public get mission(): TMission<T> {
    return this.effect.mission as TMission<T>
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.effect.path, this]
  }

  // Implemented
  public get superComponent():
    | T['executionTriggeredEffect']
    | T['sessionTriggeredEffect'] {
    return this.effect
  }

  // Implemented
  public get subComponents(): [] {
    return []
  }

  // Implemented
  public get sourceList(): T['targetArgument'][] {
    return this.effect.arguments
  }

  /**
   * The value supplied for the parameter.
   * The type of this field is determined by `P` — when `P` is a
   * concrete parameter type (e.g. `TNumberTargetParameter`) this
   * resolves to its corresponding value type (e.g. `number`).
   */
  public get value(): TTargetArgumentValue<T> {
    return this.context.value
  }
  public set value(newValue: TTargetArgumentValue<T>) {
    this.context.value = newValue
  }

  // Implemented
  public get json(): TTargetArgumentJson {
    return this.serialize()
  }

  /**
   * Whether the corresponding parameter could
   * not be found for the given target.
   */
  public get parameterIsMissing(): boolean {
    return !this.parameter
  }

  /**
   * Whether the type of this argument's value conflicts with the type of the
   * corresponding parameter on the target. If `parameter` is `undefined, `false`
   * is returned.
   */
  public get hasTypeMismatch(): boolean {
    return this.parameter?.type !== this.type
  }

  /**
   * Whether this argument has a dropdown parameter whose options do not include
   * the assigned value. If `parameter` is `undefined` or not a dropdown type, `false`
   * is returned.
   */
  public get valueIsInvalidOption(): boolean {
    return (
      this.parameter?.type === 'dropdown' &&
      this.parameter.options.every((option) => option.value !== this.value)
    )
  }

  /**
   * Whether this argument has a string parameter with a pattern that does not match
   * the assigned value.
   * @note If `parameter` is `undefined` or not a string type, `false` is returned.
   */
  public get hasPatternMismatch(): boolean {
    return (
      this.parameter?.type === 'string' &&
      !!this.parameter.pattern &&
      !this.parameter.pattern.test(`${this.value}`)
    )
  }

  // Overridden
  public override get usesSubentry(): boolean {
    return true
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
    context: TTargetArgumentContext<T>,
  ) {
    super(_id, '', false)
    this.parameterId = parameterId
    this.context = context
    this.effect = effect.normalize()
  }

  // Implemented
  public serialize(): TTargetArgumentJson {
    if (this.context.type === 'mission-component') {
      return {
        _id: this._id,
        parameterId: this.parameterId,
        type: this.context.type,
        value: TargetArgument.serializeMissionComponents(this.context.value),
      }
    } else {
      return {
        _id: this._id,
        parameterId: this.parameterId,
        ...this.context,
      }
    }
  }

  /**
   * If the argument is required and its value is unset for its type, this replaces
   * the value with the parameter's default. Called during `fromJson` before
   * context construction so that the in-memory representation (and any
   * subsequent save) reflects the intended default.
   *
   * Applicable types and their "unset" sentinels:
   * - `number`       → `null`
   * - `string`       → `""`
   * - `large-string` → `""`
   * - `dropdown`     → `null` (applies `parameter.default.value`, the primitive)
   *
   * `boolean` and `mission-component` are excluded: boolean has no `required`
   * field and its natural unset state is `false`; mission-component has no
   * `default` field.
   *
   * If `parameter` is `undefined`, or `json.type` does not match
   * `parameter.type` (a type-mismatch that `scanForIssues` will surface), the
   * JSON is returned unchanged.
   *
   * @param json The raw argument JSON as loaded from the database, which is mutated
   * by this method.
   * @param parameter The resolved target parameter for this argument, if found.
   */
  protected static applyDefault(
    json: TTargetArgumentJson,
    parameter: TTargetParameter | undefined,
  ): void {
    if (!parameter || json.type !== parameter.type) return

    switch (json.type) {
      case 'number': {
        parameter = parameter as TNumberTargetParameter // Cast is safe due to type check at the top of the method.
        if (parameter.required && json.value === null) {
          json.value = parameter.default
        }
        break
      }
      case 'string': {
        parameter = parameter as TStringTargetParameter // Cast is safe due to type check at the top of the method.
        if (parameter.required && json.value === '') {
          json.value = parameter.default
        }
        break
      }
      case 'large-string': {
        parameter = parameter as TLargeStringTargetParameter // Cast is safe due to type check at the top of the method.
        if (parameter.required && json.value === '') {
          json.value = parameter.default
        }
        break
      }
      case 'dropdown': {
        parameter = parameter as TDropdownTargetParameter // Cast is safe due to type check at the top of the method.
        if (
          parameter.required &&
          (json.value === null || json.value === undefined)
        ) {
          json.value = parameter.default.value
        }
        break
      }
    }
  }

  /**
   * Builds the {@link TTargetArgumentContext} for a given JSON argument and
   * mission. Extracted so that subclass factory methods can share the same
   * context-construction logic without duplicating the lazy mission-component branch.
   * @param json The serialized argument data from which to build the context.
   * @param mission The mission used to resolve mission-component references.
   * @returns The constructed context.
   */
  protected static buildContext<T extends TMetisBaseComponents>(
    json: TTargetArgumentJson,
    effect: T['sessionTriggeredEffect'] | T['executionTriggeredEffect'],
  ): TTargetArgumentContext<T> {
    if (json.type === 'mission-component') {
      return ObjectToolbox.lazy(
        {
          value: () =>
            TargetArgument.extractAndDeserializeComponents<T>(
              effect.mission,
              json.value,
            ),
        },
        {
          type: 'mission-component',
        },
      )
    } else {
      return {
        type: json.type,
        value: json.value,
      } as TTargetArgumentContext<T>
    }
  }

  /**
   * Registers issue checkers for all {@link TargetArgument} instances
   * with the provided registry.
   * @param registry The registry to register checkers with.
   */
  public static registerIssueCheckers(
    registry: MissionComponentIssueRegistry,
  ): void {
    registry
      .check({
        key: TargetArgument.ISSUE_KEY_DROPDOWN_VALUE_MISMATCH,
        message: (argument) =>
          `Parameter "${argument.parameterId}" has a value "${argument.context.value}" that does not match any of the dropdown options.`,
        what: [TargetArgument],
        when: [
          'initialization',
          'effect-updated',
          'dropdown-mismatch-resolved',
        ],
        if: (argument) =>
          BooleanToolbox.onlyLast(
            argument.effect.targetArgumentsLocked,
            argument.valueIsInvalidOption,
          ),
      })
      .check({
        key: TargetArgument.ISSUE_KEY_PATTERN_MISMATCH,
        message: (argument) =>
          `Parameter "${argument.parameterId}" does not match the required pattern.`,
        what: [TargetArgument],
        when: [
          'initialization',
          'effect-updated',
          'string-argument-pattern-check',
        ],
        if: (argument) =>
          BooleanToolbox.onlyLast(
            argument.effect.targetArgumentsLocked,
            argument.hasPatternMismatch,
          ),
      })
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

  /**
   * Key used to index an issue when a target argument has a dropdown value that
   * does not match any of the parameter's options.
   */
  public static readonly ISSUE_KEY_DROPDOWN_VALUE_MISMATCH =
    'dropdown-value-mismatch'

  /**
   * Key used to index an issue when a target argument has a pattern mismatch
   * with its parameter.
   */
  public static readonly ISSUE_KEY_PATTERN_MISMATCH = 'pattern-mismatch'

  /**
   * Deserializes a selection of serialized mission components back into
   * their live mission component objects. Components that no longer exist
   * in the mission (e.g. deleted since the selection was saved) are
   * silently filtered out.
   * @param serialized The serialized selection.
   * @param mission The mission to look up components in.
   * @param jsonValue The JSON value of the argument, which is a list of
   * serialized components.
   * @returns The deserialized selections.
   */
  protected static extractAndDeserializeComponents<
    T extends TMetisBaseComponents,
  >(
    mission: T['mission'],
    jsonValue: TMissionComponentSerializedSelection[],
  ): TValidMissionComponentArgumentValue<T>[] {
    return jsonValue.flatMap(
      (item): TValidMissionComponentArgumentValue<T>[] => {
        const { componentType: type, ids } = item

        if (type === 'mission') {
          return ArrayToolbox.normalize(mission)
        } else if (type === 'force') {
          let force = mission.getForceById(ids[0])
          return ArrayToolbox.normalize(force)
        } else if (type === 'node') {
          let node = mission.getNodeById(ids[1], { forceId: ids[0] })
          return ArrayToolbox.normalize(node)
        } else if (type === 'action') {
          let action = mission.getActionById(ids[2], {
            forceId: ids[0],
            nodeId: ids[1],
          })
          return ArrayToolbox.normalize(action)
        } else if (type === 'missionFile') {
          let file = mission.getFileById(ids[0])
          return ArrayToolbox.normalize(file)
        } else if (type === 'resource') {
          let resource = mission.getResourceById(ids[0])
          return ArrayToolbox.normalize(resource)
        } else if (type === 'resourcePool') {
          return ArrayToolbox.normalize(
            mission.getPoolById(ids[1], { forceId: ids[0] }),
          )
        } else {
          throw new Error(`Unsupported component type: ${type}`)
        }
      },
    )
  }

  /**
   * Serializes mission components to be stored as the
   * value of a mission-component argument.
   * @param components The mission components to serialize.
   * @returns The serialized value.
   */
  protected static serializeMissionComponents<T extends TMetisBaseComponents>(
    components: MissionComponent<T>[],
  ): TMissionComponentSerializedSelection[] {
    return components.map(
      (item: MissionComponent<T>): TMissionComponentSerializedSelection => {
        if (!(item instanceof MissionComponent)) throw new Error('')
        let { name: lastKnownName } = item

        if (item instanceof Mission) {
          return { componentType: 'mission', lastKnownName, ids: [] }
        } else if (item instanceof MissionForce) {
          return { componentType: 'force', lastKnownName, ids: [item._id] }
        } else if (item instanceof MissionNode) {
          return {
            componentType: 'node',
            lastKnownName,
            ids: [item.force._id, item._id],
          }
        } else if (item instanceof MissionAction) {
          return {
            componentType: 'action',
            lastKnownName,
            ids: [item.force._id, item.node._id, item._id],
          }
        } else if (item instanceof MissionFile) {
          return {
            componentType: 'missionFile',
            lastKnownName,
            ids: [item._id],
          }
        } else if (item instanceof MissionResource) {
          return {
            componentType: 'resource',
            lastKnownName,
            ids: [item._id],
          }
        } else if (item instanceof ResourcePool) {
          return {
            componentType: 'resourcePool',
            lastKnownName,
            ids: [item.force._id, item._id],
          }
        } else {
          throw new Error(
            `Unsupported outline item type: ${item.constructor.name}`,
          )
        }
      },
    )
  }
}

/**
 * Zod schema that validates the serialized form of a single {@link TargetArgument}.
 * Use this to verify that migration output conforms to the expected array-of-objects
 * format before the data is written back to the database.
 */
export const targetArgumentJsonSchema = zod.discriminatedUnion('type', [
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('number'),
    value: zod.union([zod.number(), zod.null()]),
  }),
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('string'),
    value: zod.string(),
  }),
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('large-string'),
    value: zod.string(),
  }),
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('boolean'),
    value: zod.boolean(),
  }),
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('dropdown'),
    value: zod.any(),
  }),
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('mission-component'),
    value: zod.array(
      zod.object({
        componentType: zod.string(),
        lastKnownName: zod.string(),
        ids: zod.array(zod.string()),
      }),
    ),
  }),
  zod.object({
    _id: zod.string(),
    parameterId: zod.string(),
    type: zod.literal('unknown'),
    value: zod.any(),
  }),
])

/* -- TYPES -- */

/**
 * Allows the selection of an argument's serialized
 * value type based on a given parameter type.
 */
export type TSelectArgumentSerializedValue = TSatisfies<
  {
    'number': number | null
    'string': string
    'large-string': string
    'boolean': boolean
    'dropdown': TDropdownTargetParameterOptionVal
    'mission-component': TMissionComponentSerializedSelection[]
    'unknown': TTargetArgumentSerializedValue
  },
  Record<TTargetParameterType, unknown>
>

/**
 * A union of all possible mission components that can be
 * used in a mission-component argument's value.
 */
export type TValidMissionComponentArgumentValue<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> =
  | T['mission']
  | T['force']
  | T['node']
  | T['action']
  | T['missionFile']
  | T['resource']
  | T['resourcePool']

/**
 * Allows the selection of an argument value's type
 * based on a given parameter type.
 */
export type TSelectArgumentValue<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> = Omit<TSelectArgumentSerializedValue, 'mission-component'> & {
  'mission-component': TValidMissionComponentArgumentValue<T>[]
}

/**
 * The union of all possible values a {@link TTargetArgumentJson} can hold.
 * Equivalent to the union of every branch in {@link TSelectArgumentSerializedValue}.
 */
export type TTargetArgumentSerializedValue =
  TSelectArgumentSerializedValue[Exclude<TTargetParameterType, 'unknown'>]

/**
 * The union of all possible values a {@link TargetArgument} can hold.
 * Equivalent to the union of every branch in {@link TSelectArgumentValue}.
 */
export type TTargetArgumentValue<T extends TMetisBaseComponents> =
  TSelectArgumentValue<T>[Exclude<TTargetParameterType, 'unknown'>]

/**
 * The JSON representation of {@link TargetArgument}.
 */
export type TTargetArgumentJson = {
  [TType in TTargetParameterType]: {
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
    type: TType
    /**
     * @see {@link TargetArgument.value}
     */
    value: TSelectArgumentSerializedValue[TType]
  }
}[TTargetParameterType]

/**
 * A version of {@link TTargetArgumentJson} that allows the `value` field to
 * hold any JSON-serializable value.
 * @note This is particularly useful when the value may or may not
 * conform to the expected shape for its declared type.
 */
export type TAnyTargetArgumentJson = Omit<TTargetArgumentJson, 'value'> & {
  value: TSelectArgumentSerializedValue[TTargetParameterType]
}

/**
 * Discriminating union provided by {@link TargetArgument.context}
 * to allow type-safe access to the argument's value based on its type.
 */
export type TTargetArgumentContext<T extends TMetisBaseComponents> = {
  [K in TTargetParameterType]: {
    type: K
    value: TSelectArgumentValue<T>[K]
  }
}[TTargetParameterType]
5
