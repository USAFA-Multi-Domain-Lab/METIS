import type { TTargetEnvExposedResource } from '@server/target-environments/context/TargetEnvContext'
import type { TMissionResourceJson } from '@shared/missions/MissionResource'
import { MissionResource } from '@shared/missions/MissionResource'
import { JsonSerializableArray } from '@shared/toolbox/arrays/JsonSerializableArray'
import type { ServerMission } from './ServerMission'

/**
 * Server implementation of {@link MissionResource}.
 */
export class ServerMissionResource extends MissionResource<TMetisServerComponents> {
  /**
   * @returns The properties from the resource that are
   * safe to expose in target-environment code.
   */
  public toTargetEnvContext(): TTargetEnvExposedResource {
    const self = this
    return {
      _id: self._id,
      name: self.name,
      icon: self.icon,
      order: self.order,
      get mission() {
        return self.mission.toTargetEnvContext()
      },
    }
  }

  /**
   * Creates a {@link ServerMissionResource} from JSON data.
   * @param mission The mission that owns this resource definition.
   * @param data The JSON data from which to create the resource.
   * @returns The new {@link ServerMissionResource} object created from the JSON.
   */
  public static fromJson(
    mission: ServerMission,
    data: TMissionResourceJson,
  ): ServerMissionResource
  /**
   * Creates a {@link JsonSerializableArray} of {@link ServerMissionResource} objects from an array of JSON data.
   * @param mission The mission that owns the resource definitions.
   * @param data The array of JSON data from which to create the resources.
   * @returns A {@link JsonSerializableArray} of {@link ServerMissionResource} objects.
   */
  public static fromJson(
    mission: ServerMission,
    data: TMissionResourceJson[],
  ): JsonSerializableArray<ServerMissionResource>
  // Actual implementation.
  public static fromJson(
    mission: ServerMission,
    data: TMissionResourceJson | TMissionResourceJson[],
  ): ServerMissionResource | JsonSerializableArray<ServerMissionResource> {
    if (Array.isArray(data)) {
      return new JsonSerializableArray(
        ...data.map(
          (datum) =>
            new ServerMissionResource(
              mission,
              datum._id,
              datum.name,
              datum.icon,
              datum.order,
            ),
        ),
      )
    }
    return new ServerMissionResource(
      mission,
      data._id,
      data.name,
      data.icon,
      data.order,
    )
  }
}

/* -- TYPES -- */
