import type { TMetisClientComponents } from '@client/index'
import type { TActionResourceCostJson } from '@shared/missions/actions/ActionResourceCost'
import { ActionResourceCost } from '@shared/missions/actions/ActionResourceCost'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { ClientMissionResource } from '../ClientMissionResource'
import type { ClientMissionAction } from './ClientMissionAction'

/**
 * Client representation of {@link ActionResourceCost}.
 */
export class ClientActionCost extends ActionResourceCost<TMetisClientComponents> {
  /**
   * Creates an {@link ClientActionCost} from JSON data.
   * @param action The action that owns this resource cost.
   * @param data The JSON data from which to create the cost.
   * @returns The new {@link ClientActionCost} object created from the JSON.
   */
  public static fromJson(
    action: ClientMissionAction,
    data: TActionResourceCostJson,
  ): ClientActionCost
  /**
   * Creates an array of {@link ClientActionCost} objects from an array of JSON data.
   * @param action The action that owns the resource costs.
   * @param data The array of JSON data from which to create the costs.
   * @returns An array of {@link ClientActionCost} objects.
   */
  public static fromJson(
    action: ClientMissionAction,
    data: TActionResourceCostJson[],
  ): JsonSerializableArray<ClientActionCost>
  // Actual implementation.
  public static fromJson(
    action: ClientMissionAction,
    data: TActionResourceCostJson | TActionResourceCostJson[],
  ): ClientActionCost | JsonSerializableArray<ClientActionCost> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map((datum) => ClientActionCost.fromJson(action, datum)),
      )
    }

    let resource = action.mission.getResourceById(data.resourceId)
    if (!resource) {
      throw new Error(
        `ResourcePool creation failed: No resource found with ID ${data.resourceId}`,
      )
    }

    return new ClientActionCost(
      action,
      resource,
      data._id,
      data.baseAmount,
      data.hidden,
    )
  }

  /**
   * Creates a new {@link ClientActionCost} with a generated identifier.
   * @param action The action that owns this resource cost.
   * @param resourceId The ID of the resource pool this cost targets.
   * @param baseAmount The starting base amount of the cost.
   * @param hidden Whether this cost is hidden from session participants.
   * @returns A new {@link ClientActionCost} instance.
   */
  public static createNew(
    action: ClientMissionAction,
    resource: ClientMissionResource,
    baseAmount: number = 0,
    hidden: boolean = false,
  ): ClientActionCost {
    return new ClientActionCost(
      action,
      resource,
      StringToolbox.generateRandomId(),
      baseAmount,
      hidden,
    )
  }
}

/* -- TYPES -- */
