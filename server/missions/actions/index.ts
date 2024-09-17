import MissionAction, {
  TCommonMissionActionJson,
  TMissionActionOptions,
} from 'metis/missions/actions'
import IActionExecution, {
  TActionExecutionJson,
} from 'metis/missions/actions/executions'
import { TCommonEffectJson } from 'metis/missions/effects'
import ClientConnection from 'metis/server/connect/clients'
import { plcApiLogger } from 'metis/server/logging'
import EnvironmentContextProvider, {
  TTargetEnvContextAction,
} from 'metis/server/target-environments/context-provider'
import seedrandom, { PRNG } from 'seedrandom'
import { TServerMissionTypes } from '..'
import ServerEffect, { TServerEffectOptions } from '../effects'
import ServerMissionNode from '../nodes'
import ServerActionExecution from './executions'
import { ServerPotentialOutcome, ServerRealizedOutcome } from './outcomes'

/**
 * Class for managing mission actions on the server.
 */
export default class ServerMissionAction extends MissionAction<TServerMissionTypes> {
  /**
   * The RNG used to generate random numbers for the action.
   */
  protected rng: PRNG

  /**
   * @param node The node that the action belongs to.
   * @param data The data to use to create the ServerMissionAction.
   * @param options The options for creating the ServerMissionAction.
   */
  public constructor(
    node: ServerMissionNode,
    data: TCommonMissionActionJson,
    options: TServerMissionActionOptions = {},
  ) {
    super(node, data, options)

    // Initialize the RNG for the action.
    this.rng = seedrandom(`${this.mission.rng.double()}`)
  }

  // Implemented
  protected parseEffects(
    data: TCommonEffectJson[],
    options: TServerEffectOptions = {},
  ): ServerEffect[] {
    return data.map(
      (datum: TCommonEffectJson) => new ServerEffect(this, datum, options),
    )
  }

  /**
   * Executes the action, returning a promise that resolves with the outcome of the execution.
   * @param options Options for executing the action.
   * @resolves If the action executes without any errors.
   * @rejects If there are any errors during the execution process.
   */
  public execute(
    options: TExecuteOptions<ServerActionExecution>,
  ): Promise<ServerRealizedOutcome> {
    let {
      participant,
      environmentContextProvider,
      effectsEnabled = false,
      onInit = () => {},
    } = options

    return new Promise<ServerRealizedOutcome>((resolve) => {
      // Determine the start and end time of
      // the execution process.
      let start: number = Date.now()
      let end: number = start + this.processTime

      // Create execution data.
      let executionData: NonNullable<TActionExecutionJson> = {
        actionId: this._id,
        nodeId: this.node._id,
        start,
        end,
      }

      // Load execution.
      let execution = this.node.loadExecution(executionData)

      // Grab next outcome for the action.
      let potentialOutcome: ServerPotentialOutcome =
        ServerPotentialOutcome.generateOutcome(this, this.rng)

      // Deduct resources from force.
      this.force.resourcesRemaining -= this.resourceCost

      // Set timeout for when the execution
      // is completed.
      setTimeout(() => {
        // Realize the outcome.
        let realizedOutcome: ServerRealizedOutcome = potentialOutcome!.realize()

        // Resolve with the determined outcome.
        resolve(realizedOutcome)

        // If the outcome is successful and the effects
        // are enabled...
        if (realizedOutcome.successful && effectsEnabled) {
          // ...iterate through the effects and apply them.
          this.effects.forEach(async (effect: ServerEffect) => {
            try {
              // Apply the effect to the target.
              await environmentContextProvider.applyEffect(
                effect,
                participant.user.username,
              )

              // todo: implement internal effects feedback
              // participant.emit('effect-successful', {
              //   message: 'The effect was successfully applied to its target.',
              // })
            } catch (error: any) {
              // Log the error.
              plcApiLogger.error(error)

              // todo: implement internal effects feedback
              // participant.emitError(
              //   new ServerEmittedError(ServerEmittedError.CODE_EFFECT_FAILED),
              // )
            }
          })
        }
      }, end - Date.now())

      // Call onInit now that the timeout
      // has started.
      onInit(execution)
    })
  }

  /**
   * Extracts the necessary properties from the action to be used as a reference
   * in a target environment.
   * @returns The action's necessary properties.
   */
  public toTargetEnvContext(): TTargetEnvContextAction {
    return {
      _id: this._id,
      name: this.name,
      description: this.description,
      successChance: this.successChance,
      processTime: this.processTime,
      resourceCost: this.resourceCost,
      effects: this.effects.map((effect) => effect.toTargetEnvContext()),
    }
  }
}

/* ------------------------------ SERVER ACTION TYPES ------------------------------ */

/**
 * Options for creating a new ServerMissionAction object.
 */
export type TServerMissionActionOptions = TMissionActionOptions & {}

/**
 * Options for TExecuteOptions.
 */
export type TExecuteOptions<TActionExecution extends IActionExecution> = {
  /**
   * The participant executing the action.
   */
  participant: ClientConnection
  /**
   * The context provider for the target environment.
   */
  environmentContextProvider: EnvironmentContextProvider
  /**
   * Whether to enable the effects of the action, upon successful execution.
   * @default false
   */
  effectsEnabled: boolean
  /**
   * Callback for when the action execution process is initated. Passes a timestamp of when the process is expected to conclude and the promise to be resolved.
   */
  onInit?: (execution: TActionExecution) => void
}
