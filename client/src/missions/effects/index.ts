import { ClientTargetEnvironment } from 'src/target-environments'
import ClientTarget from 'src/target-environments/targets'
import Effect, {
  TCommonEffectJson,
  TEffectOptions,
} from '../../../../shared/missions/effects'
import ClientMissionAction from '../actions'

/**
 * Class representing an effect on the client-side that can be
 * applied to a target.
 */
export class ClientEffect extends Effect<
  ClientMissionAction,
  ClientTargetEnvironment
> {
  // Implemented
  public constructor(
    action: ClientMissionAction,
    data: Partial<TCommonEffectJson> = ClientEffect.DEFAULT_PROPERTIES,
    options: TClientEffectOptions = {},
  ) {
    // Initialize base properties.
    super(action, data, options)
  }

  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    try {
      // Update the target ajax status.
      this._targetAjaxStatus = 'Loading'
      // Load the target data.
      let target: ClientTarget = await ClientTarget.fetchOne(targetId)
      // If the target ID doesn't match the target
      // ID associated with the effect, throw an error.
      if (target.id !== targetId) {
        throw new Error(
          `The target "${target.name}" with the ID "${target.id}" does not match the target ID "${targetId}" associated with the effect "${this.name}".`,
        )
      }

      // Populate the target data.
      this._target = target
      // Update the target ajax status.
      this._targetAjaxStatus = 'Loaded'
    } catch (error: any) {
      // Update the target ajax status.
      this._targetAjaxStatus = 'Error'
      // Log the error.
      console.error('Error loading target data for effect.', error)
      // Throw the error.
      throw error
    }
  }
}

/* ------------------------------ CLIENT EFFECT TYPES ------------------------------ */

/**
 * Options for creating a new ClientEffect Object.
 */
export type TClientEffectOptions = TEffectOptions & {}
