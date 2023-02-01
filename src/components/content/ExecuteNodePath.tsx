import './ExecuteNodePath.scss'
import { MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import { Mission } from '../../modules/missions'
import Notification from '../../modules/notifications'
import Tooltip from './Tooltip'
import { INotifyOptions } from '../AppState'
import { IConsoleOutput } from './ConsoleOutput'

const ExecuteNodePath = (props: {
  isOpen: boolean
  mission: Mission
  selectedNode: MissionNode | null
  notify: (message: string, options: INotifyOptions) => Notification
  outputToConsole: (output: IConsoleOutput) => void
  handleCloseRequest: () => void
  handleGoBackRequest: () => void
  loadingWidth: number
  setLoadingWidth: (loadingWidth: number) => void
}) => {
  let isOpen: boolean = props.isOpen
  let mission: Mission = props.mission
  let selectedNode: MissionNode | null = props.selectedNode
  let processTime: number | undefined =
    props.selectedNode?.selectedAction?.processTime
  let outputToConsole = props.outputToConsole
  let handleCloseRequest = props.handleCloseRequest
  let handleGoBackRequest = props.handleGoBackRequest
  let actionName: string | undefined = props.selectedNode?.selectedAction?.name
  let loadingWidth: number = props.loadingWidth
  let setLoadingWidth = props.setLoadingWidth

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    handleCloseRequest()
  }

  // Creates an interval to visually display the loading bar's progress
  const runLoadingBar = (): void => {
    if (processTime !== undefined) {
      let loadingDuration = setInterval(loadingBar, processTime / 100)

      function loadingBar() {
        if (loadingWidth >= 100) {
          clearInterval(loadingDuration)
          setLoadingWidth(0)
        } else {
          loadingWidth++
          setLoadingWidth(loadingWidth)
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
      let selectedAction: MissionNodeAction = props.selectedNode.selectedAction
      let resourceCost: number | undefined = selectedAction.resourceCost

      if (mission.resources > 0 && resourceCost !== undefined) {
        closeWindow()

        let spendResources: number = mission.resources - resourceCost

        if (spendResources >= 0) {
          mission.resources = spendResources
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
                value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                  ' ',
                  '-',
                )}: </span>
                     <span class="succeeded">${
                       selectedAction.postExecutionSuccessText
                     }</span>`,
              })

              selectedAction?.updateWillSucceedArray()
            } else if (!success) {
              outputToConsole({
                date: Date.now(),
                value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                  ' ',
                  '-',
                )}: </span>
                    <span class="failed">${
                      selectedAction.postExecutionFailureText
                    }</span>`,
              })
              selectedAction?.updateWillSucceedArray()
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
  let additionalActionButtonClassName: string = 'Button AdditionalActionButton'
  let gridTemplateColumns: string = 'auto auto'
  let gridTemplateRows: string = 'none'

  if (!isOpen) {
    className += ' Hidden'
  }

  if (mission.resources <= 0) {
    executionButtonClassName += ' disabled'
    displayTooltip = true
  } else if (selectedNode && selectedNode.actions.length === 1) {
    additionalActionButtonClassName += ' disabled'
  }

  if (actionName && actionName?.length >= 15) {
    gridTemplateColumns = 'none'
    gridTemplateRows = 'auto auto'
  }

  return (
    <div className={className}>
      <p className='x' onClick={closeWindow}>
        x
      </p>
      <p className='PromptDisplayText'>
        Do you want to {actionName?.toLowerCase()} {props.selectedNode?.name}?
      </p>
      <ActionPropertyDisplay selectedNode={props.selectedNode} />
      <div
        className='Buttons'
        style={{
          gridTemplateColumns: `${gridTemplateColumns}`,
          gridTemplateRows: `${gridTemplateRows}`,
          placeContent: 'start',
        }}
      >
        <button
          className={executionButtonClassName}
          onClick={() => {
            execute()
            props.selectedNode?.selectedAction?.updateWillSucceed()
          }}
        >
          {actionName}
          {displayTooltip ? (
            <Tooltip
              description={`You cannot ${actionName?.toLowerCase()} because you have no more resources left to spend.`}
            />
          ) : null}
        </button>

        <button
          className={additionalActionButtonClassName}
          onClick={handleGoBackRequest}
        >
          Choose another action
        </button>
      </div>
    </div>
  )
}

export default ExecuteNodePath
