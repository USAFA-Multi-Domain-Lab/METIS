import { useState } from 'react'
import OutputPanel from '../content/game/OutputPanel'
import './GamePage.scss'
import ExecuteNodePath from '../content/game/ExecuteNodePath'
import { IPage } from '../App'
import { IConsoleOutput } from 'src/components/content/game/ConsoleOutput'
import GameClient from 'src/games'
import { useGlobalContext, useNavigationMiddleware } from 'src/context'
import { useMountHandler, useUnmountHandler } from 'src/toolbox/hooks'
import ClientMission from 'src/missions'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionAction from 'src/missions/actions'
import MapToolbox from '../../../../shared/toolbox/maps'
import Navigation from '../content/general-layout/Navigation'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import MissionMap from '../content/game/MissionMap'
import { EAjaxStatus } from '../../../../shared/toolbox/ajax'
import NodeActions from '../content/game/NodeActions'
import { TServerConnectionStatus } from '../../../../shared/connect/data'

export interface IGamePage extends IPage {
  game: GameClient
}

// This is the number of times per
// second that the game updates.
const GAME_TICK_RATE: number = 20

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function GamePage(props: IGamePage): JSX.Element | null {
  /* -- PROPS -- */

  let game: GameClient = props.game
  let mission: ClientMission = game.mission

  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()
  const {
    navigateTo,
    finishLoading,
    notify,
    logout,
    forceUpdate,
    confirm,
    handleError,
  } = globalContext.actions
  const [server] = globalContext.server

  /* -- STATE -- */

  const [selectedNode, selectNode] = useState<ClientMissionNode | null>(null)
  const [selectedAction, selectAction] = useState<ClientMissionAction | null>(
    null,
  )

  /* -- EFFECTS -- */

  // Add navigation middleware to properly
  // quit the game before the user navigates
  // away.
  useNavigationMiddleware((to: string, next) => {
    confirm(
      'Are you sure you want to quit?',
      async (concludeAction: () => void) => {
        try {
          await game.quit()
          concludeAction()
          next()
        } catch (error) {
          handleError({
            message: 'Failed to quit game.',
            notifyMethod: 'bubble',
          })
          concludeAction()
        }
      },
      {
        buttonConfirmText: 'Yes',
        buttonCancelText: 'No',
      },
    )
  })

  /* -- VARIABLES -- */

  let status: TServerConnectionStatus = server?.status ?? 'closed'
  let statusMessage: string = ''
  let overflowConnectionMessage: string = ''
  let overflowStatusMessages: Array<{ key: string; text: string }> = []

  // Variables that determine whether or not
  // to display various components.
  let displayNodeActions: boolean =
    selectedNode !== null && selectedAction === null
  let displayExecuteNodePath: boolean =
    selectedNode !== null && selectedAction !== null

  // Class names for various components.
  let rootClassList: string[] = ['GamePage', 'Page']
  let resourcesClassList: string[] = ['Resources']
  let statusClassList: string[] = ['Status']
  let overflowCountClassList: string[] = ['OverflowCount', 'Hidden']
  let overflowClassList: string[] = ['Overflow']
  let pendingTasksClassList: string[] = ['PendingTasks', 'Hidden']

  /* -- FUNCTIONS -- */

  // This will loop the game,
  // updating at the given tick
  // rate.
  let loop: () => void = () => {
    setTimeout(() => {
      try {
        forceUpdate()
        loop()
      } catch (error) {}
    }, 1000 / GAME_TICK_RATE)
  }

  /**
   * Outputs to the in-browser console.
   * @param {IConsoleOutput} output The output.
   */
  const outputToConsole = (output: IConsoleOutput): void => {
    // mission.outputToConsole(output)
  }

  /**
   * Handles the selection of a node in the mission map by the user.
   * @param {ClientMissionNode} node The node that was selected.
   */
  const handleNodeSelection = async (
    node: ClientMissionNode,
  ): Promise<void> => {
    // Logic to send the pre-execution text to the output panel.
    if (node.preExecutionText !== '' && node.preExecutionText !== null) {
      let output: IConsoleOutput = OutputPanel.renderPreExecutionOutput(node)
      outputToConsole(output)
    }

    // Logic that opens the next level of nodes
    // (displays the selected node's child nodes)
    if (node.openable) {
      game.openNode(node.nodeID)
    }

    // If the node is ready to execute...
    else if (node.readyToExecute) {
      // If there are no more resources left
      // to spend, notify the user.
      if (game.resources === 0) {
        notify(`You have no more resources left to spend.`)
      }
      // If there is not enough resources to
      // execute any actions, notify the user.
      else if (
        !MapToolbox.mapToArray(
          node.actions,
          (action) => action.resourceCost <= game.resources,
        ).includes(true)
      ) {
        notify(`You do not have enough resources to execute any actions.`)
      }
      // Else, select the node.
      else {
        selectNode(node)

        // If the node has only one action,
        // preselect that action as well.
        if (node.actions.size === 1) {
          selectAction(Array.from(node.actions.values())[0])
        }

        // Force a state update.
        forceUpdate()
      }
    }
  }

  /**
   * Clears the selected node and action.
   */
  const clearSelections = (): void => {
    selectNode(null)
    selectAction(null)
  }

  /**
   * Renders the `NodeActions` prompt componenent conditionally based
   * on whether there is a selected node.
   */
  const renderNodeActions = (): JSX.Element | null => {
    if (selectedNode !== null) {
      return (
        <NodeActions
          isOpen={displayNodeActions}
          node={selectedNode}
          game={game}
          handleActionSelectionRequest={selectAction}
          handleCloseRequest={clearSelections}
        />
      )
    } else {
      return null
    }
  }

  /**
   * Renders the `ExecuteNodePath` prompt componenent conditionally based
   * on whether there is a selected node and action.
   */
  const renderExecuteNodePath = (): JSX.Element | null => {
    if (selectedNode !== null && selectedAction !== null) {
      return (
        <ExecuteNodePath
          isOpen={displayExecuteNodePath}
          action={selectedAction}
          game={game}
          outputToConsole={outputToConsole}
          handleExecutionRequest={() => {
            if (selectedAction) {
              game.executeAction(selectedAction.actionID)
            }
          }}
          handleCloseRequest={clearSelections}
          handleGoBackRequest={() => {
            if (selectedNode && selectedNode.actions.size === 1) {
              clearSelections()
            }
          }}
        />
      )
    } else {
      return null
    }
  }

  /* -- EFFECTS -- */

  useMountHandler((done) => {
    finishLoading()
    loop()
    done()
  })

  useUnmountHandler(() => {
    // Make loop function an empty function so that
    // the loop is broken the next time it is called.
    loop = () => {}
  })

  /* -- PRE-RENDER-PROCESSING -- */

  // If the mission has no resources left,
  // add the red alert class to the resources.
  if (game.resources <= 0) {
    resourcesClassList.push('RedAlert')
  }

  // If a server connection is present...
  if (server) {
    switch (status) {
      // Add class name and set status message based on the
      // server connection status.
      case 'open':
        statusMessage = 'Connected.'
        statusClassList.push('Open')
        overflowConnectionMessage =
          'The client is properly connected to the server.'
        break
      case 'closed':
        statusMessage = 'Not Connected.'
        statusClassList.push('Closed')
        overflowConnectionMessage =
          'The client is not connected to the server. Data between the server and the client cannot be exchanged.'
        break
      case 'connecting':
        statusMessage = 'Connection dropped. Attempting to reconnect.'
        statusClassList.push('Connecting')
        overflowConnectionMessage =
          'The connection from the client to the server has dropped. The client is attempting to reconnect to the server now.'
        break
    }

    // If the server connection has unfulfilled requests, add the
    // 'Pending' class to the status element.)
    if (status === 'open' && server.hasUnfulfilledRequests) {
      statusClassList.push('Pending')

      // Get the request data.
      let unfulfilledRequests = server.unfulfilledRequests

      // Get the last request and overwrite the status message with it.
      statusMessage =
        unfulfilledRequests[unfulfilledRequests.length - 1].statusMessage

      // Construct the overflow status messages.
      overflowStatusMessages = unfulfilledRequests.map((request) => ({
        key: request.id,
        text: request.statusMessage,
      }))

      // If there are overflow messages, filter
      // out the hidden class name from the pending tasks
      // element.
      if (overflowStatusMessages.length > 0) {
        pendingTasksClassList = pendingTasksClassList.filter(
          (cls) => cls !== 'Hidden',
        )
      }
      // If there is more than one overflow message, filter
      // out the hidden class name from the overflow count
      // element.
      if (overflowStatusMessages.length > 1) {
        overflowCountClassList = overflowCountClassList.filter(
          (cls) => cls !== 'Hidden',
        )
      }
    }
  }
  // If no server connection, add the 'Closed' class to the status element.
  else {
    statusClassList.push('Closed')
    statusMessage = 'Connection dropped. Attempting to reconnect.'
  }

  /* -- RENDER -- */

  // Return the rendered component.
  return (
    <div className={rootClassList.join(' ')}>
      {
        // -- navigation --
      }
      <Navigation
        links={[
          {
            text: 'Back to selection',
            key: 'back-to-selection',
            handleClick: () => {
              navigateTo('HomePage', {})
            },
            visible: true,
          },
          {
            text: 'Log out',
            key: 'log-out',
            handleClick: () =>
              logout({
                returningPagePath: 'MissionSelectionPage',
                returningPageProps: {},
              }),
            visible: true,
          },
        ]}
        brandingCallback={() => navigateTo('HomePage', {})}
        brandingTooltipDescription='Go home.'
      />
      {
        // -- content --
      }
      <div className='Content'>
        <div className='TopBar'>
          <div className={resourcesClassList.join(' ')}>
            Resources remaining: {game.resources}
          </div>
          <div className={statusClassList.join(' ')}>
            <div className='Message'>
              {statusMessage}{' '}
              <span className={overflowCountClassList.join(' ')}>
                +{overflowStatusMessages.length - 1}
              </span>
            </div>
            <div className='Indicator'></div>
            <div className={overflowClassList.join(' ')}>
              <div className='Connection'>
                <div className='Heading'>Connection Status:</div>
                <div className='Status'>{status}</div>
                <div className='Message'>{overflowConnectionMessage}</div>
              </div>
              <div className={pendingTasksClassList.join(' ')}>
                <div className='Heading'>Pending Tasks:</div>
                <ul className='Messages'>
                  {overflowStatusMessages.map((statusMessage) => (
                    <li key={statusMessage.key} className='Message'>
                      {statusMessage.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <PanelSizeRelationship
          sizingMode={EPanelSizingMode.Panel1_Auto__Panel2_Defined}
          initialDefinedSize={400}
          panel1={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            render: () => (
              <>
                <MissionMap
                  mission={mission}
                  missionAjaxStatus={EAjaxStatus.Loaded}
                  handleNodeSelection={handleNodeSelection}
                  // handleNodePathExitRequest={mission.enableAllNodes}
                  // grayOutExitNodePathButton={!mission.hasDisabledNodes}
                  applyNodeClassList={(node: ClientMissionNode) => {
                    let classList: string[] = []

                    if (node.isOpen) {
                      classList.push('Opened')
                    }

                    // if (!node.highlighted) {
                    //   className += ' faded'
                    // }

                    return classList
                  }}
                  renderNodeTooltipDescription={(node: ClientMissionNode) => {
                    let description: string = node.description

                    //
                    //                     // This creates the tooltip hover over effect
                    //                     // that displays the description of the node
                    //                     // after it has been executed.
                    //                     if (node.executable && node.executed) {
                    //                       description =
                    //                         `* Action executed: "${node.selectedAction?.name}"\n` +
                    //                         `* Executed node in ${
                    //                           (node.selectedAction?.processTime as number) / 1000
                    //                         } second(s)\n` +
                    //                         `* Chance of success: ${
                    //                           (node.selectedAction?.successChance as number) * 100
                    //                         }%\n` +
                    //                         `* Resources used: ${node.selectedAction?.resourceCost} resource(s)`
                    //                     }

                    // if (node.executionState === 'executing') {
                    //   description =
                    //     `* Time remaining: ${node.formatTimeRemaining(
                    //       false,
                    //     )} \n` + `* Description: ${node.description}`
                    // }

                    return description
                  }}
                />
                {renderNodeActions()}
                {renderExecuteNodePath()}
              </>
            ),
          }}
          panel2={{
            ...ResizablePanel.defaultProps,
            minSize: 400,
            isOpen: true,
            render: () => <OutputPanel mission={mission} />,
          }}
        />
      </div>
    </div>
  )
}
