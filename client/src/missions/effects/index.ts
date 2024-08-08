import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import { TClientMissionTypes, TMissionNavigable } from '..'
import Effect, {
  TCommonEffectJson,
  TEffectOptions,
} from '../../../../shared/missions/effects'
import { TAjaxStatus } from '../../../../shared/toolbox/ajax'
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
   * The status on whether the target for this effect has been loaded.
   */
  private _targetAjaxStatus: TAjaxStatus
  /**
   * The status on whether the target for this effect has been loaded.
   */
  public get targetAjaxStatus(): TAjaxStatus {
    return this._targetAjaxStatus
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
    this._targetAjaxStatus = 'NotLoaded'
  }

  /**
   * @param targetId The ID of the target to load.
   * @resolves When the target data has been loaded.
   * @rejects If there is an error loading the target data.
   */
  public async populateTargetData(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if (!this.targetId) {
          throw new Error(
            `The effect "${this.name}" has no target ID. { targetId: "${this.targetId}" }`,
          )
        }

        // Set the target ajax status to loading.
        this._targetAjaxStatus = 'Loading'
        // Populate the target data.
        this._target = await ClientTarget.$fetchOne(this.targetId)
        // Set the target ajax status to loaded.
        this._targetAjaxStatus = 'Loaded'
        // Resolve the promise.
        resolve()
      } catch (error: any) {
        // Set the target ajax status to error.
        this._targetAjaxStatus = 'Error'
        // Log the error.
        console.error(`Error loading target data for effect:\n`)
        console.error(
          `Effect: { name: "${this.name}", _id: "${this._id}" }`,
          error,
        )
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
