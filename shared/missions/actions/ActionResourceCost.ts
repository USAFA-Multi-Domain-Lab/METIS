import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { Mission, type TMission } from '../Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'
import type { TAction, TActionJsonOptions } from './MissionAction'

/**
 * Represents the resource cost applied to a single resource pool when
 * a mission action is executed.
 */
export class ActionResourceCost<
  T extends TMetisBaseComponents = TMetisBaseComponents,
>
  extends MissionComponent<T, ActionResourceCost<T>>
  implements TJsonSerializable<TActionResourceCostJson, TCostJsonOptions>
{
  /**
   * The action that will be executed upon this
   * cost is charged to a pool.
   */
  public readonly action: TAction<T>

  // Implemented
  public get mission(): TMission<T> {
    return this.action.mission
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.action.path, this]
  }

  // Implemented
  public get name(): string {
    return this.resource.name
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
  }

  /**
   * The resource that will be charged this cost when the action is executed.
   */
  public readonly resource: T['resource']

  /**
   * The ID of the resource pool this cost targets.
   */
  public get resourceId(): string {
    return this.resource._id
  }

  /**
   * The base amount to subtract from the pool when the action is executed
   * before any modifiers are applied.
   */
  public baseAmount: number

  /**
   * Whether this cost is hidden from session participants.
   */
  public hidden: boolean

  /**
   * The session operand applied to this cost's base amount.
   * @note Can be positive or negative, increasing or decreasing the effective cost.
   */
  private _operand: number = 0

  /**
   * The effective amount after applying the session operand.
   * This is the actual amount deducted from the pool when the action is executed.
   */
  public get amount(): number {
    return Math.max(
      this.baseAmount + this._operand,
      ActionResourceCost.RESOURCE_COST_MIN,
    )
  }

  /**
   * The icon to display for this cost, which is
   * derived from the associated resource.
   */
  public get icon(): TMetisIcon {
    return this.resource.icon
  }

  // Implemented
  public get json(): TActionResourceCostJson {
    return this.serialize()
  }

  /**
   * Applies the given resource cost to this pool by
   * reducing the remaining amount by the cost's
   * specified amount.
   * @param cost The resource cost to apply to this pool.
   * @throws Error if the cost's resource ID does not
   * match this pool's resource ID.
   */
  public applyTo(pool: T['resourcePool']): void {
    if (pool.resourceId !== this.resourceId) {
      throw new Error('Resource ID mismatch.')
    }
    pool.remainingAmount -= this.amount
  }

  /**
   * Modifies this cost's effective amount by applying the given operand.
   * @param operand The value to add to the current operand. Can be positive or negative.
   * @note This will not change the value of {@link baseAmount} but it will affect the
   * value returned by {@link amount}.
   */
  public modifyAmount(operand: number): void {
    this._operand += operand
  }

  /**
   * @param action The action that owns this resource cost.
   * @param resource The resource to which this cost applies.
   * @param _id The unique identifier for this resource cost entry.
   * @param baseAmount The base amount to subtract from the pool when the action is executed,
   * before any modifiers are applied.
   * @param hidden Whether this cost is hidden from session participants.
   */
  private constructor(
    action: TAction<T>,
    resource: T['resource'],
    _id: string,
    baseAmount: number,
    hidden: boolean,
  ) {
    super(_id, '', false)
    this.action = action
    this.resource = resource
    this.baseAmount = baseAmount
    this.hidden = hidden
  }

  // Implemented
  public serialize(options: TCostJsonOptions = {}): TActionResourceCostJson {
    let { sessionDataExposure = Mission.DEFAULT_SESSION_DATA_EXPOSURE } =
      options
    let json = serializeJson(this, [
      '_id',
      'resourceId',
      'baseAmount',
      'hidden',
    ])
    // Hide base amount if the session data is exposed and
    // the cost is marked as hidden, to prevent session participants
    // from seeing the cost of the action.
    if (sessionDataExposure.expose !== 'none' && this.hidden) {
      json.baseAmount = -1
    }
    return json
  }

  /**
   * Creates a new {@link ActionResourceCost} with a generated identifier.
   * @param action The action that owns this resource cost.
   * @param resourceId The ID of the resource pool this cost targets.
   * @param baseAmount The starting base amount of the cost.
   * @param hidden Whether this cost is hidden from session participants.
   * @returns A new {@link ActionResourceCost} instance.
   */
  public static createNew<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(
    action: TAction<T>,
    resource: T['resource'],
    baseAmount: number = 0,
    hidden: boolean = false,
  ): ActionResourceCost<T> {
    return new ActionResourceCost<T>(
      action,
      resource,
      StringToolbox.generateRandomId(),
      baseAmount,
      hidden,
    )
  }

  /**
   * Creates an {@link ActionResourceCost} from JSON data.
   * @param action The action that owns this resource cost.
   * @param data The JSON data from which to create the cost.
   * @returns The new {@link ActionResourceCost} object created from the JSON.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    action: TAction<T>,
    data: TActionResourceCostJson,
  ): ActionResourceCost<T>
  /**
   * Creates an array of {@link ActionResourceCost} objects from an array of JSON data.
   * @param action The action that owns the resource costs.
   * @param data The array of JSON data from which to create the costs.
   * @returns An array of {@link ActionResourceCost} objects.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    action: TAction<T>,
    data: TActionResourceCostJson[],
  ): JsonSerializableArray<ActionResourceCost<T>>
  // Actual implementation.
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    action: TAction<T>,
    data: TActionResourceCostJson | TActionResourceCostJson[],
  ): ActionResourceCost<T> | JsonSerializableArray<ActionResourceCost<T>> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map((datum) => ActionResourceCost.fromJson<T>(action, datum)),
      )
    }

    let resource = action.mission.getResourceById(data.resourceId)
    if (!resource) {
      throw new Error(
        `ResourcePool creation failed: No resource found with ID ${data.resourceId}`,
      )
    }

    return new ActionResourceCost<T>(
      action,
      resource,
      data._id,
      data.baseAmount,
      data.hidden,
    )
  }

  /**
   * The minimum effective amount for a resource cost.
   */
  public static readonly RESOURCE_COST_MIN: number = 0

  /**
   * The default properties for an {@link ActionResourceCost} object.
   */
  public static get DEFAULT_PROPERTIES(): Omit<
    TActionResourceCostJson,
    'resourceId'
  > {
    return {
      _id: StringToolbox.generateRandomId(),
      baseAmount: 100,
      hidden: false,
    }
  }
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link ActionResourceCost}.
 */
export type TActionResourceCostJson = {
  /**
   * @see {@link ActionResourceCost._id}
   */
  _id: string
  /**
   * @see {@link ActionResourceCost.resourceId}
   */
  resourceId: string
  /**
   * @see {@link ActionResourceCost.baseAmount}
   */
  baseAmount: number
  /**
   * @see {@link ActionResourceCost.hidden}
   */
  hidden: boolean
}

/**
 * Options for serializing {@link ActionResourceCost} to JSON.
 */
export type TCostJsonOptions = TActionJsonOptions
