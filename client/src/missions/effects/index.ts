import { TMetisClientComponents } from 'src'
import ClientTarget from 'src/target-environments/targets'
import Effect, {
  TEffectJson,
  TEffectOptions,
} from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect extends Effect<TMetisClientComponents> {
  /**
   * @param action The action to which the effect belongs.
   * @param data The data for the effect.
   * @param options The options for the effect.
   */
  public constructor(
    action: ClientMissionAction,
    data: Partial<TEffectJson> = ClientEffect.DEFAULT_PROPERTIES,
    options: TClientEffectOptions = {},
  ) {
    super(action, data, options)
  }

  /**
   * Populates the target data for the effect.
   * @param targetId The ID of the target to populate.
   */
  protected populateTargetData(targetId: string | null | undefined): void {
    // Get the target from the target environment.
    let target = ClientTarget.getTarget(targetId)

    // If the target is found, set it and update the
    // target status to 'Populated'.
    if (target) this._target = target
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The options for creating a ClientEffect.
 */
export type TClientEffectOptions = TEffectOptions & {}
