import MissionNode from 'metis/missions/nodes'
import ServerMission from '..'
import { TCommonMissionActionJson } from 'metis/missions/actions'
import ServerMissionAction from '../actions'
import { ServerRealizedOutcome } from '../actions/outcomes'
import ServerActionExecution from '../actions/executions'
import { IActionOutcomeJSON } from 'metis/missions/actions/outcomes'
import { TActionExecutionJSON } from 'metis/missions/actions/executions'

/**
 * Class for managing mission nodes on a game server.
 */
export default class ServerMissionNode extends MissionNode<
  ServerMission,
  ServerMissionNode,
  ServerMissionAction,
  ServerActionExecution,
  ServerRealizedOutcome
> {
  // Implemented
  protected parseActionData(
    data: Array<TCommonMissionActionJson>,
  ): Map<string, ServerMissionAction> {
    let actions: Map<string, ServerMissionAction> = new Map<
      string,
      ServerMissionAction
    >()
    data.forEach((datum) => {
      let action: ServerMissionAction = new ServerMissionAction(this, datum)
      actions.set(action.actionID, action)
    })
    return actions
  }

  // Implemented
  protected parseExecutionData(
    data: TActionExecutionJSON,
  ): ServerActionExecution | null {
    // If data is null return null.
    if (data === null) {
      return null
    }

    // Get action for the ID passed.
    let action: ServerMissionAction | undefined = this.actions.get(
      data.actionID,
    )

    // Handle undefined action.
    if (action === undefined) {
      throw new Error('Action not found for given execution datum.')
    }

    // Return new execution object.
    return new ServerActionExecution(action, data.start, data.end)
  }

  // Implemented
  protected parseOutcomeData(
    data: Array<IActionOutcomeJSON>,
  ): Array<ServerRealizedOutcome> {
    // Map JSON to an Array of outcome objects.
    return data.map((datum: IActionOutcomeJSON) => {
      // Get action for ID passed.
      let action: ServerMissionAction | undefined = this.actions.get(
        datum.actionID,
      )

      // Handle undefined action.
      if (action === undefined) {
        throw new Error('Action not found for given outcome datum.')
      }

      // Return new outcome object.
      return new ServerRealizedOutcome(action, datum.successful)
    })
  }

  // Implemented
  public open(): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void) => {
        if (this.openable) {
          this.opened = true
          resolve()
        } else {
          reject(new Error('Node is not openable.'))
        }
      },
    )
  }

  // Implemented
  public handleExecution(
    data: NonNullable<TActionExecutionJSON>,
  ): ServerActionExecution {
    // Get the action action being executed.
    let { actionID } = data
    let action = this.actions.get(actionID)

    // Throw an error if action is undefined.
    if (action === undefined) {
      throw new Error(
        'Action not found for given the action ID in the execution data.',
      )
    }
    // Throw an error if not executable.
    if (!this.executable) {
      throw new Error('Cannot handle execution: Node is not executable.')
    }
    // Throw an error if non ready to execute.
    if (!this.readyToExecute) {
      throw new Error('Cannot handle execution: Node is not ready to execute.')
    }

    // Generate and set the node's execution.
    this._execution = new ServerActionExecution(action, data.start, data.end)

    // Return execution.
    return this._execution
  }

  // Implemented
  public handleOutcome(data: IActionOutcomeJSON): ServerRealizedOutcome {
    // Get the action for the outcome.
    let action: ServerMissionAction | undefined = this.actions.get(
      data.actionID,
    )

    // Throw an error if action is undefined.
    if (action === undefined) {
      throw new Error(
        'Action not found for given the action ID in the outcome data.',
      )
    }
    // Throw an error if the execution state is not executed.
    if (this.executionState !== 'executing') {
      throw new Error('Cannot handle outcome: Node is not executing.')
    }

    // Generate outcome.
    let outcome: ServerRealizedOutcome = new ServerRealizedOutcome(
      action,
      data.successful,
    )

    // Add to list of outcomes.
    this._outcomes.push(outcome)

    // Remove execution.
    this._execution = null

    // Return outcome.
    return outcome
  }

  /**
   * Options when setting the color of nodes.
   */
  public static readonly COLOR_OPTIONS: Array<string> = [
    '#ffffff',
    '#A4A4A4',
    '#848484',
    '#6E6E6E',
    '#585858',
    '#424242',
    '#2E2E2E',
    '#000000',

    '#9ae293',
    '#65eb59',
    '#45cf45',
    '#33b533',
    '#1e971e',
    '#168816',
    '#0c760c',
    '#006600',

    '#97cbf5',
    '#52b1ff',
    '#34a1fb',
    '#2f89d3',
    '#096cbd',
    '#1e66a1',
    '#0e4e83',
    '#003a6a',

    '#dea3ff',
    '#b839ff',
    '#ae66d6',
    '#9242be',
    '#7725a4',
    '#561a77',
    '#4b0c6e',
    '#3b005c',

    '#f59a9e',
    '#f1696f',
    '#f9484f',
    '#d6353b',
    '#ab2227',
    '#890d12',
    '#670307',
    '#4b0003',

    '#f597ce',
    '#eb5fb2',
    '#fa39ac',
    '#cd328e',
    '#a81a6d',
    '#830b52',
    '#760046',
    '#64003b',

    '#f5c18a',
    '#f5b066',
    '#ffab50',
    '#c78032',
    '#ab671d',
    '#91520e',
    '#7c4407',
    '#643400',

    '#f5e677',
    '#f6e351',
    '#f7e346',
    '#d0bf3b',
    '#af9f23',
    '#978814',
    '#867809',
    '#6a5e00',

    '#fdd496',
    '#d0a563',
    '#ac8750',
    '#886a3e',
    '#654e2a',
    '#503c1d',
    '#392910',
    '#331f00',
  ]
}
