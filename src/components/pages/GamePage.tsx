import { useEffect, useState } from 'react'
import { getMission, Mission } from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import MissionMap from '../content/game/MissionMap'
import OutputPanel from '../content/game/OutputPanel'
import './GamePage.scss'
import ExecuteNodePath from '../content/game/ExecuteNodePath'
import NodeActions from '../content/game/NodeActions'
import { IPage } from '../App'
import { MissionNode } from '../../modules/mission-nodes'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/general-layout/Navigation'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { IConsoleOutput } from '../content/game/ConsoleOutput'
import { GameClient } from '../../modules/games'
import { TMetisSession, User } from '../../modules/users'

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

  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions
  let game: GameClient = props.game
  let mission: Mission = game.mission

  /* -- STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [selectedNode, selectNode] = useState<MissionNode | null>(null)
  const [selectedAction, selectAction] = useState<MissionNodeAction | null>(
    null,
  )

  /* -- VARIABLES -- */

  // Variables that determine whether or not
  // to display various components.
  let displayNodeActions: boolean =
    selectedNode !== null && selectedAction === null
  let displayExecuteNodePath: boolean =
    selectedNode !== null && selectedAction !== null

  // Class names for various components.
  let className: string = 'GamePage Page'
  let resourcesClassName: string = 'Resources'

  /* -- FUNCTIONS -- */

  // This will loop the game,
  // updating at the given tick
  // rate.
  let loop: () => void = () => {
    setTimeout(() => {
      try {
        appActions.forceUpdate()
        loop()
      } catch (error) {}
    }, 1000 / GAME_TICK_RATE)
  }

  /**
   * This will log the current user
   * out, destroying the session.
   */
  const logout = () =>
    appActions.logout({
      returningPagePath: 'MissionSelectionPage',
      returningPageProps: {},
    })

  /**
   * Outputs to the in-browser console.
   * @param {IConsoleOutput} output The output.
   */
  const outputToConsole = (output: IConsoleOutput): void => {
    mission.outputToConsole(output)
  }

  /**
   * Handles the selection of a node in the mission map by the user.
   * @param {MissionNode} node The node that was selected.
   */
  const handleNodeSelection = async (node: MissionNode): Promise<void> => {
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
      if (mission.resources === 0) {
        appActions.notify(`You have no more resources left to spend.`)
      }
      // If there is not enough resources to
      // execute any actions, notify the user.
      else if (
        !node.actions
          .map((action) => action.resourceCost <= mission.resources)
          .includes(true)
      ) {
        appActions.notify(
          `You do not have enough resources to execute any actions.`,
        )
      }
      // Else, select the node.
      else {
        selectNode(node)

        // If the node has only one action,
        // preelect that action as well.
        if (node.actions.length === 1) {
          selectAction(node.actions[0])
        }

        // Force a state update.
        appActions.forceUpdate()
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

  // This will render the execute node path
  // prompt if the user has selected a node
  // and an action.
  const renderExecuteNodePath = () => {
    if (selectedNode !== null && selectedAction !== null) {
      return (
        <ExecuteNodePath
          selectedAction={selectedAction}
          isOpen={displayExecuteNodePath}
          outputToConsole={outputToConsole}
          handleExecutionRequest={() => {
            if (selectedAction) {
              game.executeAction(selectedAction.actionID)
            }
          }}
          handleCloseRequest={clearSelections}
          handleGoBackRequest={() => {
            if (selectedNode && selectedNode.actions.length === 1) {
              clearSelections()
            }
          }}
          notify={appActions.notify}
        />
      )
    }
  }

  /* -- EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      appActions.finishLoading()
      setMountHandled(true)
      loop()
    }
  }, [mountHandled])

  // Equivalent of componentWillUnmount.
  useEffect(() => {
    return () => {
      loop = () => {}
    }
  }, [])

  /* -- PRE-RENDER-PROCESSING -- */

  // If the mission has no resources left,
  // add the red alert class to the resources.
  if (mission.resources <= 0) {
    resourcesClassName += ' RedAlert'
  }

  /* -- RENDER -- */

  // Return the rendered component.
  return (
    <div className={className}>
      {
        // -- navigation --
      }
      <Navigation
        links={[
          {
            text: 'Back to selection',
            key: 'back-to-selection',
            handleClick: () => {
              appActions.goToPage('MissionSelectionPage', {})
            },
            visible: true,
          },
          {
            text: 'Log out',
            key: 'log-out',
            handleClick: logout,
            visible: true,
          },
        ]}
        brandingCallback={() => appActions.goToPage('MissionSelectionPage', {})}
        brandingTooltipDescription='Go home.'
      />
      {
        // -- content --
        <div className='Content'>
          <div className='TopBar'>
            <div className={resourcesClassName}>
              Resources remaining: {mission.resources}
              <span style={{ display: 'inline-block', width: '40px' }}></span>
              Game ID: {game.gameID}
            </div>
            <MissionModificationPanel
              mission={mission}
              appActions={appActions}
              handleSuccessfulCopy={(resultingMission: Mission) => {
                // This gives the user the option
                // to go to the mission they are
                // copying or return to the current
                // mission.
                appActions.confirm(
                  'Would you like to go to the copied mission, or return to the current mission?',
                  (concludeAction: () => void) => {
                    // Return to the current mission
                    setMountHandled(false)
                    appActions.goToPage('GamePage', {
                      missionID: mission.missionID,
                    })
                    appActions.finishLoading()
                    concludeAction()
                  },
                  {
                    handleAlternate: (concludeAction: () => void) => {
                      // Go to the copied mission.
                      setMountHandled(false)
                      appActions.goToPage('GamePage', {
                        missionID: resultingMission.missionID,
                      })
                      appActions.finishLoading()
                      concludeAction()
                    },
                    pendingMessageUponConfirm: 'Launching mission...',
                    pendingMessageUponAlternate: 'Launching mission...',
                    buttonConfirmText: 'Current Mission',
                    buttonAlternateText: 'Copied Mission',
                  },
                )
              }}
              handleSuccessfulDeletion={() => {
                appActions.goToPage('MissionSelectionPage', {})
              }}
              handleSuccessfulToggleLive={() => {}}
            />
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
                    handleNodePathExitRequest={mission.enableAllNodes}
                    grayOutExitNodePathButton={!mission.hasDisabledNodes}
                    applyNodeClassName={(node: MissionNode) => {
                      let className: string = ''

                      if (node.isOpen) {
                        className += ' opened'
                      }

                      if (!node.highlighted) {
                        className += ' faded'
                      }

                      return className
                    }}
                    renderNodeTooltipDescription={(node: MissionNode) => {
                      let description: string = ''
                      let nodeActionDisplay = 'None selected'

                      // This creates the tooltip hover over effect
                      // that displays the description of the node
                      // prior to being executed.
                      if (node !== null && !node.executed && !node.executing) {
                        description = node.description
                      }

                      if (node.selectedAction !== null) {
                        nodeActionDisplay = node.selectedAction.name
                      }

                      // This creates the tooltip hover over effect
                      // that displays the description of the node
                      // after it has been executed.
                      if (node.executable && node.executed) {
                        description =
                          `* Action executed: "${node.selectedAction?.name}"\n` +
                          `* Executed node in ${
                            (node.selectedAction?.processTime as number) / 1000
                          } second(s)\n` +
                          `* Chance of success: ${
                            (node.selectedAction?.successChance as number) * 100
                          }%\n` +
                          `* Resources used: ${node.selectedAction?.resourceCost} resource(s)`
                      }

                      if (node.executing) {
                        description =
                          `* Time remaining: ${node.formatTimeRemaining(
                            false,
                          )} \n` + `* Description: ${node.description}`
                      }

                      return description
                    }}
                  />
                  <NodeActions
                    isOpen={displayNodeActions}
                    selectedNode={selectedNode}
                    handleActionSelectionRequest={selectAction}
                    handleCloseRequest={clearSelections}
                  />
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
      }
    </div>
  )
}
