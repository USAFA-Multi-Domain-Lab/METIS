import ExecutionOutcome, {
  TExecutionOutcomeJson,
  TOutcomeState,
} from 'metis/missions/actions/outcomes'
import { TMetisServerComponents } from 'metis/server'
import StringToolbox from 'metis/toolbox/strings'
import { PRNG } from 'seedrandom'
import ServerActionExecution from './executions'

/**
 * An outcome for the execution of an action via the `MissionNode.prototype.execute` method.
 * @note Added to the node automatically by calling the `ServerMissionNode.handleOutcome`
 * method in the constructor.
 */
export default class ServerExecutionOutcome extends ExecutionOutcome<TMetisServerComponents> {
  /**
   * @note Uses private constructor. Use static methods to create new instances.
   * @param _id Unique identifier for the outcome.
   * @param execution The execution itself.
   * @param options Options for creating the outcome. Pass `successStrength` to generate a successful
   * or failed outcome, or pass `aborted` to generate an aborted outcome.
   */
  private constructor(
    _id: string,
    execution: ServerActionExecution,
    options: TServerOutcomeOptions,
  ) {
    let state: TOutcomeState

    // Generate the outcome state based on the
    // options provided.
    switch (options.method) {
      case 'load-existing':
        // Apply the existing state.
        state = options.data.state
        break
      case 'rng':
        // Determine the state of the outcome.
        let successful =
          options.successStrength > execution.action.failureChance
        state = successful ? { status: 'success' } : { status: 'failure' }
        break
      case 'abort':
        // Create an aborted state.
        state = { status: 'aborted', abortedAt: options.abortedAt }
        break
    }

    // Call the parent constructor.
    super(_id, state, execution)
  }

  /**
   * Create a new outcome object by loading a preexisting
   * outcome.
   * @param data The preexisting outcome data.
   * @param execution The execution associated with the outcome.
   */
  public static loadExisting(
    data: TExecutionOutcomeJson,
    execution: ServerActionExecution,
  ): ServerExecutionOutcome {
    return new ServerExecutionOutcome(data._id, execution, {
      method: 'load-existing',
      data,
    })
  }

  /**
   * Generate an execution outcome based on the rng passed.
   * @param execution The execution producing an outcome.
   * @param rng The random number generator used to determine success.
   * @returns The predetermined outcome of the execution.
   */
  public static generateRandom(
    execution: ServerActionExecution,
    rng: PRNG,
  ): ServerExecutionOutcome {
    return new ServerExecutionOutcome(
      StringToolbox.generateRandomId(),
      execution,
      {
        method: 'rng',
        successStrength: rng.double(),
      },
    )
  }

  /**
   * Generate a guranteed successful outcome for an execution.
   * @param execution The execution producing an outcome.
   * @returns The predetermined outcome of the execution.
   */
  public static generateGuaranteedSuccess(
    execution: ServerActionExecution,
  ): ServerExecutionOutcome {
    return new ServerExecutionOutcome(
      StringToolbox.generateRandomId(),
      execution,
      {
        method: 'rng',
        successStrength: 2,
      },
    )
  }

  /**
   * Generates an aborted outcome for an execution.
   * @param execution The execution producing an outcome.
   * @returns The outcome with the appropriate state.
   */
  public static generateAborted(
    execution: ServerActionExecution,
  ): ServerExecutionOutcome {
    return new ServerExecutionOutcome(
      StringToolbox.generateRandomId(),
      execution,
      {
        method: 'abort',
        abortedAt: Date.now(),
      },
    )
  }
}

/**
 * Options for constructor `ServerExecutionOutcome`.
 */
export type TServerOutcomeOptions =
  | {
      /**
       * The method for generating the outcome.
       */
      method: 'load-existing'
      /**
       * The data for the outcome.
       */
      data: TExecutionOutcomeJson
    }
  | {
      /**
       * The method for generating the outcome.
       */
      method: 'rng'
      /*
       * The strength of the action in succeeding. This is a number between 0 and 1. If the
       * number is greater than the action's chance of failure, the action is successful.
       */
      successStrength: number
    }
  | {
      /**
       * The method for generating the outcome.
       */
      method: 'abort'
      /**
       * The time at which the execution was aborted.
       */
      abortedAt: number
    }
