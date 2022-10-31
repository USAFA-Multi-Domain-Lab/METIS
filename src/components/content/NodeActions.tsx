import { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { MissionNode, MissionNodeAction } from '../../modules/missions'
import { IUser } from '../../modules/users'
import Tooltip from './Tooltip'

const NodeActions = (props: {
  selectedNode: MissionNode | null | undefined
}) => {
  /* -- GLOBAL STATE -- */
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
  const [
    actionSelectionPromptIsDisplayed,
    setActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('actionSelectionPromptIsDisplayed')
  const [actionDisplay, setActionDisplay] =
    useStore<Array<MissionNodeAction>>('actionDisplay')
  const [processTime, setProcessTime] = useStore<number>('processTime')
  const [actionName, setActionName] = useStore<string>('actionName')
  const [actionSuccessChance, setActionSuccessChance] = useStore<number>(
    'actionSuccessChance',
  )

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
    setActionSelectionPromptIsDisplayed(false)
    setDisplayNodeActionList(false)
    setActionDisplay([])
  }

  const revealOptions = () => {
    if (displayNodeActionList === false) {
      setDisplayNodeActionList(true)
    } else {
      setDisplayNodeActionList(false)
    }
  }

  const nodeActionSelection = (action: MissionNodeAction): void => {
    setActionSelectionPromptIsDisplayed(false)
    setExecuteNodePathPromptIsDisplayed(true)
    setDisplayNodeActionList(false)
    setProcessTime(action.timeDelay)
    setActionName(action.text)
    setActionSuccessChance(action.successChance)
    console.log(action)

    if (props.selectedNode !== null && props.selectedNode !== undefined) {
      props.selectedNode.selectedNodeAction = action
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
        {actionDisplay.map((action: MissionNodeAction) => {
          return (
            <div
              className='NodeAction'
              key={action.text}
              onClick={() => nodeActionSelection(action)}
            >
              <Tooltip
                description={
                  `* Time to execute: ${
                    (action.timeDelay as number) / 1000
                  } second(s)\n` +
                  `* Chance of success: ${
                    (action.successChance as number) * 100
                  }%\n` +
                  `* Description: ${action.description}`
                }
              />
              {action.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NodeActions
