import React, { useState } from 'react'
import './ExecuteNodePath.scss'
import { useStore } from 'react-context-hook'
import { Mission, MissionNode, MissionNodeAction } from '../../modules/missions'
import { IUser } from '../../modules/users'
import gameLogic, { runNodeLoadingBar } from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'
import NodeHoverDisplay from './NodeHoverDisplay'
import NodeActions from './NodeActions'

const ExecuteNodePath = (props: { selectedNode: MissionNode | null }) => {
  /* -- GLOBAL STATE -- */
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
  const [
    nodeActionSelectionPromptIsDisplayed,
    setNodeActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('nodeActionSelectionPromptIsDisplayed')
  const [processDelayTime] = useStore<number>('processDelayTime')
  const [nodeActionItemText] = useStore<string>('nodeActionItemText')
  const [nodeActionSuccessChance, setNodeActionSuccessChance] =
    useStore<number>('nodeActionSuccessChance')
  const [nodeActionItemDisplay, setNodeActionItemDisplay] = useStore<
    Array<MissionNodeAction>
  >('nodeActionItemDisplay')

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

  /* -- COMPONENT FUNCTIONS -- */
  // This forces a rerender of the component.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setExecuteNodePathPromptIsDisplayed(false)
  }

  const execute = () => {
    if (currentUser !== null && props.selectedNode !== null) {
      let username: string = currentUser.userID
      let selectedNode: MissionNode = props.selectedNode

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
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                     <span class="succeeded">${selectedNode.postExecutionSuccessText}</span>`,
            },
          ])
        } else {
          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                    <span class="failed">${selectedNode.postExecutionFailureText}</span>`,
            },
          ])
        }
      })
      runNodeLoadingBar(processDelayTime)
      setNodeActionItemDisplay([])
    }
  }

  const selectAlternativeAction = () => {
    setExecuteNodePathPromptIsDisplayed(false)
    setNodeActionSelectionPromptIsDisplayed(true)
  }

  return (
    <div className='ExecuteNodePath'>
      <p className='x' onClick={closeWindow}>
        x
      </p>
      <p className='PromptDisplayText'>
        Do you want to {nodeActionItemText.toLowerCase()}{' '}
        {props.selectedNode?.name}?
      </p>
      <NodeHoverDisplay selectedNode={props.selectedNode} />
      <div className='Buttons'>
        <button className='ExecutionButton' onClick={execute}>
          {nodeActionItemText}
        </button>
        <button
          className='AdditionalActionButton'
          onClick={selectAlternativeAction}
        >
          Choose another action
        </button>
      </div>
    </div>
  )
}

export default ExecuteNodePath
