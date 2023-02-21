import './OutputPanel.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import ConsoleOutput, { IConsoleOutput } from './ConsoleOutput'
import { Component } from 'react'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import { Mission } from '../../../modules/missions'

export interface IOutputPanel {
  mission: Mission
  setOutputPanelIsDisplayed: (outputPanelIsDisplayed: boolean) => void
}

export interface IOutputPanel_S {}

// This component is responsible for displaying
// console output in the game.
export default class OutputPanel extends Component<
  IOutputPanel,
  IOutputPanel_S
> {
  timerTimeStamp: number | null

  constructor(props: IOutputPanel) {
    super(props)
    this.timerTimeStamp = null
  }

  static DATE_FORMAT: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Formats a date using the date
  // formatted defined here in the
  // output panel.
  static formatDate(date?: number | Date): string {
    return OutputPanel.DATE_FORMAT.format(date)
  }

  static renderPreExecutionOutput(selectedNode: MissionNode): IConsoleOutput {
    let timeStamp: number = Date.now()
    let key: string = `pre_execution_node-${selectedNode.nodeID}_${timeStamp}`
    let innerHTML: string = `
        <div class='Text'>
        <span class='line-cursor'>
          [${OutputPanel.formatDate(Date.now())}] 
          MDL@${selectedNode.name.replaceAll(' ', '-')}:
        </span>

        <span class='default'>
          ${selectedNode.preExecutionText}
        </span>
      </div>
    `

    return { key, innerHTML }
  }

  static renderActionStartOutput(
    executingAction: MissionNodeAction,
  ): IConsoleOutput {
    let timeStamp: number = Date.now()
    let executingNode: MissionNode = executingAction.node
    let nodeName: string = executingNode.name
    let actionName: string = executingAction.name
    let processTime: number = executingAction.processTime
    let successChance: number = executingAction.successChance
    let resourceCost: number = executingAction.resourceCost
    let processTimeFormatted: string = processTime / 1000 + ' second(s)'
    let successChanceFormatted: string = successChance * 100 + '%'
    let resourceCostFormatted: string = resourceCost + ' resource(s)'
    let key: string = `start_node-${executingNode.nodeID}_action-${executingAction.actionID}_${timeStamp}`
    let innerHTML: string = `
        <div class='Text'>
          <span class='line-cursor'>
            [${OutputPanel.formatDate(timeStamp)}] 
            MDL@${nodeName.replaceAll(' ', '-')}:
          </span>
          <span class='default'>
            Started executing ${nodeName}.<br></br>
          </span>
          <ul class='SelectedActionPropertyList'>
            <li class='SelectedActionProperty'>
              Action selected: ${actionName}
            </li>
            </br>
            <li class='SelectedActionProperty'>
              Time to execute: ${processTimeFormatted}
            </li>
            </br>
            <li class='SelectedActionProperty'>
              Chance of success: ${successChanceFormatted}
            </li>
            </br>
            <li class='SelectedActionProperty'>
              Resource cost: ${resourceCostFormatted}
            </li>
            </br>

          </ul>
        </div>
      `

    return { key, innerHTML }
  }

  static renderExecutionSuccessOutput(
    executedAction: MissionNodeAction,
  ): IConsoleOutput {
    let timeStamp: number = Date.now()
    let executedNode: MissionNode = executedAction.node
    let nodeName: string = executedNode.name
    let nodeNameFormatted: string = nodeName.replaceAll(' ', '-')
    let key: string = `success_node-${executedNode.nodeID}_action-${executedAction.actionID}_${timeStamp}`
    let innerHTML = `
        <div class='Text'>
          <span class='line-cursor'>
            [${OutputPanel.formatDate(timeStamp)}] 
            MDL@${nodeNameFormatted}:
          </span>
          <span class='succeeded'>
            ${executedAction.postExecutionSuccessText}
          </span>
        </div>
        `

    return { key, innerHTML }
  }

  static renderExecutionFailureOutput(
    executedAction: MissionNodeAction,
  ): IConsoleOutput {
    let timeStamp: number = Date.now()
    let executedNode: MissionNode = executedAction.node
    let key: string = `failure_node-${executedNode.nodeID}_action-${executedAction.actionID}_${timeStamp}`
    let innerHTML: string = `
        <div class='Text'>
          <span class='line-cursor'>
            [${OutputPanel.formatDate(timeStamp)}] MDL@
            ${executedNode.name.replaceAll(' ', '-')}:
          </span>
          <span class='failed'>
            ${executedAction.postExecutionFailureText}
          </span>
        </div>
        `

    return { key, innerHTML }
  }

  // This returns the output sent to the
  // output panel while the node is executing
  // to display the time remaining.
  static renderTimeLeftOutput(executedAction: MissionNodeAction) {
    let executingNode: MissionNode = executedAction.node
    let timerTimeStamp = Date.now()
    let key: string = `time_left_node-${executingNode.nodeID}_action-${executedAction.actionID}_${timerTimeStamp}`

    let innerHTML: string = `
      <div class='Text'>
        <div class='Timer'>
          Time remaining: ${executingNode.executionTimeRemainingFormatted}
        </div>
        </br>
      </div>`

    return { key, innerHTML }
  }

  // inherited
  render(): JSX.Element | null {
    let mission: Mission = this.props.mission
    let consoleOutputs: Array<IConsoleOutput> = mission.consoleOutputs
    let setOutputPanelIsDisplayed = this.props.setOutputPanelIsDisplayed

    const closeOutputWindow = () => {
      setOutputPanelIsDisplayed(false)
    }

    /* -- RENDER -- */

    return (
      <div className='OutputPanel'>
        <div className='BorderBox'>
          <div className='MinimizeButtonContainer'>
            <span className='MinimizeButton' onClick={closeOutputWindow}>
              x
            </span>
          </div>
          <ul className='TextArea'>
            {consoleOutputs.map((consoleOutput: IConsoleOutput) => {
              return <ConsoleOutput output={consoleOutput} />
            })}
          </ul>
        </div>
      </div>
    )
  }
}
