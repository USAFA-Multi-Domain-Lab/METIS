import type { TTargetEnvExposedPool } from '@server/target-environments/context/TargetEnvContext'
import { ResourcePool } from '@shared/missions/forces/ResourcePool'

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
}

/* -- TYPES -- */
