import React from 'react'
import './ExecuteNodePath.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import { Mission } from '../../../modules/missions'
import Notification from '../../../modules/notifications'
import Tooltip from '../communication/Tooltip'
import { INotifyOptions } from '../../AppState'
import { IConsoleOutput } from './ConsoleOutput'
import OutputPanel from './OutputPanel'

/* -- INTERFACE(S) -- */

interface IExecuteNodePath {
  isOpen: boolean
  selectedAction: MissionNodeAction
  notify: (message: string, options: INotifyOptions) => Notification
  outputToConsole: (output: IConsoleOutput) => void
  handleCloseRequest: () => void
  handleGoBackRequest: () => void
}

interface IExecuteNodePath_S {}

export default class ExecuteNodePath extends React.Component<
  IExecuteNodePath,
  IExecuteNodePath_S
> {
  // This is called when an executed action
  // has finished executing and the result
  // was a success.
  static handleExecutionSuccess(action: MissionNodeAction): void {
    let mission: Mission = action.node.mission

    mission.outputToConsole(OutputPanel.renderExecutionSuccessOutput(action))
  }

  // This is called when an executed action
  // has finished executing and the result
  // was a failure.
  static handleExecutionFailure(action: MissionNodeAction): void {
    let mission: Mission = action.node.mission

    mission.outputToConsole(OutputPanel.renderExecutionFailureOutput(action))
  }

  get selectedAction(): MissionNodeAction {
    return this.props.selectedAction
  }

  get selectedNode(): MissionNode {
    return this.props.selectedAction.node
  }

  get mission(): Mission {
    return this.selectedNode.mission
  }

  componentDidMount(): void {}

  componentWillUnmount(): void {}

  // Closes the execution prompt window
  closeWindow = () => {
    this.props.handleCloseRequest()
  }

  execute = () => {
    let selectedAction: MissionNodeAction = this.selectedAction

    if (selectedAction.readyToExecute) {
      this.closeWindow()
      this.props.outputToConsole(
        OutputPanel.renderActionStartOutput(selectedAction),
      )
      selectedAction.execute()
    } else {
      this.props.notify(
        `The action you attempted to execute is not currently executable.`,
        { duration: 3500 },
      )
    }
  }

  render(): JSX.Element | null {
    let selectedNode: MissionNode = this.selectedNode
    let selectedAction: MissionNodeAction = this.props.selectedAction
    let isOpen: boolean = this.props.isOpen
    let handleGoBackRequest = this.props.handleGoBackRequest

    // Logic to disable the execute button once a user is out of tokens.
    let className: string = 'ExecuteNodePath'
    let executionButtonClassName: string = 'Button ExecutionButton'
    let displayTooltip: boolean = false
    let additionalActionButtonClassName: string =
      'Button AdditionalActionButton'

    /* -- COMPONENT VARIABLES -- */
    let actionName: string = selectedAction.name

    /* -- RENDER -- */

    if (!isOpen) {
      className += ' Hidden'
    }
    if (!selectedAction.readyToExecute) {
      executionButtonClassName += ' Disabled'
      displayTooltip = true
    }
    if (selectedNode.actions.length === 1) {
      additionalActionButtonClassName += ' Disabled'
    }

    return (
      <div className={className}>
        <p className='x' onClick={this.closeWindow}>
          x
        </p>
        <p className='PromptDisplayText'>
          Do you want to {actionName.toLowerCase()} {selectedNode.name}?
        </p>
        <ActionPropertyDisplay selectedNode={selectedNode} />
        <div className='Buttons'>
          <button className={executionButtonClassName} onClick={this.execute}>
            EXECUTE ACTION
            {displayTooltip ? (
              <Tooltip
                description={`You cannot ${actionName.toLowerCase()} because you have no more resources left to spend.`}
              />
            ) : null}
          </button>

          <button
            className={additionalActionButtonClassName}
            onClick={handleGoBackRequest}
          >
            Back
          </button>
        </div>
      </div>
    )
  }
}
