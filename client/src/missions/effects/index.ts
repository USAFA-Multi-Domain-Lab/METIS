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
      // Fetch all target environments.
      let targetEnvironments: ClientTargetEnvironment[] =
        await ClientTargetEnvironment.fetchAll()

      // Create the default target environment and target.
      let defaultTargetEnvironment: ClientTargetEnvironment =
        new ClientTargetEnvironment({
          id: ClientTargetEnvironment.DEFAULT_PROPERTIES.id,
        })
      let defaultTarget: ClientTarget = new ClientTarget(
        defaultTargetEnvironment,
        {
          id: ClientTarget.DEFAULT_PROPERTIES.id,
        },
      )
      defaultTargetEnvironment.targets.push(defaultTarget)

      // Add the default target environment and target to the list of target environments.
      targetEnvironments.push(defaultTargetEnvironment)

      // Initialize the target.
      let target: ClientTarget | undefined

      // Iterate through the target environments to find the target.
      targetEnvironments.forEach(
        (targetEnvironment: ClientTargetEnvironment) => {
          // Get the target associated with the target ID.
          target = targetEnvironment.targets.find(
            (target: ClientTarget) => target.id === targetId,
          )
        },
      )

      // If the target is not found, throw an error.
      if (!target) {
        throw new Error(`Target with ID "${targetId}" not found.`)
      }

      // Populate the target data.
      this._target = target
    } catch (error: any) {
      // Log the error.
      console.error('Error loading target data for effect.\n', error)
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
