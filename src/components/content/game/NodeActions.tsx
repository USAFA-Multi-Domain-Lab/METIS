import { useEffect, useRef, useState } from 'react'
import './NodeActions.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import missionNodeActions, {
  MissionNodeAction,
} from '../../../modules/mission-node-actions'
import Tooltip from '../communication/Tooltip'
import strings from '../../../modules/toolbox/strings'
import { Mission } from '../../../modules/missions'

const NodeActions = (props: {
  isOpen: boolean
  selectedNode: MissionNode | null | undefined
  handleActionSelectionRequest: (action: MissionNodeAction) => void
  handleCloseRequest: () => void
}) => {
  let isOpen: boolean = props.isOpen
  let selectedNode: MissionNode | null | undefined = props.selectedNode
  let handleActionSelectionRequest = (action: MissionNodeAction) => {
    setDisplayActionList(false)
    props.handleActionSelectionRequest(action)
  }
  let handleCloseRequest = () => {
    setDisplayActionList(false)
    props.handleCloseRequest()
  }

  /* -- COMPONENT REF -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- COMPONENT STATE -- */
  const [displayActionList, setDisplayActionList] = useState<boolean>(false)
  const [mountHandled, setMountHandled] = useState<boolean>(true)

  /* -- COMPONENT EFFECT -- */
  useEffect(() => {
    if (!mountHandled) {
      let scrollRefElement: HTMLDivElement | null = scrollRef.current

      if (scrollRefElement !== null) {
        scrollRefElement.children[0].scrollIntoView({
          behavior: 'auto',
        })
      }
      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- COMPONENT FUNCTIONS -- */

  const revealOptions = () => {
    if (displayActionList === false) {
      setDisplayActionList(true)
      setMountHandled(false)
    } else {
      setDisplayActionList(false)
    }
  }

  /* -- RENDER -- */

  let nodeActionsClassName: string = 'NodeActions'
  let nodeActionListClassName: string = 'NodeActionList'

  if (isOpen === false) {
    nodeActionsClassName += ' Hidden'
  }

  if (displayActionList === false) {
    nodeActionListClassName += ' hide'
  }

  if (selectedNode && selectedNode.actions.length > 0) {
    return (
      <div className={nodeActionsClassName}>
        <p className='x' onClick={handleCloseRequest}>
          x
        </p>

        <p className='PromptDisplayText'>
          What you would like to do to {props.selectedNode?.name}?
        </p>

        <div className='NodeActionDefault' onClick={revealOptions}>
          <div className='DefaultText'>
            Choose an action <div className='ArrowDown'>^</div>
          </div>
        </div>
        <div className={nodeActionListClassName} ref={scrollRef}>
          {selectedNode.actions.map((action: MissionNodeAction) => {
            let mission: Mission = action.node.mission
            let nodeActionClassName: string = 'NodeAction'

            if (action.resourceCost > mission.resources) {
              nodeActionClassName += ' Disabled'
            }

            return (
              <div className='NodeActionContainer' key={action.actionID}>
                <div
                  className={nodeActionClassName}
                  key={action.actionID}
                  onClick={() => handleActionSelectionRequest(action)}
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
                      `**Description:** ${strings.limit(
                        action.description,
                        160,
                      )}`
                    }
                  />
                  {action.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  } else {
    return (
      <div className={nodeActionsClassName}>
        <p className='x' onClick={handleCloseRequest}>
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
