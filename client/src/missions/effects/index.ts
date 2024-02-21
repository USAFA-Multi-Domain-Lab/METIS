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
  /**
   * The target environment containing a list of targets to which the effect can be applied.
   * @note Initially this is null, but it will be set when the user selects a target environment
   * via the target-effect interface.
   */
  protected _selectedTargetEnv: ClientTargetEnvironment | null
  /**
   * The target environment containing a list of targets to which the effect can be applied.
   * @note Initially this is null, but it will be set when the user selects a target environment
   * via the target-effect interface.
   */
  public get selectedTargetEnv(): ClientTargetEnvironment | null {
    return this._selectedTargetEnv
  }
  /**
   * The target environment containing a list of targets to which the effect can be applied.
   * @note Initially this is null, but it will be set when the user selects a target environment
   * via the target-effect interface.
   */
  public set selectedTargetEnv(targetEnv: ClientTargetEnvironment | null) {
    // Only set the target environment if it is a ClientTargetEnvironment object.
    if (targetEnv instanceof ClientTargetEnvironment) {
      this._selectedTargetEnv = targetEnv
    }
    // Otherwise, set the target environment to null.
    else {
      this._selectedTargetEnv = null
    }
  }

  /**
   * The target to which the effect will be applied.
   * @note Initially this is null, but it will be set when the user selects a target via the target-effect interface.
   */
  protected _selectedTarget: ClientTarget | null
  /**
   * The target to which the effect will be applied.
   * @note Initially this is null, but it will be set when the user selects a target via the target-effect interface.
   */
  public get selectedTarget(): ClientTarget | null {
    return this._selectedTarget
  }
  /**
   * The target to which the effect will be applied.
   * @note Initially this is null, but it will be set when the user selects a target via the target-effect interface.
   */
  public set selectedTarget(target: ClientTarget | null) {
    // Only set the target if it is a ClientTarget object.
    if (target instanceof ClientTarget) {
      this._selectedTarget = target
      this._target = target
    }
    // Otherwise, set the target to null.
    else {
      this._selectedTarget = null
    }
  }

  // Implemented
  public constructor(
    action: ClientMissionAction,
    data: Partial<TCommonEffectJson> = Effect.DEFAULT_PROPERTIES,
    options: TClientEffectOptions = {},
  ) {
    // Initialize base properties.
    super(action, data, options)

    // Initialize the selected target environment and target.
    this._selectedTargetEnv = null
    this._selectedTarget = null
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
