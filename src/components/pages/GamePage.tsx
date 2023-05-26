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
import { AxiosError } from 'axios'
import MissionModificationPanel from '../content/user-controls/MissionModificationPanel'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/general-layout/ResizablePanels'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { IConsoleOutput } from '../content/game/ConsoleOutput'

export interface IGamePage extends IPage {
  missionID: string
}

// This is the number of times per
// second that the game updates.
const GAME_TICK_RATE: number = 20

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function GamePage(props: IGamePage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [mission, setMission] = useState<Mission | null>(null)
  const [lastSelectedNode, setLastSelectedNode] = useState<MissionNode | null>(
    null,
  )
  const [outputPanelIsDisplayed, setOutputPanelIsDisplayed] =
    useState<boolean>(false)
  const [executeNodePathIsDisplayed, setExecuteNodePathIsDisplayed] =
    useState<boolean>(false)
  const [nodeActionsIsDisplayed, setNodeActionsIsDisplayed] =
    useState<boolean>(false)

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

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      appActions.beginLoading('Launching mission...')
      getMission(
        props.missionID,
        (mission: Mission) => {
          appActions.finishLoading()
          setMission(mission)
          setMountHandled(true)
          loop()
        },
        (error: AxiosError) => {
          if (error.response?.status === 401) {
            appActions.goToPage('MissionSelectionPage', {})
            appActions.notify(
              'Please select a different mission. The last-selected mission is not accesible to students.',
            )
          } else {
            appActions.finishLoading()
            appActions.handleServerError('Failed to load mission.')
            setMountHandled(true)
          }
        },
      )
    }
  }, [mountHandled])

  // Equivalent of componentWillUnmount.
  useEffect(() => {
    return () => {
      loop = () => {}
    }
  }, [])

  if (mission !== null) {
    // This will logout the current user.
    const logout = () =>
      appActions.logout({
        returningPagePath: 'GamePage',
        returningPageProps: {
          missionID: mission.missionID,
        },
      })

    // This will switch to the auth page.
    const login = () =>
      appActions.goToPage('AuthPage', {
        returningPagePath: 'GamePage',
        returningPageProps: {
          missionID: mission.missionID,
        },
      })

    // This will output to the console.
    const outputToConsole = (output: IConsoleOutput): void => {
      mission.outputToConsole(output)
      setOutputPanelIsDisplayed(true)
    }

    /* -- RENDER -- */

    let className: string = 'GamePage Page'

    // Keeps track of if the user is logged in or not.
    let displayLogin: boolean = appState.currentUser === null
    let displayLogout: boolean = !displayLogin

    // Logic that lets the user visually grab their attention to show them that
    // they don't have any more resources left to spend.
    let resourcesClassName: string = 'Resources'

    if (mission.resources <= 0) {
      resourcesClassName += ' RedAlert'
    }

    // This will render the execute node path
    // prompt if the user has selected a node
    // and an action.
    const renderExecuteNodePath = () => {
      if (
        lastSelectedNode !== null &&
        lastSelectedNode.selectedAction !== null
      ) {
        return (
          <ExecuteNodePath
            selectedAction={lastSelectedNode.selectedAction}
            isOpen={executeNodePathIsDisplayed}
            outputToConsole={outputToConsole}
            handleCloseRequest={() => setExecuteNodePathIsDisplayed(false)}
            handleGoBackRequest={() => {
              if (lastSelectedNode && lastSelectedNode.actions.length > 1) {
                setExecuteNodePathIsDisplayed(false)
                setNodeActionsIsDisplayed(true)
              }
            }}
            notify={appActions.notify}
          />
        )
      }
    }

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
              text: 'Login',
              key: 'login',
              handleClick: login,
              visible: displayLogin,
            },
            {
              text: 'Log out',
              key: 'log-out',
              handleClick: logout,
              visible: displayLogout,
            },
          ]}
          brandingCallback={() =>
            appActions.goToPage('MissionSelectionPage', {})
          }
          brandingTooltipDescription='Go home.'
        />
        {
          // -- content --
          <div className='Content'>
            <div className='TopBar'>
              <div className={resourcesClassName}>
                Resources remaining: {mission.resources}
              </div>
              <MissionModificationPanel
                mission={mission}
                appActions={appActions}
                handleSuccessfulCopy={(resultingMission: Mission) => {
                  appActions.goToPage('GamePage', {
                    missionID: resultingMission.missionID,
                  })
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
                      handleNodeSelection={(selectedNode: MissionNode) => {
                        setLastSelectedNode(selectedNode)

                        // Logic to send the pre-execution text to the output panel
                        if (
                          selectedNode.preExecutionText !== '' &&
                          selectedNode.preExecutionText !== null
                        ) {
                          let output: IConsoleOutput =
                            OutputPanel.renderPreExecutionOutput(selectedNode)
                          outputToConsole(output)
                        }

                        // Logic that opens the next level of nodes
                        // (displays the selected node's child nodes)
                        if (
                          !selectedNode.executable &&
                          selectedNode.hasChildren &&
                          !selectedNode.isOpen
                        ) {
                          selectedNode.open()
                        }

                        // Logic that displays the node action &&
                        // execute node path window prompts. It also
                        // notifies the user if they click a node and
                        // nothing happens.
                        if (
                          mission.resources > 0 &&
                          selectedNode.executable &&
                          !selectedNode.selectedAction?.succeeded &&
                          !selectedNode.executing
                        ) {
                          setNodeActionsIsDisplayed(true)

                          if (selectedNode.actions.length === 1) {
                            selectedNode.selectedAction =
                              selectedNode.actions[0]
                            selectedNode.selectedAction.processTime =
                              selectedNode.actions[0].processTime
                            setNodeActionsIsDisplayed(false)

                            if (selectedNode.selectedAction.readyToExecute) {
                              setExecuteNodePathIsDisplayed(true)
                            } else {
                              appActions.notify(
                                `You cannot execute this action because you do not have enough resources remaining.`,
                                { duration: 3500 },
                              )
                            }
                          }
                        } else if (
                          mission.resources === 0 &&
                          selectedNode.executable &&
                          !selectedNode.selectedAction?.succeeded &&
                          !selectedNode.executing
                        ) {
                          appActions.notify(
                            `You have no more resources left to spend.`,
                            { duration: 3500 },
                          )
                        }
                      }}
                      applyNodeClassName={(node: MissionNode) => ''}
                      renderNodeTooltipDescription={(node: MissionNode) => {
                        let description: string = ''
                        let nodeActionDisplay = 'None selected'

                        // This creates the tooltip hover over effect
                        // that displays the description of the node
                        // prior to being executed.
                        if (
                          node !== null &&
                          !node.executed &&
                          !node.executing
                        ) {
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
                              (node.selectedAction?.processTime as number) /
                              1000
                            } second(s)\n` +
                            `* Chance of success: ${
                              (node.selectedAction?.successChance as number) *
                              100
                            }%\n` +
                            `* Resources used: ${node.selectedAction?.resourceCost} resource(s)`
                        }

                        if (node.executing) {
                          description =
                            `* Time remaining: ${node.formatTimeRemaining(
                              false,
                            )} \n` + `* Description: ${node.description}\n`
                        }

                        return description
                      }}
                    />
                    <NodeActions
                      isOpen={nodeActionsIsDisplayed}
                      selectedNode={lastSelectedNode}
                      handleActionSelectionRequest={(
                        action: MissionNodeAction,
                      ) => {
                        setNodeActionsIsDisplayed(false)

                        if (lastSelectedNode !== null) {
                          lastSelectedNode.selectedAction = action
                          if (lastSelectedNode.selectedAction !== null) {
                            lastSelectedNode.selectedAction.processTime =
                              action.processTime
                          }
                          setExecuteNodePathIsDisplayed(true)
                        }
                      }}
                      handleCloseRequest={() =>
                        setNodeActionsIsDisplayed(false)
                      }
                    />
                    {renderExecuteNodePath()}
                  </>
                ),
              }}
              panel2={{
                ...ResizablePanel.defaultProps,
                minSize: 400,
                isOpen: outputPanelIsDisplayed,
                render: () => (
                  <OutputPanel
                    mission={mission}
                    setOutputPanelIsDisplayed={setOutputPanelIsDisplayed}
                  />
                ),
              }}
            />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
