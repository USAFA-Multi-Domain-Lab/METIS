import ServerMission from '..'
import ServerMissionNode from '../nodes'
import MissionAction, { TCommonMissionActionJson } from 'metis/missions/actions'
import Queue from 'metis/toolbox/queue'
import { ServerPotentialOutcome, ServerRealizedOutcome } from './outcomes'
import IActionExecution, {
  TActionExecutionJSON,
} from 'metis/missions/actions/executions'
import ServerActionExecution from './executions'
import { TCommonEffectJson } from 'metis/missions/effects'
import ServerEffect from '../effects'

/**
 * Class for managing mission actions on the server.
 */
export default class ServerMissionAction extends MissionAction<
  ServerMission,
  ServerMissionNode,
  ServerEffect
> {
  /**
   * The potential outcomes of the action whenever its executed.
   */
  protected potentialOutcomes: Queue<ServerPotentialOutcome> =
    new Queue<ServerPotentialOutcome>()

  public constructor(node: ServerMissionNode, data: TCommonMissionActionJson) {
    super(node, data)

    // Determine the number of outcomes
    // that need to be generated. Theoretically
    // the participant cannot execute this
    // action beyond what the initial resources
    // available in the mission would allow
    // given the resource cost.
    let totalOutcomes: number = Math.min(
      this.mission.initialResources / this.resourceCost,
      16,
    )

    // Generate outcomes for the action.
    for (let x = 0; x < totalOutcomes; x++) {
      let outcome: ServerPotentialOutcome =
        ServerPotentialOutcome.generateOutcome(this, this.mission.rng)
      this.potentialOutcomes.add(outcome)
    }
  }

  public parseEffects(data: TCommonEffectJson[]): ServerEffect[] {
    return data.map((datum: TCommonEffectJson) => new ServerEffect(this, datum))
  }

  /**
   * Executes the action, returning a promise that resolves with the outcome of the execution.
   * @param {TExecuteOptions} options Options for executing the action.
   * @returns {Promise<ServerRealizedOutcome>} A promise that resolves with the outcome of the execution.
   */
  public execute(
    options: TExecuteOptions<ServerActionExecution>,
  ): Promise<ServerRealizedOutcome> {
    let { enactEffects = false, onInit = () => {} } = options

    return new Promise<ServerRealizedOutcome>((resolve) => {
      // Determine the start and end time of
      // the execution process.
      let start: number = Date.now()
      let end: number = start + this.processTime

      // Create execution data.
      let executionData: NonNullable<TActionExecutionJSON> = {
        actionID: this.actionID,
        nodeID: this.node.nodeID,
        start,
        end,
      }

      // Handle execution.
      let execution = this.node.handleExecution(executionData)

      // Grab next outcome for the action.
      let potentialOutcome: ServerPotentialOutcome | undefined =
        this.potentialOutcomes.next()

      // If there are no outcomes left
      // in the queue, throw an error.
      if (potentialOutcome === undefined) {
        throw new Error('Cannot execute action: No outcomes left in queue.')
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
}

/* ------------------------------ SERVER ACTION TYPES ------------------------------ */

/**
 * Options for TExecuteOptions.
 */
export type TExecuteOptions<TActionExecution extends IActionExecution> = {
  /**
   * Whether to enact the effects of the action, upon successful execution.
   * @default false
   */
  enactEffects?: boolean
  /**
   * Callback for when the action execution process is initated. Passes a timestamp of when the process is expected to conclude and the promise to be resolved.
   */
  onInit?: (execution: TActionExecution) => void
}
