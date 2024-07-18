import { Component } from 'react'
import RichTextOutputBox from 'src/components/content/communication/RichTextOutputBox'
import ClientMission from 'src/missions'
import ClientMissionAction from 'src/missions/actions'
import ClientMissionNode from 'src/missions/nodes'
import { IConsoleOutput } from './ConsoleOutput'
import './OutputPanel.scss'

export interface IOutputPanel {
  mission: ClientMission
}

export interface IOutputPanel_S {}

/**
 * A panel for displaying console output messages in the session.
 */
export default class OutputPanel extends Component<
  IOutputPanel,
  IOutputPanel_S
> {
  timerTimeStamp: number | null

  constructor(props: IOutputPanel) {
    super(props)
    this.timerTimeStamp = null
  }

  // When the component mounts, the mission's
  // intro message is output to the console.
  componentDidMount(): void {
    let mission: ClientMission = this.props.mission
    let timeStamp: number = Date.now()
    let key: string = `mission-${mission._id}_intro-message_${timeStamp}`

    let renderInnerHTML = () => (
      <div className='Text'>
        <span className='LineCursor Intro'>
          [{OutputPanel.formatDate(timeStamp)}] MDL@
          {mission.name.replaceAll(' ', '-')}:{' '}
        </span>
        <RichTextOutputBox Element={mission.introMessage} />
      </div>
    )

    let consoleOutput: IConsoleOutput = { key, renderInnerHTML }
    // todo: Fix this
    // mission.outputToConsole(consoleOutput)
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

  static renderPreExecutionOutput(
    selectedNode: ClientMissionNode,
  ): IConsoleOutput {
    let timeStamp: number = Date.now()
    let key: string = `pre_execution_node-${selectedNode._id}_${timeStamp}`
    let renderInnerHTML = () => {
      let textClassName: string = 'Text'

      if (selectedNode.preExecutionText === '') {
        textClassName += ' Hidden'
      }

      return (
        <div className={textClassName}>
          <span className='LineCursor'>
            [{OutputPanel.formatDate(timeStamp)}] MDL@
            {selectedNode.name.replaceAll(' ', '-')}:{' '}
          </span>
          <RichTextOutputBox Element={selectedNode.preExecutionText} />
        </div>
      )
    }

    return { key, renderInnerHTML }
  }

  static renderActionStartOutput(
    executingAction: ClientMissionAction,
  ): IConsoleOutput {
    let done: boolean = false
    let timeStamp: number = Date.now()
    let executingNode: ClientMissionNode = executingAction.node
    let nodeName: string = executingNode.name
    let actionName: string = executingAction.name
    let processTime: number = executingAction.processTime
    let successChance: number = executingAction.successChance
    let resourceCost: number = executingAction.resourceCost
    let processTimeFormatted: string = processTime / 1000 + ' second(s)'
    let successChanceFormatted: string = successChance * 100 + '%'
    let resourceCostFormatted: string = resourceCost + ' resource(s)'
    let timeRemainingFormatted: string = ''
    let key: string = `start_node-${executingNode._id}_action-${executingAction._id}_${timeStamp}`

    let renderInnerHTML = () => {
      if (!done) {
        // todo: Fix this
        // timeRemainingFormatted = executingNode.formatTimeRemaining(true)
        timeRemainingFormatted = ''

        if (timeRemainingFormatted === 'Done.') {
          done = true
        }
      } else {
        timeRemainingFormatted = 'Done.'
      }

      return (
        <div className='Text'>
          <span className='LineCursor'>
            [{OutputPanel.formatDate(timeStamp)}] MDL@
            {nodeName.replaceAll(' ', '-')}:{' '}
          </span>
          <RichTextOutputBox Element={`Started executing ${nodeName}.`} />
          <ul className='SelectedActionPropertyList'>
            <li className='SelectedActionProperty'>
              <RichTextOutputBox Element={`Action selected: ${actionName}`} />
            </li>
            <br></br>
            <li className='SelectedActionProperty'>
              <RichTextOutputBox
                Element={`Time to execute: ${processTimeFormatted}`}
              />
            </li>
            <br></br>
            <li className='SelectedActionProperty'>
              <RichTextOutputBox
                Element={`Probability of success: ${successChanceFormatted}`}
              />
            </li>
            <br></br>
            <li className='SelectedActionProperty'>
              <RichTextOutputBox
                Element={`Resource cost: ${resourceCostFormatted}`}
              />
            </li>
            <br></br>
            <li className='SelectedActionProperty'>
              <RichTextOutputBox
                Element={`Time remaining: ${timeRemainingFormatted}`}
              />
            </li>
            <br></br>
          </ul>
        </div>
      )
    }

    return { key, renderInnerHTML }
  }

  static renderExecutionSuccessOutput(
    executedAction: ClientMissionAction,
  ): IConsoleOutput {
    let timeStamp: number = Date.now()
    let executedNode: ClientMissionNode = executedAction.node
    let nodeName: string = executedNode.name
    let nodeNameFormatted: string = nodeName.replaceAll(' ', '-')
    let key: string = `success_node-${executedNode._id}_action-${executedAction._id}_${timeStamp}`
    let renderInnerHTML = () => (
      <div className='Text'>
        <span className='LineCursor'>
          [{OutputPanel.formatDate(timeStamp)}] MDL@{nodeNameFormatted}:{' '}
        </span>
        <span className='Succeeded'>
          <RichTextOutputBox
            Element={executedAction.postExecutionSuccessText}
          />
        </span>
      </div>
    )

    return { key, renderInnerHTML }
  }

  static renderExecutionFailureOutput(
    executedAction: ClientMissionAction,
  ): IConsoleOutput {
    let timeStamp: number = Date.now()
    let executedNode: ClientMissionNode = executedAction.node
    let key: string = `failure_node-${executedNode._id}_action-${executedAction._id}_${timeStamp}`
    let renderInnerHTML = () => (
      <div className='Text'>
        <span className='LineCursor'>
          [{OutputPanel.formatDate(timeStamp)}] MDL@
          {executedNode.name.replaceAll(' ', '-')}:{' '}
        </span>
        <span className='Failed'>
          <RichTextOutputBox
            Element={executedAction.postExecutionFailureText}
          />
        </span>
      </div>
    )

    return { key, renderInnerHTML }
  }

  // inherited
  render(): JSX.Element | null {
    let mission: ClientMission = this.props.mission
    // todo: Fix this
    // let consoleOutputs: Array<IConsoleOutput> = mission.consoleOutputs

    /* -- RENDER -- */

    return (
      <div className='OutputPanel'>
        <div className='BorderBox Disabled'>
          <h3 className='Broken'>Not Available at This Time.</h3>
          <h5 className='Broken'>
            Note: output messages will not appear here.
          </h5>
          <ul className='TextArea'>
            {/* // todo: Fix this */}
            {/* {consoleOutputs.map((consoleOutput: IConsoleOutput) => {
              return (
                <ConsoleOutput output={consoleOutput} key={consoleOutput.key} />
              )
            })} */}
          </ul>
        </div>
      </div>
    )
  }
}
