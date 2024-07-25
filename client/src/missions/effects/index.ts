import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TClientMissionTypes, TMissionNavigable } from '..'
import Effect, {
  TCommonEffectJson,
  TEffectOptions,
} from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect
  extends Effect<TClientMissionTypes>
  implements TMissionNavigable
{
  // Implemented
  public get targetEnvironment(): ClientTargetEnvironment | null {
    if (this.target instanceof ClientTarget) {
      return this.target.targetEnvironment
    } else {
      return null
    }
  }

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this.force, this.node, this.action, this]
  }

  /**
   * Class representing an effect on the client-side that can be
   * applied to a target.
   * @param action The action to which the effect belongs.
   * @param data The data for the effect.
   * @param options The options for the effect.
   */
  public constructor(
    action: ClientMissionAction,
    data: Partial<TCommonEffectJson> = ClientEffect.DEFAULT_PROPERTIES,
    options: TClientEffectOptions = {},
  ) {
    super(action, data, options)

    // If the target ID is provided and the mission is not in session, populate the target data.
    if (data.targetId && !this.mission.inSession) {
      this.populateTargetData(data.targetId)
    }
  }

  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Populate the target data.
        this._target = await ClientTarget.$fetchOne(targetId)
        // Resolve the promise.
        resolve()
      } catch (error: any) {
        // Log the error.
        console.error('Error loading target data for effect.\n', error)
        // Reject the promise.
        reject(error)
      }
    })
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * The options for creating a ClientEffect.
 */
export type TClientEffectOptions = TEffectOptions & {}
