import type { TTargetEnvExposedPool } from '@server/target-environments/context/TargetEnvContext'
import type { TResourcePoolJson } from '@shared/missions/forces/ResourcePool'
import { ResourcePool } from '@shared/missions/forces/ResourcePool'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import type { ServerMissionForce } from './ServerMissionForce'

/**
 * Server implementation of {@link ResourcePool}.
 */
export class ServerResourcePool extends ResourcePool<TMetisServerComponents> {
  /**
   * @returns The properties from the pool that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedPool {
    const self = this
    return {
      _id: self._id,
      localKey: self.localKey,
      name: self.name,
      initialBalance: self.initialBalance,
      allowNegative: self.allowNegative,
      excluded: self.excluded,
      balance: self.balance ?? self.initialBalance,
      // Getters here are to save on serialization size.
      get resource() {
        return self.resource.toTargetEnvContext()
      },
      get mission() {
        return self.mission.toTargetEnvContext()
      },
      get force() {
        return self.force.toTargetEnvContext()
      },
    }
  }

  /**
   * Creates a {@link ServerResourcePool} from JSON data.
   * @param force The force that owns this resource pool.
   * @param data The JSON data from which to create the pool.
   * @returns The new {@link ServerResourcePool} object created from the JSON.
   */
  public static fromJson(
    force: ServerMissionForce,
    data: TResourcePoolJson,
  ): ServerResourcePool
  /**
   * Creates a {@link JsonSerializableArray} of {@link ServerResourcePool} objects from an array of JSON data.
   * @param force The force that owns the resource pools.
   * @param data The array of JSON data from which to create the pools.
   * @returns A {@link JsonSerializableArray} of {@link ServerResourcePool} objects.
   */
  public static fromJson(
    force: ServerMissionForce,
    data: TResourcePoolJson[],
  ): JsonSerializableArray<ServerResourcePool>
  // Actual implementation.
  public static fromJson(
    force: ServerMissionForce,
    data: TResourcePoolJson | TResourcePoolJson[],
  ): ServerResourcePool | JsonSerializableArray<ServerResourcePool> {
    // Array check. If data is an array, call recursively
    // on each item for joint deserialization.
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map((datum) => ServerResourcePool.fromJson(force, datum)),
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

    return new ServerResourcePool(
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
}

/* -- TYPES -- */
