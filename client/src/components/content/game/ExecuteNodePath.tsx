import './ExecuteNodePath.scss'
import ClientMissionAction from 'src/missions/actions'
import ActionPropertyDisplay from './ActionPropertyDisplay'
import Tooltip from '../communication/Tooltip'
import { useGlobalContext } from 'src/context'
import { IConsoleOutput } from './ConsoleOutput'
import OutputPanel from './OutputPanel'
import GameClient from 'src/games'

/* -- INTERFACE(S) -- */

/**
 * Describes props passed into `ExecuteNodePath` component.
 */
type TExecuteNodePath = {
  isOpen: boolean
  action: ClientMissionAction
  game: GameClient
  outputToConsole: (output: IConsoleOutput) => void
  handleExecutionRequest: () => void
  handleCloseRequest: () => void
  handleGoBackRequest: () => void
}

/**
 * Buttons for the `ExecuteNodePath` component.
 */
function Buttons(props: TExecuteNodePath): JSX.Element | null {
  /* -- PROPS -- */

  let {
    action,
    game,
    handleExecutionRequest,
    handleGoBackRequest,
    handleCloseRequest,
    outputToConsole,
  } = props

  let { node: selectedNode } = action

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const { notify } = globalContext.actions

  /* -- FUNCTIONS -- */

  // Closes the execution prompt window.
  const closeWindow = () => {
    handleCloseRequest()
  }

  const execute = () => {
    if (game.readyToExecute(action)) {
      closeWindow()
      outputToConsole(OutputPanel.renderActionStartOutput(action))
      handleExecutionRequest()
    } else {
      notify(
        `The action you attempted to execute is not currently executable.`,
        { duration: 3500 },
      )
    }
  }

  /* -- RENDER -- */

  let executionButtonClassName: string = 'Button ExecutionButton'
  let additionalActionButtonClassName: string = 'Button AdditionalActionButton'
  let displayTooltip: boolean = false

  if (!game.readyToExecute(action)) {
    executionButtonClassName += ' Disabled'
    displayTooltip = true
  }
  if (selectedNode.actions.size === 1) {
    additionalActionButtonClassName += ' Disabled'
  }

  return (
    <div className='Buttons'>
      <button className={executionButtonClassName} onClick={execute}>
        EXECUTE ACTION
        {displayTooltip ? (
          <Tooltip
            description={`You cannot execute this action because you do not have enough resources remaining.`}
          />
        ) : null}
      </button>

      <button
        className={additionalActionButtonClassName}
        onClick={handleGoBackRequest}
      >
        Back
      </button>
    </div>
  )
}

/**
 * Prompt modal for executing an action on a node.
 */
export default function ExecuteNodePath(
  props: TExecuteNodePath,
): JSX.Element | null {
  /* -- PROPS -- */

  let { isOpen, action, handleCloseRequest } = props
  let node = action.node

  /* -- PRE-RENDER PROCESSING -- */

  let className: string = 'ExecuteNodePath'

  // Logic to disable the execute button once a user is out of tokens.
  if (!isOpen) {
    className += ' Hidden'
  }

  /* -- RENDER -- */

  return (
    <div className={className}>
      <div className='Close'>
        <div className='CloseButton' onClick={handleCloseRequest}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
      <div className='PromptDisplayText'>
        Do you want to {action.name.toLowerCase()} {node.name}?
      </div>
      <ActionPropertyDisplay action={action} />
      <Buttons {...props} />
    </div>
  )
}
