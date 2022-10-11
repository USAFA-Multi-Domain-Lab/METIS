import React, { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { MissionNode } from '../../modules/missions'
import { IUser } from '../../modules/users'
import NodeStructureReference from '../../modules/node-reference'

const NodeActions = (props: {
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
  const [
    nodeActionSelectionPromptIsDisplayed,
    setNodeActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('nodeActionSelectionPromptIsDisplayed')
  const [nodeActionItemDisplay, setNodeActionItemDisplay] = useStore<
    Array<{ value: string }>
  >('nodeActionItemDisplay')

  /* -- COMPONENT STATE -- */
  const [displayNodeActionList, setDisplayNodeActionList] =
    useState<boolean>(false)

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setNodeActionSelectionPromptIsDisplayed(false)
  }

  const revealOptions = () => {
    if (displayNodeActionList === false) {
      setDisplayNodeActionList(true)
    } else {
      setDisplayNodeActionList(false)
    }
  }

  const nodeActionSelection = (): void => {
    setNodeActionSelectionPromptIsDisplayed(false)
    setExecuteNodePathPromptIsDisplayed(true)
    setDisplayNodeActionList(false)
  }

  /* -- RENDER -- */

  let className: string = 'NodeActionList'

  if (displayNodeActionList === false) {
    className = 'hide NodeActionList'
  } else {
    className = 'NodeActionList'
  }

  return (
    <div className='NodeActions'>
      <p className='x' onClick={closeWindow}>
        x
      </p>

      <p className='PromptDisplayText'>
        What you would like to do to {props.selectedNode?.name}?
      </p>

      {/* Need a function to be able to generate however many buttons they want
         with whatever text they want */}

      <div className='NodeActionDefault' onClick={revealOptions}>
        Choose an action
        <div className='ArrowDown'>^</div>
      </div>
      <div className={className}>
        {nodeActionItemDisplay.map((nodeActionItem: { value: string }) => {
          return (
            <div
              className='NodeAction'
              key={nodeActionItem.value}
              onClick={nodeActionSelection}
            >
              {nodeActionItem.value}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NodeActions
