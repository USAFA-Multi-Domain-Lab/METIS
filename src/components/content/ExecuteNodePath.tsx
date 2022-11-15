import './ExecuteNodePath.scss'
import { useStore } from 'react-context-hook'
import { MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import gameLogic, { runNodeLoadingBar } from '../../modules/game-logic'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import { IPageProps } from '../App'
import { Mission } from '../../modules/missions'
import Notification from '../../modules/notifications'

const ExecuteNodePath = (props: {
  mission: Mission
  selectedNode: MissionNode | null
  notify: (message: string, duration: number | null) => Notification
}) => {
  let mission: Mission = props.mission

  /* -- GLOBAL STATE -- */
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
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

      if (mission.tokens > 0) {
        setExecuteNodePathPromptIsDisplayed(false)

        selectedNode.execute((success: boolean) => {
          // Output message in the terminal which differs based on whether
          // it passes or fails

          if (success) {
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
                       selectedNode.postExecutionSuccessText
                     }</span>`,
              },
            ])
          } else {
            setConsoleOutputs([
              ...consoleOutputs,
              {
                date: Date.now(),
                value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                  ' ',
                  '-',
                )}: </span>
                    <span class="failed">${
                      selectedNode.postExecutionFailureText
                    }</span>`,
              },
            ])
          }
        })
        runNodeLoadingBar(processTime)
        setActionDisplay([])
        mission.tokens--
      } else {
        props.notify(`You have no more tokens to spend.`, 3000)
      }
    }
  }

  const selectAlternativeAction = () => {
    setExecuteNodePathPromptIsDisplayed(false)
    setActionSelectionPromptIsDisplayed(true)
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
        <button className='Button ExecutionButton' onClick={execute}>
          {actionName}
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
