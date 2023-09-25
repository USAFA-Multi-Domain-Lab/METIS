import { useRef, useState } from 'react'
import './NodeActions.scss'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import Tooltip from '../communication/Tooltip'
import StringsToolbox from '../../../../../shared/toolbox/strings'
import GameClient from 'src/games'
import { useMountHandler } from 'src/toolbox/hooks'
import MapToolbox from '../../../../../shared/toolbox/maps'

export type TNodeActions = {
  isOpen: boolean
  node: ClientMissionNode
  game: GameClient
  handleActionSelectionRequest: (action: ClientMissionAction) => void
  handleCloseRequest: () => void
}

/**
 * Prompt for a game participant to select an action to execute on a node.
 */
export default function NodeActions({
  isOpen,
  node,
  game,
  handleActionSelectionRequest,
  handleCloseRequest,
}: TNodeActions) {
  /* -- REFS -- */

  const scrollRef = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  const [displayActionList, setDisplayActionList] = useState<boolean>(false)

  /* -- EFFECTS -- */

  // Handle component mount.
  const [_, remount] = useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = scrollRef.current

    if (scrollRefElement !== null && scrollRefElement.children.length > 0) {
      scrollRefElement.children[0].scrollIntoView({
        behavior: 'auto',
      })
    }
    done()
  })

  /* -- HANDLERS -- */

  /**
   * Handles an action being selected for execution.
   * @param action The action selected by the user.
   */
  const select = (action: ClientMissionAction) => {
    if (game.readyToExecute(action)) {
      setDisplayActionList(false)
      handleActionSelectionRequest(action)
    }
  }

  /**
   * Handles a request to close the prompt window.
   */
  const close = () => {
    setDisplayActionList(false)
    handleCloseRequest()
  }

  /**
   * Toggles drop down of actions to choose from.
   */
  const revealOptions = () => {
    if (!displayActionList) {
      setDisplayActionList(true)
      remount()
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

  const nodeActionItems = MapToolbox.mapToArray(
    node.actions,
    (action: ClientMissionAction) => {
      let nodeActionContainerClassName: string = 'NodeActionContainer'

      if (action.resourceCost > game.resources) {
        nodeActionContainerClassName += ' Disabled'
      }

      return (
        <div className={nodeActionContainerClassName} key={action.actionID}>
          <div
            className='NodeAction'
            key={action.actionID}
            onClick={() => select(action)}
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
                `**Description:** ${StringsToolbox.limit(
                  action.description,
                  160,
                )}`
              }
            />
            {action.name}
          </div>
        </div>
      )
    },
  )

  if (node.actions.size) {
    return (
      <div className={nodeActionsClassName}>
        <div className='Close'>
          <div className='CloseButton' onClick={close}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>

        <div className='PromptDisplayText'>
          What you would like to do to {node.name}?
        </div>

        <div className='NodeActionDefault' onClick={revealOptions}>
          <div className='DefaultText'>
            Choose an action
            <div className={ArrowDownClassName}>^</div>
            <div className={ArrowUpClassName}>^</div>
          </div>
        </div>
        <div className={nodeActionListClassName} ref={scrollRef}>
          {nodeActionItems}
        </div>
      </div>
    )
  } else {
    return (
      <div className={nodeActionsClassName}>
        <div className='Close'>
          <div className='CloseButton' onClick={close}>
            x
            <Tooltip description='Close window.' />
          </div>
        </div>
        <div className='PromptDisplayText'>
          What you would like to do to {node.name}?
        </div>
        <div className='NoActions'>
          No actions exist for this node. Contact your instructor for further
          instructions.
        </div>
      </div>
    )
  }
}

let html: string = 'This is a link: Enjoy your link <a></a> Next line. <br />'
