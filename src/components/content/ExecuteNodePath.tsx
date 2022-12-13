import './ExecuteNodePath.scss'
import { MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import gameLogic, { runNodeLoadingBar } from '../../modules/game-logic'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import { Mission } from '../../modules/missions'
import Notification from '../../modules/notifications'
import Tooltip from './Tooltip'

const ExecuteNodePath = (props: {
  mission: Mission
  selectedNode: MissionNode | null
  notify: (message: string, duration?: number | null) => Notification
  consoleOutputs: Array<{ date: number; value: string }>
  setConsoleOutputs: (consoleOutputs: { date: number; value: string }[]) => void
  setActionSelectionPromptIsDisplayed: (
    actionSelectionPromptIsDisplayed: boolean,
  ) => void
  setExecuteNodePathPromptIsDisplayed: (
    executeNodePathPromptIsDisplayed: boolean,
  ) => void
  processTime: number
}) => {
  let mission: Mission = props.mission
  let selectedNode: MissionNode | null | undefined = props.selectedNode
  const consoleOutputs = props.consoleOutputs
  const setConsoleOutputs = props.setConsoleOutputs
  const setExecuteNodePathPromptIsDisplayed =
    props.setExecuteNodePathPromptIsDisplayed
  const setActionSelectionPromptIsDisplayed =
    props.setActionSelectionPromptIsDisplayed

  const processTime = props.processTime

  let actionName: string | undefined = props.selectedNode?.selectedAction?.name

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setExecuteNodePathPromptIsDisplayed(false)
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

          selectedNode.execute((success: boolean) => {
            // Output message in the terminal which differs based on whether
            // it passes or fails
            if (
              success &&
              selectedAction?.postExecutionSuccessText !== '' &&
              selectedAction?.postExecutionSuccessText !== null
            ) {
              gameLogic.handleNodeSelection(selectedNode)

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
            } else if (
              !success &&
              selectedAction?.postExecutionFailureText !== '' &&
              selectedAction?.postExecutionFailureText !== null
            ) {
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
            }
          })
        } else {
          props.notify(
            `You don't have enough resources left to spend on ${selectedNode.name}.`,
            3500,
          )
        }
        runNodeLoadingBar(processTime)
      } else if (resourceCost === undefined) {
        console.error(`The selected action's resource cost is undefined.`)
      } else {
        props.notify(`You have no more resources to spend.`)
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
        <button className={executionButtonClassName} onClick={execute}>
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
