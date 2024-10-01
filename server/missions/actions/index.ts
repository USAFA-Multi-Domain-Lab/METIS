import MissionAction, {
  TCommonMissionActionJson,
  TMissionActionOptions,
} from 'metis/missions/actions'
import IActionExecution, {
  TActionExecutionJson,
  TExecutionCheats,
} from 'metis/missions/actions/executions'
import { TCommonEffectJson } from 'metis/missions/effects'
import { TTargetEnvContextAction } from 'metis/server/target-environments/context-provider'
import { TSessionConfig } from 'metis/sessions'
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
    let { infiniteResources } = options.sessionConfig
    let { cheats = {}, onInit = () => {} } = options

    let {
      zeroCost = false,
      instantaneous = false,
      guaranteedSuccess = false,
    } = cheats

    return new Promise<ServerRealizedOutcome>((resolve) => {
      // Determine the start and end time of
      // the execution process.
      let start: number = Date.now()
      let end: number = start

      // If the "Instantaneous Execution" cheat is not enabled,
      // add the process time to the end time.
      if (!instantaneous) end += this.processTime

      // Create execution data.
      let executionData: NonNullable<TActionExecutionJson> = {
        actionId: this._id,
        nodeId: this.node._id,
        start,
        end,
      }

      // Load execution.
      let execution = this.node.loadExecution(executionData)

      // Generate next outcome for the action.
      let potentialOutcome: ServerPotentialOutcome
      // If the "Guaranteed Success" cheat is enabled,
      // generate a guaranteed successful outcome.
      if (guaranteedSuccess) {
        potentialOutcome =
          ServerPotentialOutcome.generateGuaranteedSuccess(this)
      }
      // Else, generate a potential outcome based on the action's success chance.
      else {
        potentialOutcome = ServerPotentialOutcome.generateOutcome(
          this,
          this.rng,
        )
      }

      // If the "Zero Resource Cost" cheat is not enabled,
      // deduct the resource cost from the force's resources.
      if (!zeroCost && !infiniteResources) {
        this.force.resourcesRemaining -= this.resourceCost
      }

      // Set timeout for when the execution
      // is completed.
      setTimeout(() => {
        // Realize the outcome.
        let realizedOutcome: ServerRealizedOutcome = potentialOutcome!.realize()

        // Resolve with the determined outcome.
        resolve(realizedOutcome)
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
   * The configuration for the session.
   */
  sessionConfig: TSessionConfig
  /**
   * Cheats to apply when executing the action.
   * @note Any cheats ommitted will be treated
   * as `false`, or disabled.
   */
  cheats?: Partial<TExecutionCheats>
  /**
   * Callback for when the action execution process is initated. Passes a timestamp of when the process is expected to conclude and the promise to be resolved.
   */
  onInit?: (execution: TActionExecution) => void
}
