import type {
  TEffectExecutionTriggered,
  TEffectExecutionTriggeredJson,
  TMissionActionJson,
} from 'metis/missions'
import { MissionAction } from 'metis/missions'
import type { PRNG } from 'seedrandom'
import seedrandom from 'seedrandom'
import type {
  ServerTarget,
  TTargetEnvExposedAction,
} from '../../target-environments'
import { ServerEffect } from '../effects/ServerEffect'
import type { ServerMissionNode } from '../nodes/ServerMissionNode'
import type { TExecuteOptions } from './ServerActionExecution'
import { ServerActionExecution } from './ServerActionExecution'
import { ServerExecutionOutcome } from './ServerExecutionOutcome'

/**
 * Class for managing mission actions on the server.
 */
export class ServerMissionAction extends MissionAction<TMetisServerComponents> {
  /**
   * The RNG used to generate random numbers for the action.
   */
  protected rng: PRNG

  /**
   * @param node The node that the action belongs to.
   * @param data The data to use to create the ServerMissionAction.
   * @param options The options for creating the ServerMissionAction.
   */
  public constructor(node: ServerMissionNode, data: TMissionActionJson) {
    super(node, data)

    // Initialize the RNG for the action.
    this.rng = seedrandom(`${this.mission.rng.double()}`)
  }

  // Implemented
  protected parseEffects(
    data: TEffectExecutionTriggeredJson[],
  ): ServerEffect<'executionTriggeredEffect'>[] {
    return data.map((datum: TEffectExecutionTriggeredJson) => {
      return ServerEffect.fromExecutionTriggeredJson(datum, this)
    })
  }

  // Implemented
  public createEffect(
    target: ServerTarget,
    trigger: TEffectExecutionTriggered,
  ): ServerEffect<'executionTriggeredEffect'> {
    let effect = ServerEffect.createBlankExecutionEffect(target, this, trigger)
    this.effects.push(effect)
    return effect
  }

  /**
   * Executes the action, returning a promise that resolves with the outcome of the execution.
   * @param options Options for executing the action.
   * @resolves If the action executes without any errors.
   * @rejects If there are any errors during the execution process.
   */
  public execute(options: TExecuteOptions): Promise<ServerExecutionOutcome> {
    const { infiniteResources } = options.sessionConfig
    const { cheats = {}, onInit = () => {} } = options
    const { zeroCost, guaranteedSuccess } = cheats

    return new Promise<ServerExecutionOutcome>((resolve) => {
      let execution = ServerActionExecution.generateExecution(this, cheats)

      // Process the execution at the node level.
      this.node.onExecution(execution)

      // Listen for if the execution is ever aborted,
      // resolving with the outcome, if so.
      execution.addEventListener('aborted', () => {
        resolve(execution.outcome!)
      })

      // If the "Zero Resource Cost" cheat is not enabled,
      // deduct the resource cost from the force's resources.
      if (!zeroCost && !infiniteResources) {
        this.force.resourcesRemaining -= this.resourceCost
      }

      // Set timeout for when the execution is completed.
      setTimeout(() => {
        let outcome: ServerExecutionOutcome

        // If the execution has been aborted,
        // return without resolving, since the
        // promise was already resolved by the
        // event listener.
        if (execution.status === 'aborted') return

        // Generate a new outcome based on the cheat
        // configuration.
        if (guaranteedSuccess) {
          outcome = ServerExecutionOutcome.generateGuaranteedSuccess(execution)
        } else {
          outcome = ServerExecutionOutcome.generateRandom(execution, this.rng)
        }

        // Process the outcome at the different levels.
        execution.onOutcome(outcome)
        this.node.onOutcome(outcome)

        // Resolve with the outcome.
        resolve(outcome)
      }, execution.timeRemaining)

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
  public toTargetEnvContext(): TTargetEnvExposedAction {
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

  /**
   * The regex used to validate the process time.
   * @note This regex allows for numbers with up to 6 decimal places.
   * @note This is used to validate the actions within a node.
   * @see {@link ServerMissionNode.validateActions}
   */
  public static readonly PROCESS_TIME_REGEX: RegExp = /^[0-9+-]+[.]?[0-9]{0,6}$/
}
