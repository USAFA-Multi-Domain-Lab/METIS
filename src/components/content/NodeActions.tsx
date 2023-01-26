import { useState } from 'react'
import './NodeActions.scss'
import { MissionNode } from '../../modules/mission-nodes'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import Tooltip from './Tooltip'
import strings from '../../modules/toolbox/strings'

const NodeActions = (props: {
  selectedNode: MissionNode | null | undefined
  setActionSelectionPromptIsDisplayed: (
    actionSelectionPromptIsDisplayed: boolean,
  ) => void
  setExecuteNodePathPromptIsDisplayed: (
    executeNodePathPromptIsDisplayed: boolean,
  ) => void
}) => {
  let selectedNode: MissionNode | null | undefined = props.selectedNode

  const setExecuteNodePathPromptIsDisplayed =
    props.setExecuteNodePathPromptIsDisplayed
  const setActionSelectionPromptIsDisplayed =
    props.setActionSelectionPromptIsDisplayed

  /* -- COMPONENT STATE -- */
  const [displayActionList, setDisplayActionList] = useState<boolean>(false)

  /* -- COMPONENT FUNCTIONS -- */

  // Closes the execution prompt window
  const closeWindow = (): void => {
    setActionSelectionPromptIsDisplayed(false)
    setDisplayActionList(false)
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

    if (props.selectedNode !== null && props.selectedNode !== undefined) {
      props.selectedNode.selectedAction = action
      props.selectedNode.selectedAction.processTime = action.processTime
    }
  }

  /* -- RENDER -- */

  let nodeActionListClassName: string = 'NodeActionList'

  if (displayActionList === false) {
    nodeActionListClassName += ' hide'
  }

  if (selectedNode && selectedNode.actions.length > 0) {
    return (
      <div className='NodeActions'>
        <p className='x' onClick={closeWindow}>
          x
        </p>

        <p className='PromptDisplayText'>
          What you would like to do to {props.selectedNode?.name}?
        </p>

        <div className='NodeActionDefault' onClick={revealOptions}>
          <div className='DefaultText'>
            Choose an action <div className='ArrowDown'>^</div>
          </div>
          {/* <div className='ArrowDown'>^</div> */}
        </div>
        <div className={nodeActionListClassName}>
          {selectedNode.actions.map((action: MissionNodeAction) => {
            return (
              <div
                className='NodeAction'
                key={action.actionID}
                onClick={() => selectAction(action)}
              >
                <Tooltip
                  description={
                    `**Time to execute:** ${
                      (action.processTime as number) / 1000
                    } second(s)\n` +
                    `**Chance of success:** ${
                      (action.successChance as number) * 100
                    }%\n` +
                    `**Resource cost:** ${
                      action.resourceCost as number
                    } resource(s)\n` +
                    `**Description:** ${strings.limit(action.description, 160)}`
                  }
                />
                {action.name}
              </div>
            )
          })}
        </div>
      </div>
    )
  } else {
    return (
      <div className='NodeActions'>
        <p className='x' onClick={closeWindow}>
          x
        </p>
        <p className='PromptDisplayText'>
          What you would like to do to {props.selectedNode?.name}?
        </p>
        <p className='NoActions'>
          No actions exist for this node. Contact your instructor for further
          instructions.
        </p>
      </div>
    )
  }
}

export default NodeActions
