import MissionServer from '.'
import MissionNodeServer from './nodes'
import MissionAction, { IMissionActionJSON } from 'metis/missions/actions'
import { PRNG } from 'seedrandom'
import Queue from 'metis/toolbox/queue'

/**
 * Options for TExecuteOptions.
 */
export type TExecuteOptions = {
  /**
   * Whether to enact the effects of the action, upon successful execution.
   * @default false
   */
  enactEffects?: boolean
  /**
   * Callback for when the action execution process is initated. Passes a timestamp of when the process is expected to conclude and the promise to be resolved.
   */
  onInit?: (completionTime: number) => void
}

/**
 * An outcome for the execution of an action via the Mission.execute method.
 */
export class ActionOutcome {
  /**
   * The action.
   */
  private action: MissionActionServer

  /**
   * The strength of the action in succeeding. This is a number between 0 and 1. If the number is greater than the action's chance of failure, the action is successful.
   */
  private successStrength: number

  /**
   * Whether the action is successful in its execution.
   */
  public get successful(): boolean {
    return this.successStrength > this.action.failureChance
  }

  /**
   * @note Uses private constructor. Use the static `generateOutcome` method to generate an outcome.
   * @param {MissionActionServer} action The action itself.
   * @param {number} successStrength The strength of the action in succeeding. This is a number between 0 and 1. If the number is greater than the action's chance of failure, the action is successful.
   */
  private constructor(action: MissionActionServer, successStrength: number) {
    this.action = action
    this.successStrength = successStrength
  }

  /**
   * Generate an action outcome based on the factors passed.
   * @param {number} successChance The chance of success.
   * @param {PRNG} rng The random number generator used to determine success.
   * @returns {TActionOutcome} The predetermined outcome of the action.
   */
  public static generateOutcome(
    action: MissionActionServer,
    rng: PRNG,
  ): ActionOutcome {
    return new ActionOutcome(action, rng())
  }
}

/**
 * Class for managing mission actions on the server.
 */
export default class MissionActionServer extends MissionAction<
  MissionServer,
  MissionNodeServer
> {
  /**
   * The predetermined outcomes of the action whenever its executed.
   */
  protected outcomes: Queue<ActionOutcome> = new Queue<ActionOutcome>()

  public constructor(node: MissionNodeServer, data: IMissionActionJSON) {
    super(node, data)

    // Determine the number of outcomes
    // that need to be generated. Theoretically
    // the participant cannot execute this
    // action beyond what the initial resources
    // available in the mission would allow
    // given the resource cost.
    let totalOutcomes: number =
      this.mission.initialResources / this.resourceCost

    // Generate outcomes for the action.
    for (let x = 0; x < totalOutcomes; x++) {
      let outcome: ActionOutcome = ActionOutcome.generateOutcome(
        this,
        this.mission.rng,
      )
      this.outcomes.add(outcome)
    }
  }

  /**
   * Executes the action, returning a promise that resolves with the outcome of the execution.
   * @param {TExecuteOptions} options Options for executing the action.
   * @returns {Promise<ActionOutcome>} A promise that resolves with the outcome of the execution.
   */
  public execute(options: TExecuteOptions): Promise<ActionOutcome> {
    let { enactEffects = false, onInit = () => {} } = options

    // Set executing to true, in order to
    // prevent conflicting executions.
    this.node.executing = true

    return new Promise<ActionOutcome>((resolve, reject) => {
      // Grab next outcome for the action.
      let outcome: ActionOutcome | undefined = this.outcomes.next()

      // If there are no outcomes left
      // in the queue, throw an error.
      if (outcome === undefined) {
        throw new Error('Cannot execute action: No outcomes left in queue.')
      }

      // Determine the completion time of
      // the execution process.
      let completionTime: number = Date.now() + this.processTime

      // Set timeout for when the execution
      // is completed.
      setTimeout(() => {
        // Set executing to false, in order
        // to allow for future executions.
        this.node.executing = false
        // Resolve with the determined outcome.
        resolve(outcome!)
      }, completionTime - Date.now())

      // Call onInit now that the timeout
      // has started.
      onInit(completionTime)
    })
  }
}
