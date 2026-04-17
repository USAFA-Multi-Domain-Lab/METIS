import type { TMetisClientComponents } from '@client/index'
import type { TResourcePoolJson } from '@shared/missions/forces/ResourcePool'
import { ResourcePool } from '@shared/missions/forces/ResourcePool'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { ClientMissionResource } from '../ClientMissionResource'
import type { ClientMissionForce } from './ClientMissionForce'

/**
 * Client implementation of {@link ResourcePool}.
 */
export class ClientResourcePool extends ResourcePool<TMetisClientComponents> {
  /**
   * Creates a {@link ClientResourcePool} from JSON data.
   * @param force The force that owns this resource pool.
   * @param data The JSON data from which to create the pool.
   * @returns The new {@link ClientResourcePool} object created from the JSON.
   */
  public static fromJson(
    force: ClientMissionForce,
    data: TResourcePoolJson,
  ): ClientResourcePool
  /**
   * Creates a {@link JsonSerializableArray} of {@link ClientResourcePool} objects from an array of JSON data.
   * @param force The force that owns the resource pools.
   * @param data The array of JSON data from which to create the pools.
   * @returns A {@link JsonSerializableArray} of {@link ClientResourcePool} objects.
   */
  public static fromJson(
    force: ClientMissionForce,
    data: TResourcePoolJson[],
  ): JsonSerializableArray<ClientResourcePool>
  // Actual implementation.
  public static fromJson(
    force: ClientMissionForce,
    data: TResourcePoolJson | TResourcePoolJson[],
  ): ClientResourcePool | JsonSerializableArray<ClientResourcePool> {
    // Array check. If data is an array, call recursively
    // on each item for joint deserialization.
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map((datum) => ClientResourcePool.fromJson(force, datum)),
      )
    }

    // Find associated resource for the pool.
    let mission = force.mission
    let resource = mission.getResourceById(data.resourceId)
    if (!resource) {
      throw new Error(
        `ResourcePool creation failed: No resource found with ID ${data.resourceId}`,
      )
    }

    return new ClientResourcePool(
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
   * Creates a new {@link ClientResourcePool} with generated identifiers.
   * @param force The force that owns this resource pool.
   * @param resource The {@link ClientMissionResource} this pool will track.
   * @param initialBalance The starting amount of resources.
   * @param allowNegative Whether the pool can go below zero.
   * @param excluded Whether this pool is excluded from the force.
   * @returns A new {@link ClientResourcePool} instance.
   */
  public static createNew(
    force: ClientMissionForce,
    resource: ClientMissionResource,
    initialBalance: number = ResourcePool.DEFAULT_PROPERTIES.initialBalance,
    allowNegative: boolean = ResourcePool.DEFAULT_PROPERTIES.allowNegative,
    excluded: boolean = ResourcePool.DEFAULT_PROPERTIES.excluded,
  ): ClientResourcePool {
    return new ClientResourcePool(
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
   * Creates a detached {@link ClientResourcePool} that represents a pool
   * referenced in an effect but its associated resource cannot be found.
   * @param force The force that owns this resource pool.
   * @param localKey The local key of the detached pool.
   * @param name The display name of the detached pool.
   * @returns A detached {@link ClientResourcePool} instance.
   */
  public static createResourceDetachedFromKey(
    force: ClientMissionForce,
    localKey: string,
    name: string,
  ): ClientResourcePool {
    let resource = ClientMissionResource.createDetached(
      force.mission,
      StringToolbox.generateRandomId(),
      name,
    )
    return new ClientResourcePool(
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
}

/* -- TYPES -- */
