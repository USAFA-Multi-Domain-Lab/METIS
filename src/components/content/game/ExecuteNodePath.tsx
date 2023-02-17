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

  componentWillUnmount(): void {}

  // Closes the execution prompt window
  closeWindow = () => {
    this.props.handleCloseRequest()
  }

  // Creates an interval to visually display the time remianing to execute
  // the
  //   runTimer = () => {
  //     let selectedNode: MissionNode = this.selectedNode
  //     let selectedAction: MissionNodeAction = this.props.selectedAction
  //     let processTime: number = selectedAction.processTime
  //     let timeLeft: string | null = selectedNode.timeLeft
  //     let startTime: number = Date.now()
  //     let endTime: number = startTime + processTime
  //     let timeSpan: number = endTime - startTime
  //     let minutesLeft: number | string = Math.floor(timeSpan / 1000 / 60)
  //     let secondsLeft: number | string = Math.floor((timeSpan / 1000) % 60)
  //
  //     // Logic that formats the timer
  //     if (minutesLeft < 10 && secondsLeft < 10) {
  //       minutesLeft = '0' + minutesLeft.toString()
  //       secondsLeft = '0' + secondsLeft.toString()
  //       timeLeft = minutesLeft + ':' + secondsLeft
  //       selectedNode.timeLeft = timeLeft
  //     } else if (minutesLeft > 10 && secondsLeft < 10) {
  //       secondsLeft = '0' + secondsLeft.toString()
  //       timeLeft = minutesLeft + ':' + secondsLeft
  //       selectedNode.timeLeft = timeLeft
  //     } else if (minutesLeft < 10 && secondsLeft > 10) {
  //       minutesLeft = '0' + minutesLeft.toString()
  //       timeLeft = minutesLeft + ':' + secondsLeft
  //       selectedNode.timeLeft = timeLeft
  //     } else if (minutesLeft < 10) {
  //       minutesLeft = '0' + minutesLeft.toString()
  //       timeLeft = minutesLeft + ':' + secondsLeft
  //       selectedNode.timeLeft = timeLeft
  //     } else if (secondsLeft < 10) {
  //       secondsLeft = '0' + secondsLeft.toString()
  //       timeLeft = minutesLeft + ':' + secondsLeft
  //       selectedNode.timeLeft = timeLeft
  //     } else {
  //       timeLeft = minutesLeft + ':' + secondsLeft
  //       selectedNode.timeLeft = timeLeft
  //     }
  //
  //     // Initializes the interval at which it will take
  //     // to execute a node
  //     let timerIntervalID: any = setInterval(timer, 900)
  //
  //     function timer() {
  //       if (timeSpan <= 0) {
  //         clearInterval(timerIntervalID)
  //       } else {
  //         let currentTime: number = Date.now()
  //         timeSpan = endTime - currentTime
  //         minutesLeft = Math.floor(timeSpan / 1000 / 60)
  //         secondsLeft = Math.floor((timeSpan / 1000) % 60)
  //
  //         // Logic that formats the timer
  //         if (minutesLeft > 0 || secondsLeft > 0) {
  //           if (minutesLeft < 10 && secondsLeft < 10) {
  //             minutesLeft = '0' + minutesLeft.toString()
  //             secondsLeft = '0' + secondsLeft.toString()
  //             timeLeft = minutesLeft + ':' + secondsLeft
  //             selectedNode.timeLeft = timeLeft
  //           } else if (minutesLeft > 10 && secondsLeft < 10) {
  //             secondsLeft = '0' + secondsLeft.toString()
  //             timeLeft = minutesLeft + ':' + secondsLeft
  //             selectedNode.timeLeft = timeLeft
  //           } else if (minutesLeft < 10 && secondsLeft > 10) {
  //             minutesLeft = '0' + minutesLeft.toString()
  //             timeLeft = minutesLeft + ':' + secondsLeft
  //             selectedNode.timeLeft = timeLeft
  //           } else if (minutesLeft < 10) {
  //             minutesLeft = '0' + minutesLeft.toString()
  //             timeLeft = minutesLeft + ':' + secondsLeft
  //             selectedNode.timeLeft = timeLeft
  //           } else if (secondsLeft < 10) {
  //             secondsLeft = '0' + secondsLeft.toString()
  //             timeLeft = minutesLeft + ':' + secondsLeft
  //             selectedNode.timeLeft = timeLeft
  //           } else {
  //             timeLeft = minutesLeft + ':' + secondsLeft
  //             selectedNode.timeLeft = timeLeft
  //           }
  //         } else {
  //           selectedNode.timeLeft = '00:00'
  //         }
  //       }
  //     }
  //   }

  // Creates an interval to visually display the loading bar's progress
  //   runLoadingBar = () => {
  //     let selectedNode: MissionNode = this.selectedNode
  //     let selectedAction: MissionNodeAction = this.props.selectedAction
  //     let processTime: number = selectedAction.processTime
  //     let loadingWidth: number = selectedNode.loadingWidth
  //
  //     if (processTime && selectedNode?.timeLeft !== null) {
  //       let loadingBarIntervalID: any = setInterval(loadingBar, processTime / 100)
  //
  //       function loadingBar() {
  //         if (selectedNode) {
  //           if (loadingWidth >= 100) {
  //             clearInterval(loadingBarIntervalID)
  //             selectedNode.loadingWidth = 0
  //           } else {
  //             loadingWidth++
  //             selectedNode.loadingWidth = loadingWidth
  //           }
  //         }
  //       }
  //     }
  //   }

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
    let mission: Mission = this.mission
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
      executionButtonClassName += ' disabled'
      displayTooltip = true
    }
    if (selectedNode.actions.length === 1) {
      additionalActionButtonClassName += ' disabled'
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
          <button
            className={executionButtonClassName}
            onClick={() => {
              this.execute()
              selectedAction.updateWillSucceed()
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
  }
}

// const ExecuteNodePath = (props: IExecuteNodePath) => {
//     /* -- COMPONENT VARIABLES -- */
//     let mission: Mission = props.mission
//     let selectedNode: MissionNode | null = props.selectedNode
//     let selectedAction: MissionNodeAction | null | undefined =
//       selectedNode?.selectedAction
//     let isOpen: boolean = props.isOpen
//     let dateFormatStyle: Intl.DateTimeFormat = props.dateFormatStyle
//     let timerIntervalIDArray = props.timerIntervalIDArray
//     let loadingBarIntervalIDArray = props.loadingBarIntervalIDArray
//     let outputToConsole = props.outputToConsole
//     let handleCloseRequest = props.handleCloseRequest
//     let handleGoBackRequest = props.handleGoBackRequest
//     let notify = props.notify
//     let setLoadingWidth = props.setLoadingWidth
//         let executingOutputText: string
//     let executionTimerText: string
//     let postExecutionSuccessText: string
//     let postExecutionFailureText: string

//     if (
//       selectedNode &&
//       selectedNode !== null &&
//       selectedAction &&
//       selectedAction !== null
//     ) {
//       /* -- COMPONENT VARIABLES -- */
//       let timeLeft: string | null = selectedNode.timeLeft
//       let loadingWidth: number = selectedNode.loadingWidth
//       let actionName: string = selectedAction.name
//       let processTime: number = selectedAction.processTime
//       let successChance: number = selectedAction.successChance
//       let resourceCost: number = selectedAction.resourceCost

//       /* -- COMPONENT FUNCTIONS -- */

//       // Closes the execution prompt window
//       const closeWindow = () => {
//         handleCloseRequest()
//       }

//       const setExecutingOutputText = (date: number): string => {
//         executingOutputText = `
//         <div class='Text'>
//           <span class='line-cursor'>
//             [${dateFormatStyle.format(date)}] MDL@
//             ${selectedNode?.name.replaceAll(' ', '-')}:
//           </span>
//           <span class='default'>
//             Started executing ${selectedNode?.name}.<br></br>
//           </span>
//           <ul class='SelectedActionPropertyList'>
//             <li class='SelectedActionProperty'>
//               Action selected: ${actionName}
//             </li>
//             </br>
//             <li class='SelectedActionProperty'>
//               Time to execute: ${(processTime as number) / 1000}
//               second(s)
//             </li>
//             </br>
//             <li class='SelectedActionProperty'>
//               Chance of success:
//               ${(successChance as number) * 100}%
//             </li>
//             </br>
//             <li class='SelectedActionProperty'>
//               Resource cost: ${resourceCost} resource(s)
//             </li>
//             </br>
//           </ul>
//         </div>
//       `

//         return executingOutputText
//       }

//       const setPostExecutionSuccessText = (date: number): string => {
//         postExecutionSuccessText = `
//         <div class='Text'>
//           <span class='line-cursor'>
//             [${dateFormatStyle.format(date)}] MDL@
//             ${selectedNode?.name.replaceAll(' ', '-')}:
//           </span>
//           <span class='succeeded'>
//             ${selectedAction?.postExecutionSuccessText}
//           </span>
//         </div>
//         `

//         return postExecutionSuccessText
//       }

//       const setPostExecutionFailureText = (date: number): string => {
//         postExecutionFailureText = `
//         <div class='Text'>
//           <span class='line-cursor'>
//             [${dateFormatStyle.format(date)}] MDL@
//             ${selectedNode?.name.replaceAll(' ', '-')}:
//           </span>
//           <span class='failed'>
//             ${selectedAction?.postExecutionFailureText}
//           </span>
//         </div>
//         `

//         return postExecutionFailureText
//       }

//       // Creates an interval to visually display the time remianing to execute
//       // the
//       const runTimer = () => {
//         if (selectedNode && processTime) {
//           let startTime: number = Date.now()
//           let endTime: number = startTime + processTime
//           let timeSpan: number = endTime - startTime
//           let minutesLeft: number | string = Math.floor(timeSpan / 1000 / 60)
//           let secondsLeft: number | string = Math.floor((timeSpan / 1000) % 60)

//           // Logic that formats the timer
//           if (minutesLeft < 10 && secondsLeft < 10) {
//             minutesLeft = '0' + minutesLeft.toString()
//             secondsLeft = '0' + secondsLeft.toString()
//             timeLeft = minutesLeft + ':' + secondsLeft
//             selectedNode.timeLeft = timeLeft
//           } else if (minutesLeft > 10 && secondsLeft < 10) {
//             secondsLeft = '0' + secondsLeft.toString()
//             timeLeft = minutesLeft + ':' + secondsLeft
//             selectedNode.timeLeft = timeLeft
//           } else if (minutesLeft < 10 && secondsLeft > 10) {
//             minutesLeft = '0' + minutesLeft.toString()
//             timeLeft = minutesLeft + ':' + secondsLeft
//             selectedNode.timeLeft = timeLeft
//           } else if (minutesLeft < 10) {
//             minutesLeft = '0' + minutesLeft.toString()
//             timeLeft = minutesLeft + ':' + secondsLeft
//             selectedNode.timeLeft = timeLeft
//           } else if (secondsLeft < 10) {
//             secondsLeft = '0' + secondsLeft.toString()
//             timeLeft = minutesLeft + ':' + secondsLeft
//             selectedNode.timeLeft = timeLeft
//           } else {
//             timeLeft = minutesLeft + ':' + secondsLeft
//             selectedNode.timeLeft = timeLeft
//           }

//           // Initializes the interval at which it will take
//           // to execute a node
//           let timerIntervalID: any = setInterval(timer, 900)
//           timerIntervalIDArray.push(timerIntervalID)

//           function timer() {
//             if (selectedNode) {
//               if (timeSpan <= 0) {
//                 clearInterval(timerIntervalID)
//               } else {
//                 let currentTime: number = Date.now()
//                 timeSpan = endTime - currentTime
//                 minutesLeft = Math.floor(timeSpan / 1000 / 60)
//                 secondsLeft = Math.floor((timeSpan / 1000) % 60)

//                 console.log(selectedNode.timeLeft)

//                 // Logic that formats the timer
//                 if (minutesLeft > 0 || secondsLeft > 0) {
//                   if (minutesLeft < 10 && secondsLeft < 10) {
//                     minutesLeft = '0' + minutesLeft.toString()
//                     secondsLeft = '0' + secondsLeft.toString()
//                     timeLeft = minutesLeft + ':' + secondsLeft
//                     selectedNode.timeLeft = timeLeft
//                   } else if (minutesLeft > 10 && secondsLeft < 10) {
//                     secondsLeft = '0' + secondsLeft.toString()
//                     timeLeft = minutesLeft + ':' + secondsLeft
//                     selectedNode.timeLeft = timeLeft
//                   } else if (minutesLeft < 10 && secondsLeft > 10) {
//                     minutesLeft = '0' + minutesLeft.toString()
//                     timeLeft = minutesLeft + ':' + secondsLeft
//                     selectedNode.timeLeft = timeLeft
//                   } else if (minutesLeft < 10) {
//                     minutesLeft = '0' + minutesLeft.toString()
//                     timeLeft = minutesLeft + ':' + secondsLeft
//                     selectedNode.timeLeft = timeLeft
//                   } else if (secondsLeft < 10) {
//                     secondsLeft = '0' + secondsLeft.toString()
//                     timeLeft = minutesLeft + ':' + secondsLeft
//                     selectedNode.timeLeft = timeLeft
//                   } else {
//                     timeLeft = minutesLeft + ':' + secondsLeft
//                     selectedNode.timeLeft = timeLeft
//                   }
//                 } else {
//                   selectedNode.timeLeft = '00:00'
//                 }
//               }
//             }
//           }
//         }
//       }

//       // Creates an interval to visually display the loading bar's progress
//       const runLoadingBar = () => {
//         if (processTime && selectedNode?.timeLeft !== null) {
//           let loadingBarIntervalID: any = setInterval(
//             loadingBar,
//             processTime / 100,
//           )
//           loadingBarIntervalIDArray.push(loadingBarIntervalID)

//           function loadingBar() {
//             if (selectedNode) {
//               if (loadingWidth >= 100) {
//                 clearInterval(loadingBarIntervalID)
//                 selectedNode.loadingWidth = 0
//                 setLoadingWidth(0)
//               } else {
//                 loadingWidth++
//                 selectedNode.loadingWidth = loadingWidth
//                 setLoadingWidth(loadingWidth)
//               }
//             }
//           }
//         }
//       }

//       const execute = () => {
//         if (
//           mission.resources > 0 &&
//           resourceCost !== undefined &&
//           selectedNode
//         ) {
//           closeWindow()

//           let spendResources: number = mission.resources - resourceCost

//           if (spendResources >= 0) {
//             mission.resources = spendResources
//             outputToConsole({
//               date: Date.now(),
//               elements: setExecutingOutputText(Date.now()),
//               nodeID: selectedNode.nodeID,
//             })

//             runTimer()
//             runLoadingBar()

//             let date = Date.now() * 7
//             outputToConsole({
//               date: date,
//               elements: executionTimerText,
//               nodeID: selectedNode.nodeID,
//             })

//             selectedAction?.executeAction((success: boolean) => {
//               if (selectedNode && selectedAction) {
//                 // Output message in the terminal which differs based on whether
//                 // it passes or fails
//                 if (success) {
//                   if (selectedNode.hasChildren && !selectedNode.isOpen) {
//                     selectedNode.open()
//                   }

//                   outputToConsole({
//                     date: Date.now(),
//                     elements: setPostExecutionSuccessText(Date.now()),
//                     nodeID: selectedNode.nodeID,
//                   })

//                   selectedAction.updateWillSucceedArray()
//                 } else if (!success) {
//                   outputToConsole({
//                     date: Date.now(),
//                     elements: setPostExecutionFailureText(Date.now()),
//                     nodeID: selectedNode.nodeID,
//                   })

//                   selectedAction.updateWillSucceedArray()
//                 }
//               }
//             })
//           } else {
//             notify(
//               `You don't have enough resources left to spend on ${selectedNode.name}.`,
//               { duration: 3500 },
//             )
//           }
//         } else if (resourceCost === undefined) {
//           console.error(`The selected action's resource cost is undefined.`)
//         } else {
//           notify(`You have no more resources to spend.`, {})
//         }
//       }

//       /* -- RENDER -- */

//           // Logic to disable the execute button once a user is out of tokens.
//     let className: string = 'ExecuteNodePath'
//     let executionButtonClassName: string = 'Button ExecutionButton'
//     let displayTooltip: boolean = false
//     let additionalActionButtonClassName: string =
//       'Button AdditionalActionButton'

//       if (!isOpen) {
//         className += ' Hidden'
//       }

//       if (mission.resources <= 0) {
//         executionButtonClassName += ' disabled'
//         displayTooltip = true
//       } else if (selectedNode.actions.length === 1) {
//         additionalActionButtonClassName += ' disabled'
//       }

//       return (
//         <div className={className}>
//           <p className='x' onClick={closeWindow}>
//             x
//           </p>
//           <p className='PromptDisplayText'>
//             Do you want to {actionName?.toLowerCase()} {selectedNode.name}?
//           </p>
//           <ActionPropertyDisplay selectedNode={selectedNode} />
//           <div className='Buttons'>
//             <button
//               className={executionButtonClassName}
//               onClick={() => {
//                 execute()
//                 selectedAction?.updateWillSucceed()
//               }}
//             >
//               EXECUTE ACTION
//               {displayTooltip ? (
//                 <Tooltip
//                   description={`You cannot ${actionName?.toLowerCase()} because you have no more resources left to spend.`}
//                 />
//               ) : null}
//             </button>

//             <button
//               className={additionalActionButtonClassName}
//               onClick={handleGoBackRequest}
//             >
//               Back
//             </button>
//           </div>
//         </div>
//       )
//     } else {
//       return null
//     }
//   }
// }

// export default ExecuteNodePath
