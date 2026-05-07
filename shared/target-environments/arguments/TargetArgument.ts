import { MissionAction } from '@shared/missions/actions/MissionAction'
import type { Effect, TEffectType } from '@shared/missions/effects/Effect'
import { MissionFile } from '@shared/missions/files/MissionFile'
import { MissionForce } from '@shared/missions/forces/MissionForce'
import { ResourcePool } from '@shared/missions/forces/ResourcePool'
import { MissionResource } from '@shared/missions/MissionResource'
import { MissionNode } from '@shared/missions/nodes/MissionNode'
import type { TMissionComponentSerializedSelection } from '@shared/target-environments/parameters/mission-component/MissionComponentTargetParameter2'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import type { TSatisfies } from '@shared/toolbox/objects/ObjectToolbox'
import { type TJsonSerializable } from '@shared/toolbox/serialization/json'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { Mission, type TMission } from '../../missions/Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../../missions/MissionComponent'
import type { TDropdownTargetParameterOptionVal } from '../parameters/DropdownTargetParameter'
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

  public readonly context: Readonly<TTargetArgumentContext<T>>

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
  public get value(): TTargetArgumentValue<T> {
    return this.context.value
  }

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
    context: TTargetArgumentContext<T>,
  ) {
    super(_id, '', false)
    this.parameterId = parameterId
    this.context = context

    this.effect = effect.normalize()

    this._additionalIssues = []

    // this.scanForIssues()
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

  // todo: Move logic to effect.
  //
  //   /**
  //    * Scans the argument for issues and adds them to
  //    * {@link additionalIssues}.
  //    */
  //   private scanForIssues() {
  //     this._additionalIssues = []
  //
  //     // Do not push issues if the target is missing.
  //     // This should be handled at the effect level.
  //     if (!this.effect.target) return
  //
  //     // Push an issue if the parameter cannot be found on the target.
  //     if (!this.parameter) {
  //       this._additionalIssues.push({
  //         component: this,
  //         type: 'general',
  //         message: `Effect "${this.effect.name}" with parameter ID "${this.parameterId}" not found on target "${this.effect.target.name}".`,
  //       })
  //     }
  //     // Push an issue if the parameter type does not match the expected type.
  //     // 'unknown' is a migration placeholder — skip the check until it is promoted.
  //     else if (this.type !== 'unknown' && this.parameter.type !== this.type) {
  //       this._additionalIssues.push({
  //         component: this,
  //         type: 'general',
  //         message: `Effect "${this.effect.name}" has a type mismatch for parameter "${this.parameter.name}": expected "${this.parameter.type}", got "${this.type}".`,
  //       })
  //     }
  //   }

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
          const force = mission.getForceById(ids[0])
          return ArrayToolbox.normalize(force)
        } else if (type === 'node') {
          const node = mission.getNodeById(ids[1], { forceId: ids[0] })
          return ArrayToolbox.normalize(node)
        } else if (type === 'action') {
          const action = mission.getActionById(ids[2], {
            forceId: ids[0],
            nodeId: ids[1],
          })
          return ArrayToolbox.normalize(action)
        } else if (type === 'missionFile') {
          const file = mission.getFileById(ids[0])
          return ArrayToolbox.normalize(file)
        } else if (type === 'resource') {
          const resource = mission.getResourceById(ids[0])
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
 * Discriminating union provided by {@link TargetArgument.context}
 * to allow type-safe access to the argument's value based on its type.
 */
export type TTargetArgumentContext<T extends TMetisBaseComponents> = {
  [K in TTargetParameterType]: {
    type: K
    value: TSelectArgumentValue<T>[K]
  }
}[TTargetParameterType]
