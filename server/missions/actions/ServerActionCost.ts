import type { TTargetEnvExposedCost } from '@server/target-environments/context/TargetEnvContext'
import type { TActionResourceCostJson } from '@shared/missions/actions/ActionResourceCost'
import { ActionResourceCost } from '@shared/missions/actions/ActionResourceCost'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import type { ServerMissionAction } from './ServerMissionAction'

/**
 * Server representation of {@link ActionResourceCost}.
 */
export class ServerActionCost extends ActionResourceCost<TMetisServerComponents> {
  /**
   * @returns The properties from the cost that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedCost {
    const self = this
    return {
      _id: self._id,
      name: self.name,
      icon: self.icon,
      baseAmount: self.baseAmount,
      amount: self.amount,
      hidden: self.hidden,
      get resource() {
        return self.resource.toTargetEnvContext()
      },
      get mission() {
        return self.mission.toTargetEnvContext()
      },
      get force() {
        return self.force.toTargetEnvContext()
      },
      get node() {
        return self.node.toTargetEnvContext()
      },
      get action() {
        return self.action.toTargetEnvContext()
      },
    }
  }

  /**
   * Creates an {@link ServerActionCost} from JSON data.
   * @param action The action that owns this resource cost.
   * @param data The JSON data from which to create the cost.
   * @returns The new {@link ServerActionCost} object created from the JSON.
   */
  public static fromJson(
    action: ServerMissionAction,
    data: TActionResourceCostJson,
  ): ServerActionCost
  /**
   * Creates an array of {@link ServerActionCost} objects from an array of JSON data.
   * @param action The action that owns the resource costs.
   * @param data The array of JSON data from which to create the costs.
   * @returns An array of {@link ServerActionCost} objects.
   */
  public static fromJson(
    action: ServerMissionAction,
    data: TActionResourceCostJson[],
  ): JsonSerializableArray<ServerActionCost>
  // Actual implementation.
  public static fromJson(
    action: ServerMissionAction,
    data: TActionResourceCostJson | TActionResourceCostJson[],
  ): ServerActionCost | JsonSerializableArray<ServerActionCost> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map((datum) => ServerActionCost.fromJson(action, datum)),
      )
    }

    let resource = action.mission.getResourceById(data.resourceId)
    if (!resource) {
      throw new Error(
        `ResourcePool creation failed: No resource found with ID ${data.resourceId}`,
      )
    }

    return new ServerActionCost(
      action,
      resource,
      data._id,
      data.baseAmount,
      data.hidden,
    )
  }
}

/* -- TYPES -- */
