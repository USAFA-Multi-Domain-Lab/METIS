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

    // Populate the target data.
    if (data.targetId && !options.useDefaultTarget) {
      this.populateTargetData(data.targetId)
    } else {
      this._target = new ClientTarget(new ClientTargetEnvironment())
    }
  }

  // Implemented
  public async populateTargetData(targetId: string): Promise<void> {
    try {
      // Fetch all target environments.
      let targetEnvironments: ClientTargetEnvironment[] =
        await ClientTargetEnvironment.fetchAll()

      // Initialize the target.
      let target: ClientTarget | undefined

      // Iterate through the target environments to find the target.
      for (let targetEnvironment of targetEnvironments) {
        // Fetch the targets for the environment.
        let targets: ClientTarget[] = targetEnvironment.targets

        // Find the target with the provided ID.
        target = targets.find((target) => target.id === targetId)

        // If the target is found, break the loop.
        if (target) break
      }

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
export type TClientEffectOptions = TEffectOptions & {
  /**
   * Whether or not to use the default target.
   */
  useDefaultTarget?: boolean
}
