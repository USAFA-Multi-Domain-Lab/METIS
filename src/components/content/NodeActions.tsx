import { useState } from 'react'
import './NodeActions.scss'
import { useStore } from 'react-context-hook'
import { MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
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
  const [displayActionList, setDisplayActionList] = useState<boolean>(false)

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setActionSelectionPromptIsDisplayed(false)
    setDisplayActionList(false)
    setActionDisplay([])
  }

  const revealOptions = () => {
    if (displayActionList === false) {
      setDisplayActionList(true)
    } else {
      setDisplayActionList(false)
    }
  }

  const selectAction = (action: MissionNodeAction): void => {
    setActionSelectionPromptIsDisplayed(false)
    setExecuteNodePathPromptIsDisplayed(true)
    setDisplayActionList(false)
    setProcessTime(action.processTime)
    setActionName(action.name)
    setActionSuccessChance(action.successChance)

    if (props.selectedNode !== null && props.selectedNode !== undefined) {
      props.selectedNode.selectedAction = action
    }
  }

  /* -- RENDER -- */

  let className: string = 'NodeActionList'

  if (displayActionList === false) {
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
              key={action.name}
              onClick={() => selectAction(action)}
            >
              <Tooltip
                description={
                  `* Time to execute: ${
                    (action.processTime as number) / 1000
                  } second(s)\n` +
                  `* Chance of success: ${
                    (action.successChance as number) * 100
                  }%\n` +
                  `* Description: ${action.description}`
                }
              />
              {action.name}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default NodeActions
