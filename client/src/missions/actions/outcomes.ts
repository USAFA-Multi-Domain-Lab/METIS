import ClientMissionAction from '.'
import { TClientMissionTypes } from '..'
import IActionOutcome, {
  TActionOutcomeJson,
} from '../../../../shared/missions/actions/outcomes'
import ClientMissionNode from '../nodes'

/**
 * An outcome for the execution of an action via the Mission.execute method.
 */
export default class ClientActionOutcome
  implements IActionOutcome<TClientMissionTypes>
{
  // Implemented
  public readonly action: ClientMissionAction
  // Implemented
  public get node(): ClientMissionNode {
    return this.action.node
  }
  // Implemented
  public get actionId(): ClientMissionAction['_id'] {
    return this.action._id
  }
  // Implemented
  public get nodeId(): ClientMissionNode['_id'] {
    return this.action.node._id
  }
  // Implmented
  public readonly successful: boolean

  /**
   * @param action The action itself.
   * @param successful Whether the action succeeded.
   */
  public constructor(action: ClientMissionAction, successful: boolean) {
    this.action = action
    this.successful = successful
  }

  // Implemented
  public toJson(): TActionOutcomeJson {
    return {
      actionId: this.actionId,
      nodeId: this.nodeId,
      successful: this.successful,
    }
  }
}
