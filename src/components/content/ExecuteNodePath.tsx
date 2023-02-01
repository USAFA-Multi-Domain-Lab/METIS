import './ExecuteNodePath.scss'
import { MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import { Mission } from '../../modules/missions'
import Notification from '../../modules/notifications'
import Tooltip from './Tooltip'
import { INotifyOptions } from '../AppState'

const ExecuteNodePath = (props: {
  mission: Mission
  selectedNode: MissionNode | null
  notify: (message: string, options: INotifyOptions) => Notification
  consoleOutputs: Array<{ date: number; value: string }>
  setConsoleOutputs: (consoleOutputs: { date: number; value: string }[]) => void
  setActionSelectionPromptIsDisplayed: (
    actionSelectionPromptIsDisplayed: boolean,
  ) => void
  setExecuteNodePathPromptIsDisplayed: (
    executeNodePathPromptIsDisplayed: boolean,
  ) => void
  loadingWidth: number
  setLoadingWidth: (loadingWidth: number) => void
  dateFormatStyle: Intl.DateTimeFormat
}) => {
  let mission: Mission = props.mission
  let selectedNode: MissionNode | null | undefined = props.selectedNode
  let selectedAction: MissionNodeAction | null | undefined =
    selectedNode?.selectedAction
  let processTime: number | undefined =
    props.selectedNode?.selectedAction?.processTime
  let consoleOutputs = props.consoleOutputs
  let setConsoleOutputs = props.setConsoleOutputs
  let setExecuteNodePathPromptIsDisplayed =
    props.setExecuteNodePathPromptIsDisplayed
  let setActionSelectionPromptIsDisplayed =
    props.setActionSelectionPromptIsDisplayed
  let actionName: string | undefined = props.selectedNode?.selectedAction?.name
  let loadingWidth: number = props.loadingWidth
  let setLoadingWidth = props.setLoadingWidth
  let dateFormatStyle: Intl.DateTimeFormat = props.dateFormatStyle
  let executingOutputMessage: string
  let postExecutionSuccessText: string
  let postExecutionFailureText: string

  // console output message variables
  if (
    selectedNode !== null &&
    selectedNode !== undefined &&
    selectedAction !== null &&
    selectedAction !== undefined
  ) {
    executingOutputMessage = `
  <span class='line-cursor'>
  [${dateFormatStyle.format(Date.now())}] 
  MDL@${selectedNode?.name.replaceAll(' ', '-')}: 
  </span>
  
  <span class='default'>
  Started executing ${selectedNode.name}.</br>
  </span>

  <ul class='SelectedActionPropertyList'>
  <li class='SelectedActionProperty'>
  Action selected: ${actionName}
  </li></br>
  <li class='SelectedActionProperty'>
  Time to execute: ${selectedAction.processTime / 1000} second(s)
  </li></br>
  <li class='SelectedActionProperty'>
  Chance of success: ${selectedAction.successChance * 100}%
  </li></br>
  <li class='SelectedActionProperty'>
  Resource cost: ${selectedAction.resourceCost} resource(s)
  </li></br>
  </ul>
  `
    postExecutionSuccessText = `
  <span class='line-cursor'>
  [${dateFormatStyle.format(Date.now())}] 
  MDL@${selectedNode?.name.replaceAll(' ', '-')}: 
  </span>
  
  <span class='succeeded'>
  ${selectedAction?.postExecutionSuccessText}
  </span>
  `
    postExecutionFailureText = `
  <span class='line-cursor'>
  [${dateFormatStyle.format(Date.now())}] 
  MDL@${selectedNode?.name.replaceAll(' ', '-')}: 
  </span>
  <span class='failed'>${selectedAction?.postExecutionFailureText}
  </span>
  `
  }

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setExecuteNodePathPromptIsDisplayed(false)
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
    if (props.selectedNode !== null) {
      let selectedNode: MissionNode = props.selectedNode
      let selectedAction: MissionNodeAction | null = selectedNode.selectedAction
      let resourceCost: number | undefined = selectedAction?.resourceCost

      if (mission.resources > 0 && resourceCost !== undefined) {
        setExecuteNodePathPromptIsDisplayed(false)

        let spendResources: number = mission.resources - resourceCost
        if (spendResources >= 0) {
          consoleOutputs.push({
            date: Date.now(),
            value: executingOutputMessage,
          })

          mission.resources = spendResources
          runLoadingBar()

          selectedAction?.executeAction((success: boolean) => {
            // Output message in the terminal which differs based on whether
            // it passes or fails
            if (success) {
              if (selectedNode.hasChildren && !selectedNode.isOpen) {
                selectedNode.open()
              }

              setConsoleOutputs([
                ...consoleOutputs,
                {
                  date: Date.now(),
                  value: postExecutionSuccessText,
                },
              ])

              selectedAction?.updateWillSucceedArray()
            } else if (!success) {
              setConsoleOutputs([
                ...consoleOutputs,
                {
                  date: Date.now(),
                  value: postExecutionFailureText,
                },
              ])
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

  const selectAlternativeAction = () => {
    if (selectedNode && selectedNode.actions.length > 1) {
      setExecuteNodePathPromptIsDisplayed(false)
      setActionSelectionPromptIsDisplayed(true)
    }
  }

  /* -- RENDER -- */

  // Logic to disable the execute button once a user is out of tokens.
  let executionButtonClassName: string = 'Button ExecutionButton'
  let displayTooltip: boolean = false
  let additionalActionButtonClassName: string = 'Button AdditionalActionButton'

  if (mission.resources <= 0) {
    executionButtonClassName += ' disabled'
    displayTooltip = true
  } else if (selectedNode && selectedNode.actions.length === 1) {
    additionalActionButtonClassName += ' disabled'
  }

  return (
    <div className='ExecuteNodePath'>
      <p className='x' onClick={closeWindow}>
        x
      </p>
      <p className='PromptDisplayText'>
        Do you want to {actionName?.toLowerCase()} {props.selectedNode?.name}?
      </p>
      <ActionPropertyDisplay selectedNode={props.selectedNode} />
      <div className='Buttons'>
        <button
          className={executionButtonClassName}
          onClick={() => {
            execute()
            props.selectedNode?.selectedAction?.updateWillSucceed()
          }}
        >
          EXECUTE ACTION
          {displayTooltip ? (
            <Tooltip
              description={`You cannot ${actionName?.toLowerCase()} because you have no more resources left to spend.`}
            />
          ) : null}
        </button>

        <button
          className={additionalActionButtonClassName}
          onClick={selectAlternativeAction}
        >
          Back
        </button>
      </div>
    </div>
  )
}

export default ExecuteNodePath
