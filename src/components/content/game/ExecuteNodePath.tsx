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
import { useStore } from 'react-context-hook'
import { TMetisSession, User, permittedRoles } from '../../../modules/users'

/* -- INTERFACE(S) -- */

interface IExecuteNodePath {
  isOpen: boolean
  selectedAction: MissionNodeAction
  notify: (message: string, options: INotifyOptions) => Notification
  outputToConsole: (output: IConsoleOutput) => void
  handleExecutionRequest: () => void
  handleCloseRequest: () => void
  handleGoBackRequest: () => void
}

interface IExecuteNodePath_S {}

function Buttons(props: {
  selectedAction: MissionNodeAction
  handleExecutionRequest: () => void
  handleGoBackRequest: () => void
  handleCloseRequest: () => void
  outputToConsole: (output: IConsoleOutput) => void
  notify: (message: string, options: INotifyOptions) => Notification
}): JSX.Element | null {
  /* -- COMPONENT VARIABLES -- */
  let selectedAction: MissionNodeAction = props.selectedAction
  let selectedNode: MissionNode = selectedAction.node
  let mission: Mission = selectedNode.mission
  let handleExecutionRequest = props.handleExecutionRequest
  let handleGoBackRequest = props.handleGoBackRequest
  let notify = props.notify
  let outputToConsole = props.outputToConsole
  let handleCloseRequest = props.handleCloseRequest

  /* -- GLOBAL STATE -- */
  const [session] = useStore<TMetisSession>('session')

  /* -- COMPONENT FUNCTIONS -- */
  // Closes the execution prompt window.
  const closeWindow = () => {
    handleCloseRequest()
  }

  const execute = () => {
    if (selectedAction.readyToExecute) {
      closeWindow()
      outputToConsole(OutputPanel.renderActionStartOutput(selectedAction))
      handleExecutionRequest()
    } else {
      notify(
        `The action you attempted to execute is not currently executable.`,
        { duration: 3500 },
      )
    }
  }

  /* -- RENDER -- */

  let executionButtonClassName: string = 'Button ExecutionButton'
  let additionalActionButtonClassName: string = 'Button AdditionalActionButton'
  let displayTooltip: boolean = false
  let useAssets: boolean = false

  if (!selectedAction.readyToExecute) {
    executionButtonClassName += ' Disabled'
    displayTooltip = true
  }
  if (selectedNode.actions.length === 1) {
    additionalActionButtonClassName += ' Disabled'
  }

  if (permittedRoles.includes(session?.user.role ?? 'NOT_LOGGED_IN')) {
    useAssets = true
  }

  return (
    <div className='Buttons'>
      <button className={executionButtonClassName} onClick={execute}>
        EXECUTE ACTION
        {displayTooltip ? (
          <Tooltip
            description={`You cannot execute this action because you do not have enough resources remaining.`}
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
  )
}

export default class ExecuteNodePath extends React.Component<
  IExecuteNodePath,
  IExecuteNodePath_S
> {
  // This is called when an executed action
  // has finished executing and the result
  // was a success.
  static handleExecutionSuccess(action: MissionNodeAction): void {
    let node: MissionNode = action.node
    let mission: Mission = node.mission

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

  // Closes the execution prompt window.
  closeWindow = () => {
    this.props.handleCloseRequest()
  }

  render(): JSX.Element | null {
    let selectedNode: MissionNode = this.selectedNode
    let selectedAction: MissionNodeAction = this.props.selectedAction
    let isOpen: boolean = this.props.isOpen

    // Logic to disable the execute button once a user is out of tokens.
    let className: string = 'ExecuteNodePath'

    /* -- COMPONENT VARIABLES -- */
    let actionName: string = selectedAction.name

    /* -- RENDER -- */

    if (!isOpen) {
      className += ' Hidden'
    }

    return (
      <div className={className}>
        <div className='Close'>
          <div className='CloseButton' onClick={this.closeWindow}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>
        <div className='PromptDisplayText'>
          Do you want to {actionName.toLowerCase()} {selectedNode.name}?
        </div>
        <ActionPropertyDisplay selectedNode={selectedNode} />
        <Buttons
          selectedAction={this.selectedAction}
          handleExecutionRequest={this.props.handleExecutionRequest}
          handleGoBackRequest={this.props.handleGoBackRequest}
          handleCloseRequest={this.props.handleCloseRequest}
          outputToConsole={this.props.outputToConsole}
          notify={this.props.notify}
        />
      </div>
    )
  }
}
