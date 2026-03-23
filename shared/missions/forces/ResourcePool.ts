import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { type TMission } from '../Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'
import { MissionResource } from '../MissionResource'
import type { TForce } from './MissionForce'

/**
 * Represents a pool/bank of resources from which a force can withdraw to
 * perform various actions within a mission.
 * @implements {TJsonSerializable<TResourcePoolJson>}
 */
export class ResourcePool<T extends TMetisBaseComponents = TMetisBaseComponents>
  extends MissionComponent<T, ResourcePool<T>>
  implements TJsonSerializable<TResourcePoolJson>
{
  /**
   * The force that owns this resource pool.
   */
  public readonly force: T['force']

  // Implemented
  public get mission(): TMission<T> {
    return this.force.mission
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [...this.force.path, this]
  }

  /**
   * The name of the {@link MissionResource} this pool tracks.
   */
  // Implemented
  public get name(): string {
    return this.resource.name
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
  }

  /**
   * The {@link MissionResource} this pool tracks.
   */
  public readonly resource: T['resource']

  /**
   * The ID of the {@link MissionResource} this pool tracks.
   */
  public get resourceId(): string {
    return this.resource._id
  }

  /**
   * A key for the pool, used to identify it within the force.
   */
  public localKey: string

  /**
   * The amount of resources available at the start of a session.
   */
  public initialAmount: number

  /**
   * Whether the pool is permitted to go below zero.
   */
  public allowNegative: boolean

  /**
   * The current amount of resources remaining in this pool.
   * Initialized from {@link TResourcePoolJson.remainingAmount} if present,
   * otherwise defaults to {@link initialAmount}.
   */
  public remainingAmount: number

  /**
   * The icon derived from the {@link resource} tracked
   * by this pool.
   */
  public get icon(): TMetisIcon {
    return this.resource.icon
  }

  // Implemented
  public get json(): TResourcePoolJson {
    return this.serialize()
  }

  /**
   * @param resource The {@link MissionResource} this pool tracks.
   * @param force The force that owns this resource pool.
   * @param _id The unique identifier for this resource pool entry.
   * @param localKey The key used to identify this pool within the force.
   * @param initialAmount The starting amount of resources.
   * @param allowNegative Whether the pool can go below zero.
   * @param remainingAmount The current amount of resources remaining.
   */
  private constructor(
    resource: T['resource'],
    force: TForce<T>,
    _id: string,
    localKey: string,
    initialAmount: number,
    allowNegative: boolean,
    remainingAmount: number,
  ) {
    super(_id, '', false)
    this.resource = resource
    this.force = force
    this.localKey = localKey
    this.initialAmount = initialAmount
    this.allowNegative = allowNegative
    this.remainingAmount = remainingAmount
  }

  // Implemented
  public serialize(): TResourcePoolJson {
    return serializeJson(this, [
      '_id',
      'localKey',
      'resourceId',
      'initialAmount',
      'allowNegative',
      'remainingAmount',
    ])
  }

  /**
   * Callback to handle an effect which modifies this pool. Applies
   * the specified operand to the pool's remaining amount. Then propogates
   * the modification event to the owning force for any additional handling.
   * @param operand The value to apply to the pool's remaining amount.
   */
  public onModify(operand: number): void {
    this.remainingAmount += operand
    this.force.onModifyPool(this)
  }

  /**
   * Creates a new {@link ResourcePool} with generated identifiers.
   * @param force The force that owns this resource pool.
   * @param resource The {@link MissionResource} this pool will track.
   * @param initialAmount The starting amount of resources.
   * @param allowNegative Whether the pool can go below zero.
   * @returns A new {@link ResourcePool} instance.
   */
  public static createNew<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(
    force: TForce<T>,
    resource: T['resource'],
    initialAmount: number = 0,
    allowNegative: boolean = false,
  ): ResourcePool<T> {
    return new ResourcePool<T>(
      resource,
      force,
      StringToolbox.generateRandomId(),
      force.generatePoolKey(),
      initialAmount,
      allowNegative,
      initialAmount,
    )
  }

  /**
   * Creates a detached {@link ResourcePool} that represents a pool
   * referenced in an effect but its associated resource cannot be found.
   * @param force The force that owns this resource pool.
   * @param localKey The local key of the detached pool.
   * @param name The display name of the detached pool.
   * @returns A detached {@link ResourcePool} instance.
   */
  public static createResourceDetachedFromKey<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(force: TForce<T>, localKey: string, name: string): ResourcePool<T> {
    let resource = MissionResource.createDetached<T>(
      force.mission,
      StringToolbox.generateRandomId(),
      name,
    )
    return new ResourcePool<T>(
      resource,
      force,
      StringToolbox.generateRandomId(),
      localKey,
      0,
      false,
      0,
    )
  }

  /**
   * Creates a {@link ResourcePool} from JSON data.
   * @param force The force that owns this resource pool.
   * @param data The JSON data from which to create the pool.
   * @returns The new {@link ResourcePool} object created from the JSON.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    force: TForce<T>,
    data: TResourcePoolJson,
  ): T['resourcePool']
  /**
   * Creates a {@link JsonSerializableArray} of {@link ResourcePool} objects from an array of JSON data.
   * @param force The force that owns the resource pools.
   * @param data The array of JSON data from which to create the pools.
   * @returns A {@link JsonSerializableArray} of {@link ResourcePool} objects.
   */
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    force: TForce<T>,
    data: TResourcePoolJson[],
  ): JsonSerializableArray<T['resourcePool']>
  // Actual implementation.
  public static fromJson<T extends TMetisBaseComponents = TMetisBaseComponents>(
    force: TForce<T>,
    data: TResourcePoolJson | TResourcePoolJson[],
  ): T['resourcePool'] | JsonSerializableArray<T['resourcePool']> {
    // Array check. If data is an array, call recursively
    // on each item for joint deserialization.
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map((datum) => ResourcePool.fromJson<T>(force, datum)),
      )
    }

    // Find associated resource for the pool.
    let mission: T['mission'] = force.mission
    let resource = mission.getResourceById(data.resourceId)
    if (!resource) {
      throw new Error(
        `ResourcePool creation failed: No resource found with ID ${data.resourceId}`,
      )
    }

    return new ResourcePool<T>(
      resource,
      force,
      data._id,
      data.localKey ?? force.generatePoolKey(),
      data.initialAmount,
      data.allowNegative,
      data.remainingAmount ?? data.initialAmount,
    )
  }

  /**
   * The default properties for a {@link ResourcePool} object.
   */
  public static get DEFAULT_PROPERTIES(): Omit<
    TResourcePoolJson,
    'resourceId'
  > {
    return {
      _id: StringToolbox.generateRandomId(),
      localKey: '1',
      initialAmount: 0,
      allowNegative: false,
    }
  }
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link ResourcePool}.
 */
export type TResourcePoolJson = {
  /**
   * The unique identifier for this resource pool entry.
   */
  _id: string
  /**
   * A key for the pool, used to identify it within the force.
   */
  localKey: string
  /**
   * The ID of the {@link MissionResource} being stored within this pool.
   */
  resourceId: string
  /**
   * The amount of resources available at the start of the session.
   */
  initialAmount: number
  /**
   * Whether the pool can go below zero.
   */
  allowNegative: boolean
  /**
   * The current amount of resources remaining.
   * @note This is a session-only value and is never persisted to the database.
   * @default initialAmount
   */
  remainingAmount?: number
}
