import { useEffect, useRef, useState } from 'react'
import './NodeActions.scss'
import { MissionNode } from '../../../modules/mission-nodes'
import { MissionNodeAction } from '../../../modules/mission-node-actions'
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
    if (action.readyToExecute) {
      setDisplayActionList(false)
      props.handleActionSelectionRequest(action)
    }
  }
  let handleCloseRequest = () => {
    setDisplayActionList(false)
    props.handleCloseRequest()
  }

  /* -- COMPONENT REF -- */
  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- COMPONENT STATE -- */
  const [displayActionList, setDisplayActionList] = useState<boolean>(false)
  const [mountHandled, setMountHandled] = useState<boolean>()

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
    if (!displayActionList) {
      setDisplayActionList(true)
      setMountHandled(false)
    } else {
      setDisplayActionList(false)
    }
  }

  /* -- RENDER -- */

  let nodeActionsClassName: string = 'NodeActions'
  let nodeActionListClassName: string = 'NodeActionList'
  let ArrowUpClassName: string = 'ArrowUp Hidden'
  let ArrowDownClassName: string = 'ArrowDown'

  if (!isOpen) {
    nodeActionsClassName += ' Hidden'
  }

  if (!displayActionList) {
    nodeActionListClassName += ' Hidden'
  }

  if (displayActionList) {
    ArrowUpClassName = 'ArrowUp'
    ArrowDownClassName += ' Hidden'
  }

  if (selectedNode && selectedNode.actions.length > 0) {
    return (
      <div className={nodeActionsClassName}>
        <div className='Close'>
          <div className='CloseButton' onClick={handleCloseRequest}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>

        <div className='PromptDisplayText'>
          What you would like to do to {props.selectedNode?.name}?
        </div>

        <div className='NodeActionDefault' onClick={revealOptions}>
          <div className='DefaultText'>
            Choose an action
            <div className={ArrowDownClassName}>^</div>
            <div className={ArrowUpClassName}>^</div>
          </div>
        </div>
        <div className={nodeActionListClassName} ref={scrollRef}>
          {selectedNode.actions.map((action: MissionNodeAction) => {
            let mission: Mission = action.node.mission
            let nodeActionContainerClassName: string = 'NodeActionContainer'

            if (action.resourceCost > mission.resources) {
              nodeActionContainerClassName += ' Disabled'
            }

            return (
              <div
                className={nodeActionContainerClassName}
                key={action.actionID}
              >
                <div
                  className='NodeAction'
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
        <div className='Close'>
          <div className='CloseButton' onClick={handleCloseRequest}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>
        <div className='PromptDisplayText'>
          What you would like to do to {props.selectedNode?.name}?
        </div>
        <div className='NoActions'>
          No actions exist for this node. Contact your instructor for further
          instructions.
        </div>
      </div>
    )
  }
}

export default NodeActions
