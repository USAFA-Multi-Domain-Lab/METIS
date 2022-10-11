import React, { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { Mission, MissionNode } from '../../modules/missions'
import usersModule, { IUser } from '../../modules/users'
import gameLogic from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'

const NodeActions = (props: {
  name: string | undefined
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

  /* -- COMPONENT STATE -- */
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [displayNodeActionList, setDisplayNodeActionList] =
    useState<boolean>(false)

  /* -- COMPONENT FUNCTIONS -- */
  // This forces a rerender of the component.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

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
        What you would like to do to {props.name}?
      </p>

      {/* Need a function to be able to generate however many buttons they want
         with whatever text they want */}

      <div className='NodeActionDefault' onClick={revealOptions}>
        Choose an action{' '}
      </div>
      <div className={className}>
        <div className='NodeAction' onClick={nodeActionSelection}>
          Deny
        </div>
        <div className='NodeAction' onClick={nodeActionSelection}>
          Degrade
        </div>
        <div className='NodeAction' onClick={nodeActionSelection}>
          Disrupt
        </div>
        <div className='NodeAction' onClick={nodeActionSelection}>
          Destroy
        </div>
        <div className='NodeAction' onClick={nodeActionSelection}>
          Manipulate
        </div>
        <div className='NodeAction' onClick={nodeActionSelection}>
          Extract
        </div>
      </div>
    </div>
  )
}

export default NodeActions
