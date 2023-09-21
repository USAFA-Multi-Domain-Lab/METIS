import IActionOutcome, {
  IActionOutcomeJSON,
} from '../../../../shared/missions/actions/outcomes'
import ClientMissionAction from '.'
import ClientMissionNode from '../nodes'

/**
 * An outcome for the execution of an action via the Mission.execute method.
 */
export default class ClientActionOutcome implements IActionOutcome {
  // Implemented
  public readonly action: ClientMissionAction
  // Implemented
  public get node(): ClientMissionNode {
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
   * @param {ClientMissionAction} action The action itself.
   * @param {boolean} successful Whether the action succeeded.
   */
  public constructor(action: ClientMissionAction, successful: boolean) {
    this.action = action
    this.successful = successful
  }

  // Implemented
  public toJSON(): IActionOutcomeJSON {
    return {
      actionID: this.actionID,
      nodeID: this.nodeID,
      successful: this.successful,
    }
  }
}
