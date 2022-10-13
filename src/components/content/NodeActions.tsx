import React, { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { MissionNode } from '../../modules/missions'
import { IUser } from '../../modules/users'
import NodeStructureReference from '../../modules/node-reference'

export interface INodeActionItem {
  text: string
  timeDelay: number
}

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
    Array<INodeActionItem>
  >('nodeActionItemDisplay')
  const [outputDelayTime, setOutputDelayTime] =
    useStore<number>('outputDelayTime')

  /* -- COMPONENT STATE -- */
  const [displayNodeActionList, setDisplayNodeActionList] =
    useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

  /* -- COMPONENT FUNCTIONS -- */
  // This forces a rerender of the component.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setNodeActionSelectionPromptIsDisplayed(false)
    setDisplayNodeActionList(false)
    setNodeActionItemDisplay([])
  }

  const revealOptions = () => {
    if (displayNodeActionList === false) {
      setDisplayNodeActionList(true)
    } else {
      setDisplayNodeActionList(false)
    }
  }

  const nodeActionSelection = (nodeActionItem: INodeActionItem): void => {
    setNodeActionSelectionPromptIsDisplayed(false)
    setExecuteNodePathPromptIsDisplayed(true)
    setDisplayNodeActionList(false)
    setNodeActionItemDisplay([])
    setOutputDelayTime(nodeActionItem.timeDelay)
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

      <div className='NodeActionDefault' onClick={revealOptions}>
        Choose an action
        <div className='ArrowDown'>^</div>
      </div>
      <div className={className}>
        {nodeActionItemDisplay.map((nodeActionItem: INodeActionItem) => {
          return (
            <div
              className='NodeAction'
              key={nodeActionItem.text}
              onClick={() => nodeActionSelection(nodeActionItem)}
            >
              {nodeActionItem.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NodeActions
