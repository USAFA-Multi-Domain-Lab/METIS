import type { TTargetEnvExposedResource } from '@server/target-environments/context/TargetEnvContext'
import { MissionResource } from '@shared/missions/MissionResource'

/**
 * Represents a named resource defined at the mission level. Each resource
 * is a distinct currency that forces can hold and spend when executing actions.
 * Forces reference resources by `_id` via their {@link ResourcePool} entries, and
 * actions deduct from one or more resources via their resource costs.
 * @implements {TJsonSerializable<TMissionResourceJson>}
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
}

/* -- TYPES -- */
