import { useEffect, useRef, useState } from 'react'
import './ActionExecModal.scss'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import Tooltip from '../../../../../communication/Tooltip'
import StringToolbox from '../../../../../../../../../shared/toolbox/strings'
import GameClient from 'src/games'
import { useMountHandler } from 'src/toolbox/hooks'
import MapToolbox from '../../../../../../../../../shared/toolbox/maps'

/**
 * Prompt for a game participant to select an action to execute on a node.
 */
export default function ActionExecModal({
  node,
  game,
  close,
}: TActionExecModal_P) {
  /* -- refs -- */

  /**
   * The scrollable container for the action list.
   */
  const optionsRef = useRef<HTMLDivElement>(null)

  /* -- state -- */

  // Whether the drop-down is expanded.
  const [dropDownExpanded, setDropDownExpanded] = useState<boolean>(false)
  // The action selected by the user from the
  // drop down.
  const [selectedAction, selectAction] = useState<ClientMissionAction | null>(
    () => {
      // If there is only one action, select it.
      if (node.actions.size === 1) {
        return node.actions.values().next().value
      }
      // Otherwise, select nothing.
      else {
        return null
      }
    },
  )

  /* -- effects -- */

  // Handle component mount.
  const [_, remount] = useMountHandler((done) => {
    let scrollRefElement: HTMLDivElement | null = optionsRef.current

    if (scrollRefElement !== null) {
      scrollRefElement.scrollTop = 0
    }
    done()
  })

  useEffect(() => {
    // If there are ever no actions to choose from,
    // close the modal.
    if (node.actions.size === 0) {
      close()
    }
    // If there is ever only one action to choose from,
    // select it.
    else if (node.actions.size === 1) {
      // Get the action.
      let action: ClientMissionAction = node.actions.values().next().value

      // Select the action if not already selected.
      if (selectedAction?.actionID !== action.actionID) {
        selectAction(node.actions.values().next().value)
      }
    }
  }, [node.actions.size])

  /* -- functions -- */

  /**
   * Handles a request to close the prompt window.
   */
  const onCloseClick = () => {
    setDropDownExpanded(false)
    close()
  }

  /**
   * Toggles drop down of actions to choose from.
   */
  const revealOptions = () => {
    // Toggle drop down.
    setDropDownExpanded(!dropDownExpanded)
    // Reset scroll position of the drop-down options.
    if (optionsRef.current) optionsRef.current.scrollTop = 0
  }

  /**
   * Executes the selected action.
   */
  const execute = () => {
    if (selectedAction) {
      game.executeAction(selectedAction.actionID)
      close()
    }
  }

  /* -- render -- */

  let executionReady: boolean = !!selectedAction && !dropDownExpanded
  let rootClasses: string[] = ['ActionExecModal', 'MapModal']
  let dropDownClasses: string[] = ['DropDown']
  let selectionText: string = 'Choose an action'

  // Determine dynamic classes.

  // Add class for when an action is selected,
  // and make the selection text the name of the
  // selected action.
  if (selectedAction) {
    rootClasses.push('ActionSelected')
    selectionText = selectedAction.name
  }
  // Add class for when an action is not selected.
  else {
    rootClasses.push('ActionUnselected')
  }
  // Disable drop down if there is less than two actions.
  if (node.actions.size < 2) {
    dropDownClasses.push('Disabled')
  }
  // Add class for when the drop down is expanded.
  if (dropDownExpanded) {
    dropDownClasses.push('Expanded')
  }
  // Add class for when the drop down is collapsed.
  else {
    dropDownClasses.push('Collapsed')
  }

  // Render the JSX for the options in the drop
  // down.
  const optionJsx = MapToolbox.mapToArray(
    node.actions,
    (action: ClientMissionAction) => {
      return (
        <Option
          key={action.actionID}
          game={game}
          action={action}
          select={() => {
            selectAction(action)
            setDropDownExpanded(false)
          }}
        />
      )
    },
  )

  // Render the JSX for the action property display.
  const actionPropertyDisplayJsx = executionReady ? (
    <ActionPropertyDisplay action={selectedAction!} />
  ) : null

  // Render the JSX for the buttons.
  const buttonsJsx = executionReady ? (
    <div className='Buttons'>
      <div className='Button' onClick={execute}>
        EXECUTE ACTION
      </div>
    </div>
  ) : null

  // Render root JSX.
  return (
    <div className={rootClasses.join(' ')}>
      <div className='Heading'>
        <div className='NodeName'>{node.name}</div>
        <div className='DropDownLabel'>{`Available actions:`}</div>
      </div>
      <div className='Close'>
        <div className='CloseButton' onClick={onCloseClick}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
      <div className={dropDownClasses.join(' ')}>
        <div className='Selection' onClick={revealOptions}>
          <div className='Text'>{selectionText}</div>
          <div className='Arrow'>^</div>
        </div>
        <div className='Options' ref={optionsRef}>
          {optionJsx}
        </div>
      </div>
      {actionPropertyDisplayJsx}
      {buttonsJsx}
    </div>
  )
}

/**
 * Displays the properties of the given action.
 */
const ActionPropertyDisplay = (props: { action: ClientMissionAction }) => {
  let { action } = props

  return (
    <ul className='ActionPropertyDisplay'>
      <li className='Property TimeToExecute'>
        <span>Time to execute:</span> {(action.processTime as number) / 1000}{' '}
        second(s)
      </li>
      <li className='Property SuccessChance'>
        <span>Chance of success:</span> {(action.successChance as number) * 100}
        %
      </li>
      <li className='Property ResourceCost'>
        <span>Resource cost:</span> {action.resourceCost} resource(s)
      </li>
      <li className='Property Description'>
        <span>Description:</span> {action.description}
      </li>
    </ul>
  )
}

/**
 * An option in the drop down of actions to choose from.
 */
function Option({ game, action, select }: TOption_P) {
  let rootClasses: string[] = ['Option']

  // Disable the option if there are not enough resources
  // to execute the particular action.
  if (action.resourceCost > game.resources) {
    rootClasses.push('Disabled')
  }

  // Render root JSX.
  return (
    <div className='Option' key={action.actionID} onClick={select}>
      <Tooltip
        description={
          `**Time to execute:** ${
            (action.processTime as number) / 1000
          } second(s)\n` +
          `**Chance of success:** ${
            (action.successChance as number) * 100
          }%\n` +
          `**Resource cost:** ${action.resourceCost as number} resource(s)\n` +
          `**Description:** ${StringToolbox.limit(action.description, 160)}`
        }
      />
      {action.name}
    </div>
  )
}

/**
 * Props for `ActionExecModal` component.
 */
export type TActionExecModal_P = {
  /**
   * The node on which to execute an action.
   */
  node: ClientMissionNode
  /**
   * The game client of which the node is a part.
   */
  game: GameClient
  /**
   * Closes the modal.
   * @note This should stop the modal from rendering statefully.
   */
  close: () => void
}

/**
 * Props for `DropDownOption` component.
 */
export type TOption_P = {
  /**
   * The game client of which the node is a part.
   */
  game: GameClient
  /**
   * The action serving as an option in the drop down.
   */
  action: ClientMissionAction
  /**
   * Selects the action as the selected option.
   */
  select: () => void
}
