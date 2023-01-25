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
}) => {
  let mission: Mission = props.mission
  let selectedNode: MissionNode | null | undefined = props.selectedNode
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
                  value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                    ' ',
                    '-',
                  )}: </span>
                     <span class="succeeded">${
                       selectedAction?.postExecutionSuccessText
                     }</span>`,
                },
              ])

              selectedAction?.updateWillSucceedArray()
            } else if (!success) {
              setConsoleOutputs([
                ...consoleOutputs,
                {
                  date: Date.now(),
                  value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                    ' ',
                    '-',
                  )}: </span>
                    <span class="failed">${
                      selectedAction?.postExecutionFailureText
                    }</span>`,
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
  let gridTemplateColumns: string = 'auto auto'
  let gridTemplateRows: string = 'none'

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
    <div className='ExecuteNodePath'>
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
          onClick={selectAlternativeAction}
        >
          Choose another action
        </button>
      </div>
    </div>
  )
}

export default ExecuteNodePath
