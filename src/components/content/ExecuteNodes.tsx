import React, { useState } from 'react'
import './ExecuteNodes.scss'
import { useStore } from 'react-context-hook'
import { Mission, MissionNode } from '../../modules/missions'
import usersModule, { IUser } from '../../modules/users'
import gameLogic from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'

const ExecuteNodes = (props: {
  selectedNode: MissionNode | null | undefined
  missionState: NodeStructureReference
}) => {
  /* -- GLOBAL STATE -- */
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [executePromptIsDisplayed, setExecutePromptIsDisplayed] =
    useStore<boolean>('executePromptIsDisplayed')

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

  /* -- COMPONENT FUNCTIONS -- */

  // This forces a rerender of the component.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // Checks to see if the selected node succeeds or fails and then displays
  // the appropriate text in the terminal to the right
  const execution = (): void => {
    // setExecutePromptIsDisplayed(false)
    // if (currentUser !== null) {
    //   let username: string = currentUser.userID
    //   if (props.selectedNode !== undefined && props.selectedNode !== null) {
    //     if (props.selectedNode._willSucceed === true) {
    //       gameLogic.handleNodeSelection(props.selectedNode, props.missionState)
    //       forceUpdate()
    //       setConsoleOutputs([
    //         ...consoleOutputs,
    //         {
    //           date: Date.now(),
    //           value: `<span class='line-cursor'>${username}@USAFA: </span>
    //                    <span class = ${props.selectedNode.color}>${props.selectedNode.postExecutionSuccessText}</span>`,
    //         },
    //       ])
    //     } else {
    //       forceUpdate()
    //       setConsoleOutputs([
    //         ...consoleOutputs,
    //         {
    //           date: Date.now(),
    //           value: `<span class='line-cursor'>${username}@USAFA: </span>
    //                   <span class = ${props.selectedNode.color}>${props.selectedNode.postExecutionFailureText}</span>`,
    //         },
    //       ])
    //     }
    //   }
    // }
  }

  return (
    <div className='ExecuteNodes'>
      <button className='ExecutionButton' onClick={execution}>
        Execute
      </button>
    </div>
  )
}

export default ExecuteNodes
