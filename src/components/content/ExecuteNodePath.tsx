import React, { useState } from 'react'
import './ExecuteNodePath.scss'
import { useStore } from 'react-context-hook'
import { MissionNode } from '../../modules/missions'
import { IUser } from '../../modules/users'
import gameLogic from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'

const ExecuteNodePath = (props: {
  selectedNode: MissionNode | null | undefined
  missionState: NodeStructureReference
}) => {
  /* -- GLOBAL STATE -- */
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')

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
    setExecuteNodePathPromptIsDisplayed(false)

    if (currentUser !== null) {
      let username: string = currentUser.userID

      if (props.selectedNode !== undefined && props.selectedNode !== null) {
        props.selectedNode.execute()

        // ! Start time delay function here

        if (props.selectedNode.succeeded) {
          gameLogic.handleNodeSelection(props.selectedNode, props.missionState)

          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                     <span class="succeeded">${props.selectedNode.postExecutionSuccessText}</span>`,
            },
          ])
        } else {
          setConsoleOutputs([
            ...consoleOutputs,
            {
              date: Date.now(),
              value: `<span class='line-cursor'>${username}@USAFA: </span>
                    <span class="failed">${props.selectedNode.postExecutionFailureText}</span>`,
            },
          ])
        }
      }
    }
  }

  return (
    <div className='ExecuteNodePath'>
      <p className='x' onClick={closeWindow}>
        x
      </p>

      <p className='PromptDisplayText'>
        Do you want to execute {props.selectedNode?.name}?
      </p>
      <button className='ExecutionButton' onClick={execute}>
        Execute
      </button>
    </div>
  )
}

export default ExecuteNodePath
