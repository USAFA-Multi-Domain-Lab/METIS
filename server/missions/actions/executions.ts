import ActionExecution from 'metis/missions/actions/executions'
import ServerMissionAction from '.'
import { TServerMissionTypes } from '..'

/**
 * The execution of an action on the server.
 */
export default class ServerActionExecution extends ActionExecution<TServerMissionTypes> {
  /**
   * @param action The action being executed.
   * @param start The time at which the action started executing.
   * @param end The time at which the action finishes executing.
   */
  public constructor(action: ServerMissionAction, start: number, end: number) {
    super(action, start, end)
  }
}
