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
import ActionRow from '../content/react/ActionRow'

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
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useState<boolean>(false)
  const [
    actionSelectionPromptIsDisplayed,
    setActionSelectionPromptIsDisplayed,
  ] = useState<boolean>(false)
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

    /* -- RENDER -- */

    let className: string = 'GamePage Page'

    if (
      outputPanelIsDisplayed === true &&
      executeNodePathPromptIsDisplayed === false &&
      actionSelectionPromptIsDisplayed === false
    ) {
      className += ' DisplayOutputPanel'
    } else if (
      outputPanelIsDisplayed === true &&
      actionSelectionPromptIsDisplayed === true &&
      executeNodePathPromptIsDisplayed === false
    ) {
      className += ' DisplayOutputAndActionPrompt'
    } else if (
      outputPanelIsDisplayed === true &&
      executeNodePathPromptIsDisplayed === true &&
      actionSelectionPromptIsDisplayed === false
    ) {
      className += ' DisplayOutputPanelAndPathPrompt'
    } else if (
      outputPanelIsDisplayed === false &&
      executeNodePathPromptIsDisplayed === true &&
      actionSelectionPromptIsDisplayed === false
    ) {
      className += ' DisplayPathPrompt'
    } else if (
      outputPanelIsDisplayed === false &&
      executeNodePathPromptIsDisplayed === false &&
      actionSelectionPromptIsDisplayed === true
    ) {
      className += ' DisplayActionPrompt'
    } else {
      className += ' DisplayMapOnly'
    }

    // Keeps track of if the user is logged in or not.
    let displayLogin: boolean = true
    let displayLogout: boolean = false

    if (appState.currentUser !== null) {
      displayLogin = false
      displayLogout = true
    }

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
            <ActionRow
              mission={mission}
              uniqueClassName={resourcesClassName}
              innerText={`Resources remaining: ${mission.resources}`}
              liveAjaxStatus={liveAjaxStatus}
              appState={appState}
              handleEditRequest={() => props.handleEditRequest(mission)}
              handleDeleteRequest={() => props.handleDeleteRequest(mission)}
              handleCopyRequest={() => props.handleCopyRequest(mission)}
              handleToggleLiveRequest={(live: boolean) =>
                props.handleToggleLiveRequest(mission, live)
              }
            />
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
                    )}] MDL@${selectedNode.name.replaceAll(' ', '-')}: </span>
                              <span class='default'>${
                                selectedNode.preExecutionText
                              }</span>`,
                  })
                  setOutputPanelIsDisplayed(true)
                }

                if (!selectedNode.executable) {
                  if (selectedNode.hasChildren && !selectedNode.isOpen) {
                    selectedNode.open()
                  }

                  selectedNode.color = ''
                } else {
                  if (!mission.disableNodes) {
                    if (
                      !selectedNode.selectedAction?.succeeded &&
                      selectedNode.actions.length > 1
                    ) {
                      setActionSelectionPromptIsDisplayed(true)
                    } else if (
                      selectedNode.actions.length === 1 &&
                      !selectedNode.selectedAction?.succeeded
                    ) {
                      selectedNode.selectedAction = selectedNode.actions[0]
                      selectedNode.selectedAction.processTime =
                        selectedNode.actions[0].processTime
                      setActionSelectionPromptIsDisplayed(false)
                      setExecuteNodePathPromptIsDisplayed(true)
                    } else if (selectedNode.actions.length === 0) {
                      setActionSelectionPromptIsDisplayed(true)
                    }
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
                } else if (node.executed && !node.selectedAction?.succeeded) {
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
                      (node.selectedAction?.processTime as number) / 1000
                    } second(s)\n` +
                    `* Action executed: ${node.selectedAction?.name}\n` +
                    `* Chance of success: ${
                      (node.selectedAction?.successChance as number) * 100
                    }%`
                }

                return description
              }}
            />
            <NodeActions
              selectedNode={lastSelectedNode}
              setActionSelectionPromptIsDisplayed={
                setActionSelectionPromptIsDisplayed
              }
              setExecuteNodePathPromptIsDisplayed={
                setExecuteNodePathPromptIsDisplayed
              }
            />
            <ExecuteNodePath
              mission={mission}
              selectedNode={lastSelectedNode}
              consoleOutputs={consoleOutputs}
              setConsoleOutputs={setConsoleOutputs}
              setActionSelectionPromptIsDisplayed={
                setActionSelectionPromptIsDisplayed
              }
              setExecuteNodePathPromptIsDisplayed={
                setExecuteNodePathPromptIsDisplayed
              }
              loadingWidth={loadingWidth}
              setLoadingWidth={setLoadingWidth}
              notify={appActions.notify}
              dateFormatStyle={dateFormatStyle}
            />
            <OutputPanel
              consoleOutputs={consoleOutputs}
              setOutputPanelIsDisplayed={setOutputPanelIsDisplayed}
            />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
