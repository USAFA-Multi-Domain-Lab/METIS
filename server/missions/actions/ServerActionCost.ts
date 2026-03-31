import type { TTargetEnvExposedCost } from '@server/target-environments/context/TargetEnvContext'
import { ActionResourceCost } from '@shared/missions/actions/ActionResourceCost'

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
}

/* -- TYPES -- */
