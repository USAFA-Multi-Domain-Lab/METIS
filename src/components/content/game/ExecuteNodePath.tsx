import './ExecuteNodePath.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import { Mission } from '../../../modules/missions'
import Notification from '../../../modules/notifications'
import Tooltip from '../communication/Tooltip'
import { INotifyOptions } from '../../AppState'
import { IConsoleOutput } from './ConsoleOutput'

const ExecuteNodePath = (props: {
  isOpen: boolean
  mission: Mission
  selectedNode: MissionNode | null
  notify: (message: string, options: INotifyOptions) => Notification
  outputToConsole: (output: IConsoleOutput) => void
  handleCloseRequest: () => void
  handleGoBackRequest: () => void
  setLoadingWidth: (loadingWidth: number) => void
  setTimeLeft: (timeLeft: number | null) => void
  dateFormatStyle: Intl.DateTimeFormat
}) => {
  let isOpen: boolean = props.isOpen
  let mission: Mission = props.mission
  let selectedNode: MissionNode | null = props.selectedNode
  let selectedAction: MissionNodeAction | null | undefined =
    selectedNode?.selectedAction
  let outputToConsole = props.outputToConsole
  let handleCloseRequest = props.handleCloseRequest
  let handleGoBackRequest = props.handleGoBackRequest
  let setLoadingWidth = props.setLoadingWidth
  let setTimeLeft = props.setTimeLeft
  let dateFormatStyle: Intl.DateTimeFormat = props.dateFormatStyle

  if (selectedNode && selectedAction) {
    /* -- COMPONENT VARIABLES -- */
    let processTime: number = selectedAction.processTime
    let actionName: string = selectedAction.name
    let loadingWidth: number = selectedNode.loadingWidth
    let timeLeft: string | null = selectedNode.timeLeft

    /* -- COMPONENT FUNCTIONS -- */

    // Closes the execution prompt window
    const closeWindow = () => {
      handleCloseRequest()
    }

    const runTimer = () => {
      if (selectedNode && processTime) {
        let timeSpan: number = processTime / 1000
        let minutesLeft: number | string = Math.floor(timeSpan / 60)
        let secondsLeft: number | string = timeSpan % 60

        // Logic that formats the timer
        if (minutesLeft < 10 && secondsLeft < 10) {
          minutesLeft = '0' + minutesLeft.toString()
          secondsLeft = '0' + secondsLeft.toString()
          timeLeft = minutesLeft + ':' + secondsLeft
          selectedNode.timeLeft = timeLeft
          setTimeLeft(timeSpan)
        } else if (minutesLeft > 10 && secondsLeft < 10) {
          secondsLeft = '0' + secondsLeft.toString()
          timeLeft = minutesLeft + ':' + secondsLeft
          selectedNode.timeLeft = timeLeft
          setTimeLeft(timeSpan)
        } else if (minutesLeft < 10 && secondsLeft > 10) {
          minutesLeft = '0' + minutesLeft.toString()
          timeLeft = minutesLeft + ':' + secondsLeft
          selectedNode.timeLeft = timeLeft
          setTimeLeft(timeSpan)
        } else if (minutesLeft < 10) {
          minutesLeft = '0' + minutesLeft.toString()
          timeLeft = minutesLeft + ':' + secondsLeft
          selectedNode.timeLeft = timeLeft
          setTimeLeft(timeSpan)
        } else if (secondsLeft < 10) {
          secondsLeft = '0' + secondsLeft.toString()
          timeLeft = minutesLeft + ':' + secondsLeft
          selectedNode.timeLeft = timeLeft
        } else {
          timeLeft = minutesLeft + ':' + secondsLeft
          selectedNode.timeLeft = timeLeft
          setTimeLeft(timeSpan)
        }

        // Initializes the interval at which it will take
        // to execute a node
        let timerSpeed = processTime / 1000
        let timePace = processTime / timerSpeed
        let timerDuration = setInterval(timer, timePace)

        function timer() {
          if (selectedNode) {
            if (timeSpan <= 0) {
              clearInterval(timerDuration)
              selectedNode.timeLeft = '0'
              setTimeLeft(0)
            } else {
              timeSpan--
              minutesLeft = Math.floor(timeSpan / 60)
              secondsLeft = timeSpan % 60

              // Logic that formats the timer
              if (minutesLeft < 10 && secondsLeft < 10) {
                minutesLeft = '0' + minutesLeft.toString()
                secondsLeft = '0' + secondsLeft.toString()
                timeLeft = minutesLeft + ':' + secondsLeft
                selectedNode.timeLeft = timeLeft
                setTimeLeft(timeSpan)
              } else if (minutesLeft > 10 && secondsLeft < 10) {
                secondsLeft = '0' + secondsLeft.toString()
                timeLeft = minutesLeft + ':' + secondsLeft
                selectedNode.timeLeft = timeLeft
                setTimeLeft(timeSpan)
              } else if (minutesLeft < 10 && secondsLeft > 10) {
                minutesLeft = '0' + minutesLeft.toString()
                timeLeft = minutesLeft + ':' + secondsLeft
                selectedNode.timeLeft = timeLeft
                setTimeLeft(timeSpan)
              } else if (minutesLeft < 10) {
                minutesLeft = '0' + minutesLeft.toString()
                timeLeft = minutesLeft + ':' + secondsLeft
                selectedNode.timeLeft = timeLeft
                setTimeLeft(timeSpan)
              } else if (secondsLeft < 10) {
                secondsLeft = '0' + secondsLeft.toString()
                timeLeft = minutesLeft + ':' + secondsLeft
                selectedNode.timeLeft = timeLeft
              } else {
                timeLeft = minutesLeft + ':' + secondsLeft
                selectedNode.timeLeft = timeLeft
                setTimeLeft(timeSpan)
              }
            }
          }
        }
      }
    }

    // Creates an interval to visually display the loading bar's progress
    const runLoadingBar = () => {
      if (selectedNode && processTime && selectedNode.timeLeft !== null) {
        let loadingDuration = setInterval(loadingBar, processTime / 100)

        function loadingBar() {
          if (selectedNode) {
            if (loadingWidth >= 100) {
              clearInterval(loadingDuration)
              selectedNode.loadingWidth = 0
              setLoadingWidth(0)
            } else {
              loadingWidth++
              selectedNode.loadingWidth = loadingWidth
              setLoadingWidth(loadingWidth)
            }
          }
        }
      }
    }

    const execute = () => {
      if (
        props.selectedNode !== null &&
        props.selectedNode.selectedAction !== null
      ) {
        let selectedNode: MissionNode = props.selectedNode
        let selectedAction: MissionNodeAction =
          props.selectedNode.selectedAction
        let resourceCost: number | undefined = selectedAction.resourceCost

        if (mission.resources > 0 && resourceCost !== undefined) {
          closeWindow()

          let spendResources: number = mission.resources - resourceCost

          if (spendResources >= 0) {
            mission.resources = spendResources
            outputToConsole({
              date: Date.now(),
              elements: (
                <div className='Text'>
                  <span className='line-cursor'>
                    [{dateFormatStyle.format(Date.now())}] MDL@
                    {selectedNode.name.replaceAll(' ', '-')}:{' '}
                  </span>
                  <span className='default'>
                    Started executing {selectedNode.name}.<br></br>
                  </span>
                  <ul className='SelectedActionPropertyList'>
                    <li className='SelectedActionProperty'>
                      Action selected: {actionName}
                    </li>
                    <br></br>
                    <li className='SelectedActionProperty'>
                      Time to execute: {selectedAction.processTime / 1000}{' '}
                      second(s)
                    </li>
                    <br></br>
                    <li className='SelectedActionProperty'>
                      Chance of success: {selectedAction.successChance * 100}%
                    </li>
                    <br></br>
                    <li className='SelectedActionProperty'>
                      Resource cost: {selectedAction.resourceCost} resource(s)
                    </li>
                    <br></br>
                    {/* <li className='SelectedActionProperty'>
                      Time remaining: {timeLeft} second(s)
                    </li>
                    <br></br> */}
                  </ul>
                </div>
              ),
            })

            runTimer()
            runLoadingBar()

            selectedAction.executeAction((success: boolean) => {
              // Output message in the terminal which differs based on whether
              // it passes or fails
              if (success) {
                if (selectedNode.hasChildren && !selectedNode.isOpen) {
                  selectedNode.open()
                }

                outputToConsole({
                  date: Date.now(),
                  elements: (
                    <div className='Text'>
                      <span className='line-cursor'>
                        [{dateFormatStyle.format(Date.now())}] MDL@
                        {selectedNode.name.replaceAll(' ', '-')}:{' '}
                      </span>
                      <span className='succeeded'>
                        {selectedAction.postExecutionSuccessText}
                      </span>
                    </div>
                  ),
                })

                selectedAction.updateWillSucceedArray()
              } else if (!success) {
                outputToConsole({
                  date: Date.now(),
                  elements: (
                    <div className='Text'>
                      <span className='line-cursor'>
                        [{dateFormatStyle.format(Date.now())}] MDL@
                        {selectedNode.name.replaceAll(' ', '-')}:{' '}
                      </span>
                      <span className='failed'>
                        {selectedAction.postExecutionFailureText}
                      </span>
                    </div>
                  ),
                })

                selectedAction.updateWillSucceedArray()
              }
            })
          } else {
            props.notify(
              `You don't have enough resources left to spend on ${selectedNode.name}.`,
              { duration: 3500 },
            )
          }
        } else if (resourceCost === undefined) {
          console.error(`The selected action's resource cost is undefined.`)
        } else {
          props.notify(`You have no more resources to spend.`, {})
        }
      }
    }

    /* -- RENDER -- */

    // Logic to disable the execute button once a user is out of tokens.
    let className: string = 'ExecuteNodePath'
    let executionButtonClassName: string = 'Button ExecutionButton'
    let displayTooltip: boolean = false
    let additionalActionButtonClassName: string =
      'Button AdditionalActionButton'

    if (!isOpen) {
      className += ' Hidden'
    }

    if (mission.resources <= 0) {
      executionButtonClassName += ' disabled'
      displayTooltip = true
    } else if (selectedNode && selectedNode.actions.length === 1) {
      additionalActionButtonClassName += ' disabled'
    }

    return (
      <div className={className}>
        <p className='x' onClick={closeWindow}>
          x
        </p>
        <p className='PromptDisplayText'>
          Do you want to {actionName.toLowerCase()} {selectedNode.name}?
        </p>
        <ActionPropertyDisplay selectedNode={props.selectedNode} />
        <div className='Buttons'>
          <button
            className={executionButtonClassName}
            onClick={() => {
              execute()
              selectedAction?.updateWillSucceed()
            }}
          >
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
  } else {
    return null
  }
}

export default ExecuteNodePath
