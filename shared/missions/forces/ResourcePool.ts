import {
  serializeJson,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { Mission, type TMission } from '../Mission'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'
import { MissionResource } from '../MissionResource'
import type { TForce, TForceJsonOptions } from './MissionForce'

/**
 * Represents a pool/bank of resources from which a force can withdraw to
 * perform various actions within a mission.
 * @implements {TJsonSerializable<TResourcePoolJson>}
 */
export class ResourcePool<T extends TMetisBaseComponents = TMetisBaseComponents>
  extends MissionComponent<T, ResourcePool<T>>
  implements TJsonSerializable<TResourcePoolJson, TPoolJsonOptions>
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
  public initialBalance: number

  /**
   * Whether the pool is permitted to go below zero.
   */
  public allowNegative: boolean

  /**
   * Whether this pool is excluded from the force. An excluded pool
   * is hidden from session participants and its associated costs
   * are not applied or displayed.
   */
  public excluded: boolean

  /**
   * The current amount of resources stored in this pool.
   * Initialized from {@link TResourcePoolJson.balance} if present,
   * otherwise defaults to {@link initialBalance}.
   */
  public balance: number

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
   * @param initialBalance The starting amount of resources.
   * @param allowNegative Whether the pool can go below zero.
   * @param excluded Whether this pool is excluded from the force.
   * @param balance The current amount of resources remaining.
   */
  private constructor(
    resource: T['resource'],
    force: TForce<T>,
    _id: string,
    localKey: string,
    initialBalance: number,
    allowNegative: boolean,
    excluded: boolean,
    balance: number,
  ) {
    super(_id, '', false)
    this.resource = resource
    this.force = force
    this.localKey = localKey
    this.initialBalance = initialBalance
    this.allowNegative = allowNegative
    this.excluded = excluded
    this.balance = balance
  }

  // Implemented
  public serialize(options: TPoolJsonOptions = {}): TResourcePoolJson {
    let { sessionDataExposure = Mission.DEFAULT_SESSION_DATA_EXPOSURE } =
      options

    let json: TResourcePoolJson = serializeJson(this, [
      '_id',
      'localKey',
      'resourceId',
      'initialBalance',
      'allowNegative',
      'excluded',
    ])

    // If session data is requested to be exposed,
    // include remaining amount in the JSON.
    if (sessionDataExposure.expose !== 'none') {
      json.balance = this.balance
    }

    return json
  }

  /**
   * Callback to handle an effect which modifies this pool. Applies
   * the specified operand to the pool's remaining amount. Then propogates
   * the modification event to the owning force for any additional handling.
   * @param operand The value to apply to the pool's remaining amount.
   */
  public onModify(operand: number): void {
    this.balance += operand
    this.force.onModifyPool(this)
  }

  /**
   * Creates a new {@link ResourcePool} with generated identifiers.
   * @param force The force that owns this resource pool.
   * @param resource The {@link MissionResource} this pool will track.
   * @param initialBalance The starting amount of resources.
   * @param allowNegative Whether the pool can go below zero.
   * @param excluded Whether this pool is excluded from the force.
   * @returns A new {@link ResourcePool} instance.
   */
  public static createNew<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(
    force: TForce<T>,
    resource: T['resource'],
    initialBalance: number = ResourcePool.DEFAULT_PROPERTIES.initialBalance,
    allowNegative: boolean = ResourcePool.DEFAULT_PROPERTIES.allowNegative,
    excluded: boolean = ResourcePool.DEFAULT_PROPERTIES.excluded,
  ): ResourcePool<T> {
    return new ResourcePool<T>(
      resource,
      force,
      StringToolbox.generateRandomId(),
      force.generatePoolKey(),
      initialBalance,
      allowNegative,
      excluded,
      initialBalance,
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
      ResourcePool.DEFAULT_PROPERTIES.initialBalance,
      ResourcePool.DEFAULT_PROPERTIES.allowNegative,
      ResourcePool.DEFAULT_PROPERTIES.excluded,
      ResourcePool.DEFAULT_PROPERTIES.initialBalance,
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
      data.initialBalance,
      data.allowNegative,
      data.excluded,
      data.balance ?? data.initialBalance,
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
      initialBalance: 0,
      allowNegative: false,
      excluded: false,
    }
  }
}

/* -- TYPES -- */

/**
 * The JSON representation of {@link ResourcePool}.
 */
export type TResourcePoolJson = {
  /**
   * @see {@link ResourcePool._id}
   */
  _id: string
  /**
   * @see {@link ResourcePool.localKey}
   */
  localKey: string
  /**
   * @see {@link ResourcePool.resourceId}
   */
  resourceId: string
  /**
   * @see {@link ResourcePool.initialBalance}
   */
  initialBalance: number
  /**
   * @see {@link ResourcePool.allowNegative}
   */
  allowNegative: boolean
  /**
   * @see {@link ResourcePool.excluded}
   */
  excluded: boolean
  /**
   * @see {@link ResourcePool.balance}
   */
  balance?: number
}

/**
 * Options for serializing {@link ResourcePool} to JSON.
 */
export type TPoolJsonOptions = Pick<TForceJsonOptions, 'sessionDataExposure'>
