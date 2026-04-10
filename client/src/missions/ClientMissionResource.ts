import type { TMissionResourceJson } from '@shared/missions/MissionResource'
import { MissionResource } from '@shared/missions/MissionResource'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMetisClientComponents } from '..'
import type { ClientMission } from './ClientMission'

/**
 * Client implementation of {@link MissionResource}.
 */
export class ClientMissionResource extends MissionResource<TMetisClientComponents> {
  /**
   * Removes the resource from the mission via {@link ClientMission.removeResource}.
   */
  public remove() {
    this.mission.removeResource(this._id)
  }

  /**
   * Creates a {@link ClientMissionResource} from JSON data.
   * @param mission The mission that owns this resource definition.
   * @param data The JSON data from which to create the resource.
   * @returns The new {@link ClientMissionResource} object created from the JSON.
   */
  public static fromJson(
    mission: ClientMission,
    data: TMissionResourceJson,
  ): ClientMissionResource
  /**
   * Creates a {@link JsonSerializableArray} of {@link ClientMissionResource} objects from an array of JSON data.
   * @param mission The mission that owns the resource definitions.
   * @param data The array of JSON data from which to create the resources.
   * @returns A {@link JsonSerializableArray} of {@link ClientMissionResource} objects.
   */
  public static fromJson(
    mission: ClientMission,
    data: TMissionResourceJson[],
  ): JsonSerializableArray<ClientMissionResource>
  // Actual implementation.
  public static fromJson(
    mission: ClientMission,
    data: TMissionResourceJson | TMissionResourceJson[],
  ): ClientMissionResource | JsonSerializableArray<ClientMissionResource> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map(
          (datum) =>
            new ClientMissionResource(
              mission,
              datum._id,
              datum.name,
              datum.icon,
              datum.order,
            ),
        ),
      )
    }
    return new ClientMissionResource(
      mission,
      data._id,
      data.name,
      data.icon,
      data.order,
    )
  }

  /**
   * @param mission The mission that owns this resource definition.
   * @param name The display name for the resource. If omitted, defaults to
   * the name in {@link DEFAULT_NAMES} for the resolved icon.
   * @param icon The icon to display for the resource. If omitted, defaults to
   * the next unused icon via {@link getNextUnusedIcon}.
   * @returns A new {@link MissionResource} object.
   */
  public static createNew<
    T extends TMetisBaseComponents = TMetisBaseComponents,
  >(
    mission: ClientMission,
    name?: string,
    icon?: TMetisIcon,
  ): ClientMissionResource {
    let order =
      Math.max(...mission.resources.map((resource) => resource.order), 1) + 1
    let resolvedIcon = icon ?? ClientMissionResource.getNextUnusedIcon(mission)
    let resolvedName =
      name ??
      MissionResource.DEFAULT_NAMES[resolvedIcon] ??
      MissionResource.DEFAULT_PROPERTIES.name
    return new ClientMissionResource(
      mission,
      StringToolbox.generateRandomId(),
      resolvedName,
      resolvedIcon,
      order,
    )
  }

  /**
   * Creates a detached {@link ClientMissionResource} which is a reference
   * to a resource that cannot be found and has likely been deleted.
   * @param mission The mission that owns this resource.
   * @param _id The unique identifier of the detached resource.
   * @param name The display name of the detached resource.
   * @param icon The icon to display for the detached resource, defaults to 'coins'.
   * @returns A detached {@link ClientMissionResource} instance.
   */
  public static createDetached(
    mission: ClientMission,
    _id: string,
    name: string,
    icon: TMetisIcon = MissionResource.DEFAULT_PROPERTIES.icon,
  ): ClientMissionResource {
    return new ClientMissionResource(mission, _id, name, icon, 0)
  }

  /**
   * Returns the first icon in {@link ICONS} not already used by
   * an existing resource in the mission. Falls back to the first
   * icon if all are somehow in use.
   */
  protected static getNextUnusedIcon(mission: ClientMission): TMetisIcon {
    let usedIcons = new Set(mission.resources.map((resource) => resource.icon))
    return (
      MissionResource.ICONS.find((icon) => !usedIcons.has(icon)) ??
      MissionResource.ICONS[0]
    )
  }
}

/* -- TYPES -- */
