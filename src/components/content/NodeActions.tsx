import React, { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { MissionNode, MissionNodeAction } from '../../modules/missions'
import { IUser } from '../../modules/users'
import NodeStructureReference from '../../modules/node-reference'
import { RNG } from 'random'
import Tooltip from './Tooltip'

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
    Array<MissionNodeAction>
  >('nodeActionItemDisplay')
  const [processDelayTime, setProcessDelayTime] =
    useStore<number>('processDelayTime')
  const [nodeActionItemText, setNodeActionItemText] =
    useStore<string>('nodeActionItemText')
  const [nodeActionSuccessChance, setNodeActionSuccessChance] =
    useStore<number>('nodeActionSuccessChance')

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

  const nodeActionSelection = (nodeActionItem: MissionNodeAction): void => {
    setNodeActionSelectionPromptIsDisplayed(false)
    setExecuteNodePathPromptIsDisplayed(true)
    setDisplayNodeActionList(false)
    setNodeActionItemDisplay([])
    setProcessDelayTime(nodeActionItem.timeDelay)
    setNodeActionItemText(nodeActionItem.text)
    setNodeActionSuccessChance(nodeActionItem.successChance)

    if (props.selectedNode !== null && props.selectedNode !== undefined) {
      props.selectedNode.selectedNodeAction = nodeActionItem
    }
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
        {nodeActionItemDisplay.map((nodeActionItem: MissionNodeAction) => {
          return (
            <div
              className='NodeAction'
              key={nodeActionItem.text}
              onClick={() => nodeActionSelection(nodeActionItem)}
            >
              <Tooltip
                description={
                  `* Executed node in ${
                    (nodeActionItem.timeDelay as number) / 1000
                  } second(s)\n` +
                  `* Chance of success: ${
                    (nodeActionItem.successChance as number) * 100
                  }%\n`
                }
              />
              {nodeActionItem.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NodeActions
