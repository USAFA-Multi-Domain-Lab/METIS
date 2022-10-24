import React, { useState } from 'react'
import './ExecuteNodePath.scss'
import { useStore } from 'react-context-hook'
import { Mission, MissionNode } from '../../modules/missions'
import { IUser } from '../../modules/users'
import gameLogic, { runNodeLoadingBar } from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'
import NodeHoverDisplay from './NodeHoverDisplay'

const ExecuteNodePath = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  /* -- GLOBAL STATE -- */
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
  const [processDelayTime] = useStore<number>('processDelayTime')
  const [nodeActionItemText] = useStore<string>('nodeActionItemText')
  const [nodeActionSuccessChance, setNodeActionSuccessChance] =
    useStore<number>('nodeActionSuccessChance')
  const [selectedDivElement, setSelectedDivElement] =
    useStore<HTMLDivElement>('selectedDivElement')

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

      runNodeLoadingBar(processDelayTime, selectedDivElement)

      setTimeout(() => {
        if (props.selectedNode !== undefined && props.selectedNode !== null) {
          props.selectedNode.execute()
          props.selectedNode.isExecuting()

          // Output message in the terminal which differs based on whether
          // it passes or fails
          if (props.selectedNode.succeeded) {
            gameLogic.handleNodeSelection(props.selectedNode)

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
      }, processDelayTime)
    }
  }

  if (props.selectedNode !== undefined && props.selectedNode !== null) {
    props.selectedNode.isExecuting()
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
      <button className='ExecutionButton' onClick={execute}>
        {nodeActionItemText}
      </button>
    </div>
  )
}

export default ExecuteNodePath
