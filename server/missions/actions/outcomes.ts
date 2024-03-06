import IActionOutcome, {
  IActionOutcomeJSON,
} from 'metis/missions/actions/outcomes'
import { PRNG } from 'seedrandom'
import ServerMissionAction from '.'
import ServerMissionNode from '../nodes'

/**
 * An outcome for the execution of an action via the Mission.execute method.
 * @note Added to the node automatically by calling the `ServerMissionNode.handleOutcome` method in the constructor.
 */
export class ServerPotentialOutcome implements IActionOutcome {
  // Implemented
  public readonly action: ServerMissionAction
  // Implemented
  public get node(): ServerMissionNode {
    return this.action.node
  }
  // Implemented
  public get actionID(): string {
    return this.action.actionID
  }
  // Implemented
  public get nodeID(): string {
    return this.action.node.nodeID
  }

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
   * Creates a realized outcome from the potential outcome.
   * @returns {ServerRealizedOutcome} The realized outcome.
   */
  public realize(): ServerRealizedOutcome {
    return this.node.loadOutcome(this.toJson())
  }

  /**
   * @note Uses private constructor. Use the static `generateOutcome` method to generate an outcome.
   * @param {ServerMissionAction} action The action itself.
   * @param {number} successStrength The strength of the action in succeeding. This is a number between 0 and 1. If the number is greater than the action's chance of failure, the action is successful.
   */
  private constructor(action: ServerMissionAction, successStrength: number) {
    this.action = action
    this.successStrength = successStrength
  }

  // Inherited
  public toJson(): IActionOutcomeJSON {
    return {
      actionID: this.actionID,
      nodeID: this.nodeID,
      successful: this.successful,
    }
  }

  /**
   * Generate an action outcome based on the factors passed.
   * @param {ServerMissionAction} action The action producing an outcome.
   * @param {PRNG} rng The random number generator used to determine success.
   * @returns {TActionOutcome} The predetermined outcome of the action.
   */
  public static generateOutcome(
    action: ServerMissionAction,
    rng: PRNG,
  ): ServerPotentialOutcome {
    return new ServerPotentialOutcome(action, rng.double())
  }
}

/**
 * A realized outcome for the execution of an action via the Mission.execute method.
 */
export class ServerRealizedOutcome implements IActionOutcome {
  // Implemented
  public readonly action: ServerMissionAction
  // Implemented
  public get node(): ServerMissionNode {
    return this.action.node
  }
  // Implemented
  public get actionID(): string {
    return this.action.actionID
  }
  // Implemented
  public get nodeID(): string {
    return this.action.node.nodeID
  }
  // Implmented
  public readonly successful: boolean

  /**
   * @param {ServerMissionAction} action The action itself.
   * @param {boolean} successful Whether the action succeeded.
   */
  public constructor(action: ServerMissionAction, successful: boolean) {
    this.action = action
    this.successful = successful
  }

  // Inherited
  public toJson(): IActionOutcomeJSON {
    return {
      actionID: this.actionID,
      nodeID: this.nodeID,
      successful: this.successful,
    }
  }
}
