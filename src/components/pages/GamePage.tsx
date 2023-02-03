import { useEffect, useState } from 'react'
import { getMission, Mission } from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import MissionMap from '../content/react/MissionMap'
import OutputPanel from '../content/react/OutputPanel'
import './GamePage.scss'
import ExecuteNodePath from '../content/react/ExecuteNodePath'
import NodeActions from '../content/react/NodeActions'
import { IPage } from '../App'
import { MissionNode } from '../../modules/mission-nodes'
import AppState, { AppActions } from '../AppState'
import Navigation from '../content/react/Navigation'
import { AxiosError } from 'axios'
import MissionModificationPanel from '../content/react/MissionModificationPanel'
import {
  EPanelSizingMode,
  PanelSizeRelationship,
  ResizablePanel,
} from '../content/ResizablePanels'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { IConsoleOutput } from '../content/react/ConsoleOutput'

export interface IGamePage extends IPage {
  missionID: string
  handleEditRequest: (mission: Mission) => void
  handleDeleteRequest: (mission: Mission) => void
  handleCopyRequest: (mission: Mission) => void
  handleToggleLiveRequest: (mission: Mission, live: boolean) => void
}

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function GamePage(props: IGamePage): JSX.Element | null {
  let appState: AppState = props.appState
  let appActions: AppActions = props.appActions
  let dateFormatStyle: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [mission, setMission] = useState<Mission | null>(null)
  const [lastSelectedNode, setLastSelectedNode] = useState<MissionNode | null>(
    null,
  )
  const [liveAjaxStatus, setLiveAjaxStatus] = useState<EAjaxStatus>(
    EAjaxStatus.NotLoaded,
  )
  const [consoleOutputs, setConsoleOutputs] = useState<
    Array<{ date: number; value: string }>
  >([])
  const [outputPanelIsDisplayed, setOutputPanelIsDisplayed] =
    useState<boolean>(false)
  const [executeNodePathIsDisplayed, setExecuteNodePathIsDisplayed] =
    useState<boolean>(false)
  const [nodeActionsIsDisplayed, setNodeActionsIsDisplayed] =
    useState<boolean>(false)
  const [loadingWidth, setLoadingWidth] = useState<number>(0)

  /* -- COMPONENT EFFECTS -- */

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

  if (mission !== null) {
    /* -- COMPONENTS -- */

    /* -- COMPONENT FUNCTIONS -- */

    // This will logout the current user.
    const logout = () =>
      appActions.logout({
        returningPagePath: 'GamePage',
        returningPageProps: {
          missionID: mission.missionID,
          handleEditRequest: props.handleEditRequest,
          handleDeleteRequest: props.handleDeleteRequest,
          handleCopyRequest: props.handleCopyRequest,
          handleToggleLiveRequest: props.handleToggleLiveRequest,
        },
      })

    // This will switch to the auth page.
    const login = () =>
      appActions.goToPage('AuthPage', {
        returningPagePath: 'GamePage',
        returningPageProps: {
          missionID: mission.missionID,
          handleEditRequest: props.handleEditRequest,
          handleDeleteRequest: props.handleDeleteRequest,
          handleCopyRequest: props.handleCopyRequest,
          handleToggleLiveRequest: props.handleToggleLiveRequest,
        },
      })

    // This will output to the console.
    const outputToConsole = (output: IConsoleOutput): void => {
      let newOutputs = [...consoleOutputs]
      newOutputs.push({ date: Date.now(), value: output.value })
      setConsoleOutputs(newOutputs)
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

    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <Navigation
          links={[
            {
              text: 'Back to selection',
              handleClick: () => {
                appActions.goToPage('MissionSelectionPage', {})
              },
              visible: true,
            },
            { text: 'Login', handleClick: login, visible: displayLogin },
            { text: 'Log out', handleClick: logout, visible: displayLogout },
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
                setMountHandled={setMountHandled}
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
                      loadingWidth={loadingWidth}
                      handleNodeSelection={(selectedNode: MissionNode) => {
                        setLastSelectedNode(selectedNode)

                        if (
                          selectedNode.preExecutionText !== '' &&
                          selectedNode.preExecutionText !== null &&
                          selectedNode.selectedAction?.succeeded !== true
                        ) {
                          let timeStamp: number = 5 * (new Date() as any)
                          consoleOutputs.push({
                            date: timeStamp,
                            value: `<span class='line-cursor'>[${dateFormatStyle.format(
                              Date.now(),
                            )}] MDL@${selectedNode.name.replaceAll(
                              ' ',
                              '-',
                            )}: </span>
                              <span class='default'>${
                                selectedNode.preExecutionText
                              }</span>`,
                          })
                          setOutputPanelIsDisplayed(true)
                        }

                        if (!selectedNode.executable) {
                          if (
                            selectedNode.hasChildren &&
                            !selectedNode.isOpen
                          ) {
                            selectedNode.open()
                          }

                          selectedNode.color = ''
                        } else {
                          if (
                            !mission.disableNodes &&
                            !selectedNode.selectedAction?.succeeded &&
                            selectedNode.actions.length > 1
                          ) {
                            setNodeActionsIsDisplayed(true)
                          } else if (
                            selectedNode.actions.length === 1 &&
                            !selectedNode.selectedAction?.succeeded
                          ) {
                            selectedNode.selectedAction =
                              selectedNode.actions[0]
                            selectedNode.selectedAction.processTime =
                              selectedNode.actions[0].processTime
                            setNodeActionsIsDisplayed(false)
                            setExecuteNodePathIsDisplayed(true)
                          } else if (selectedNode.actions.length === 0) {
                            setNodeActionsIsDisplayed(true)
                          }
                        }
                      }}
                      applyNodeClassName={(node: MissionNode) => {
                        let className: string = ''

                        if (node.executing) {
                          className += ' LoadingBar'
                        }

                        if (node.executed && node.selectedAction?.succeeded) {
                          className += ' succeeded'
                        } else if (
                          node.executed &&
                          !node.selectedAction?.succeeded
                        ) {
                          className += ' failed'
                        }

                        return className
                      }}
                      renderNodeTooltipDescription={(node: MissionNode) => {
                        let description: string = ''
                        let nodeActionDisplay = 'None selected'

                        // This creates the tooltip hover over effect
                        // that displays the description of the node
                        // prior to being executed.
                        if (
                          node !== null &&
                          !node.executed &&
                          !node.executing &&
                          node.description !== ''
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
                            `* Executed node in ${
                              (node.selectedAction?.processTime as number) /
                              1000
                            } second(s)\n` +
                            `* Action executed: ${node.selectedAction?.name}\n` +
                            `* Chance of success: ${
                              (node.selectedAction?.successChance as number) *
                              100
                            }%`
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
                    <ExecuteNodePath
                      isOpen={executeNodePathIsDisplayed}
                      mission={mission}
                      selectedNode={lastSelectedNode}
                      outputToConsole={outputToConsole}
                      handleCloseRequest={() =>
                        setExecuteNodePathIsDisplayed(false)
                      }
                      handleGoBackRequest={() => {
                        if (
                          lastSelectedNode &&
                          lastSelectedNode.actions.length > 1
                        ) {
                          setExecuteNodePathIsDisplayed(false)
                          setNodeActionsIsDisplayed(true)
                        }
                      }}
                      dateFormatStyle={dateFormatStyle}
                      loadingWidth={loadingWidth}
                      setLoadingWidth={setLoadingWidth}
                      notify={appActions.notify}
                    />
                  </>
                ),
              }}
              panel2={{
                ...ResizablePanel.defaultProps,
                minSize: 400,
                isOpen: outputPanelIsDisplayed,
                render: () => (
                  <OutputPanel
                    consoleOutputs={consoleOutputs}
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
