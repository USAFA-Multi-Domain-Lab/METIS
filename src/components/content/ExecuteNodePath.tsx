import './ExecuteNodePath.scss'
import { useStore } from 'react-context-hook'
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
}) => {
  let mission: Mission = props.mission

  /* -- GLOBAL STATE -- */
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string | null }>>('consoleOutputs')
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
  const [
    actionSelectionPromptIsDisplayed,
    setActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('actionSelectionPromptIsDisplayed')
  const [processTime] = useStore<number>('processTime')
  const [actionName] = useStore<string>('actionName')
  const [actionDisplay, setActionDisplay] =
    useStore<Array<MissionNodeAction>>('actionDisplay')

  /* -- COMPONENT STATE -- */

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setExecuteNodePathPromptIsDisplayed(false)
    setActionDisplay([])
  }

  const execute = () => {
    if (props.selectedNode !== null) {
      let selectedNode: MissionNode = props.selectedNode
      let selectedAction: MissionNodeAction | null = selectedNode.selectedAction
      let resourceCost: number | undefined = selectedAction?.resourceCost

      if (mission.resources > 0 && resourceCost !== undefined) {
        setExecuteNodePathPromptIsDisplayed(false)

        selectedNode.execute((success: boolean) => {
          // Output message in the terminal which differs based on whether
          // it passes or fails
          if (success && selectedAction?.postExecutionSuccessText !== '') {
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
            success &&
            selectedAction?.postExecutionSuccessText === ''
          ) {
            gameLogic.handleNodeSelection(selectedNode)

            setConsoleOutputs([
              ...consoleOutputs,
              {
                date: Date.now(),
                value: null,
              },
            ])
          } else if (
            !success &&
            selectedAction?.postExecutionFailureText !== ''
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
          } else {
            setConsoleOutputs([
              ...consoleOutputs,
              {
                date: Date.now(),
                value: null,
              },
            ])
          }
        })
        runNodeLoadingBar(processTime)
        setActionDisplay([])
        let spendResources: number = mission.resources - resourceCost
        mission.resources = spendResources
      } else if (resourceCost === undefined) {
        console.error(`The selected action's resource cost is undefined.`)
      } else {
        props.notify(`You have no more resources to spend.`)
      }
    }
  }

  const selectAlternativeAction = () => {
    setExecuteNodePathPromptIsDisplayed(false)
    setActionSelectionPromptIsDisplayed(true)
  }

  /* -- RENDER -- */

  // Logic to disable the execute button once a user is out of tokens.
  let executionButtonClassName: string = 'Button ExecutionButton'
  let displayTooltip: boolean = false

  if (mission.resources <= 0) {
    executionButtonClassName += ' disabled'
    displayTooltip = true
  }

  return (
    <div className='ExecuteNodePath'>
      <p className='x' onClick={closeWindow}>
        x
      </p>
      <p className='PromptDisplayText'>
        Do you want to {actionName.toLowerCase()} {props.selectedNode?.name}?
      </p>
      <ActionPropertyDisplay selectedNode={props.selectedNode} />
      <div className='Buttons'>
        <button className={executionButtonClassName} onClick={execute}>
          {actionName}
          {displayTooltip ? (
            <Tooltip
              description={`You cannot ${actionName.toLowerCase()} because you have no more resources left to spend.`}
            />
          ) : null}
        </button>

        <button
          className='Button AdditionalActionButton'
          onClick={selectAlternativeAction}
        >
          Choose another action
        </button>
      </div>
    </div>
  )
}

export default ExecuteNodePath
