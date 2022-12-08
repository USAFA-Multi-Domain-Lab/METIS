import { useEffect, useState } from 'react'
import {
  copyMission,
  deleteMission,
  getMission,
  Mission,
  setLive,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import MissionMap from '../content/MissionMap'
import OutputPanel from '../content/OutputPanel'
import './GamePage.scss'
import gameLogic from '../../modules/game-logic'
import ExecuteNodePath from '../content/ExecuteNodePath'
import NodeActions from '../content/NodeActions'
import { IPage } from '../App'
import { MissionNode } from '../../modules/mission-nodes'
import AppState, { AppActions } from '../AppState'
import { Action, EActionPurpose } from '../content/Action'
import Toggle, { EToggleLockState } from '../content/Toggle'
import Tooltip from '../content/Tooltip'
import Navigation from '../content/Navigation'
import { AxiosError } from 'axios'
import { MissionNodeAction } from '../../modules/mission-node-actions'

export interface IGamePage extends IPage {
  missionID: string
}

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
  const [processTime, setProcessTime] = useState<number>(0)
  const [actionDisplay, setActionDisplay] = useState<Array<MissionNodeAction>>(
    [],
  )

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
        returningPageProps: { missionID: mission.missionID },
      })

    // This will switch to the auth page.
    const login = () =>
      appActions.goToPage('AuthPage', {
        returningPagePath: 'GamePage',
        returningPageProps: { missionID: mission.missionID },
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
    let actionsClassName = 'ActionsContainer'
    let displayLogin: boolean = true
    let displayLogout: boolean = false

    if (appState.currentUser !== null) {
      actionsClassName += ' show'
      displayLogin = false
      displayLogout = true
    }

    // Logic that will lock the mission toggle while a request is being sent
    // to set the mission.live paramter
    let lockLiveToggle: EToggleLockState = EToggleLockState.Unlocked
    if (liveAjaxStatus === EAjaxStatus.Loading && mission.live) {
      lockLiveToggle = EToggleLockState.LockedActivation
    } else if (liveAjaxStatus === EAjaxStatus.Loading && !mission.live) {
      lockLiveToggle = EToggleLockState.LockedDeactivation
    } else {
      lockLiveToggle = EToggleLockState.Unlocked
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
            <div className='ResourceAndActionContainer'>
              <div className={resourcesClassName}>
                Resources remaining: {mission.resources}
              </div>
              <div className={actionsClassName}>
                <Action
                  purpose={EActionPurpose.Edit}
                  handleClick={() => {
                    appActions.goToPage('MissionFormPage', {
                      missionID: mission.missionID,
                    })
                  }}
                  tooltipDescription={'Edit mission.'}
                />
                <Action
                  purpose={EActionPurpose.Remove}
                  handleClick={() => {
                    appActions.confirm(
                      'Are you sure you want to delete this mission?',
                      (concludeAction: () => void) => {
                        concludeAction()
                        appActions.beginLoading('Deleting mission...')

                        deleteMission(
                          mission.missionID,
                          () => {
                            appActions.notify(
                              `Successfully deleted ${mission.name}.`,
                            )
                            appActions.goToPage('MissionSelectionPage', {})
                          },
                          () => {
                            appActions.notify(
                              `Failed to delete ${mission.name}.`,
                            )
                          },
                        )
                      },
                      {
                        pendingMessageUponConfirm: 'Deleting...',
                      },
                    )
                  }}
                  tooltipDescription={'Remove mission.'}
                />
                <Action
                  purpose={EActionPurpose.Copy}
                  handleClick={() => {
                    appActions.confirm(
                      'Enter the name of the new mission.',
                      (concludeAction: () => void, entry: string) => {
                        concludeAction()
                        appActions.beginLoading('Copying mission...')

                        copyMission(
                          mission.missionID,
                          entry,
                          (copy: Mission) => {
                            appActions.notify(
                              `Successfully copied ${mission.name}.`,
                            )
                            appActions.goToPage('GamePage', {
                              missionID: copy.missionID,
                            })
                            setMountHandled(false)
                            concludeAction()
                          },
                          () => {
                            appActions.notify(`Failed to copy ${mission.name}.`)
                            concludeAction()
                          },
                        )
                      },
                      {
                        requireEntry: true,
                        entryLabel: 'Name',
                        buttonConfirmText: 'Copy',
                        pendingMessageUponConfirm: 'Copying...',
                      },
                    )
                  }}
                  tooltipDescription={'Copy mission.'}
                />
                <div className='ToggleContainer'>
                  <Toggle
                    initiallyActivated={mission.live}
                    lockState={lockLiveToggle}
                    deliverValue={(live: boolean) => {
                      mission.live = live

                      setLive(
                        mission.missionID,
                        live,
                        () => {
                          if (live) {
                            appActions.notify(
                              `${mission.name} was successfully turned on.`,
                              3000,
                            )
                            setLiveAjaxStatus(EAjaxStatus.Loaded)
                          } else {
                            appActions.notify(
                              `${mission.name} was successfully turned off.`,
                              3000,
                            )
                            setLiveAjaxStatus(EAjaxStatus.Loaded)
                          }
                        },
                        () => {
                          if (live) {
                            appActions.notify(
                              `${mission.name} failed to turn on.`,
                              3000,
                            )
                            setLiveAjaxStatus(EAjaxStatus.Error)
                          } else {
                            appActions.notify(
                              `${mission.name} failed to turn off.`,
                              3000,
                            )
                            setLiveAjaxStatus(EAjaxStatus.Error)
                          }
                        },
                      )
                      setLiveAjaxStatus(EAjaxStatus.Loading)
                    }}
                  />
                  <Tooltip
                    description={
                      !mission.live
                        ? 'Sets mission as live thus allowing students to access it.'
                        : 'Disables mission thus preventing students from accessing it.'
                    }
                  />
                </div>
              </div>
            </div>
            <MissionMap
              mission={mission}
              missionAjaxStatus={EAjaxStatus.Loaded}
              handleNodeSelection={(selectedNode: MissionNode) => {
                setLastSelectedNode(selectedNode)

                if (selectedNode.preExecutionText !== '') {
                  let timeStamp: number = 5 * (new Date() as any)
                  consoleOutputs.push({
                    date: timeStamp,
                    value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                      ' ',
                      '-',
                    )}: </span>
                              <span class='default'>${
                                selectedNode.preExecutionText
                              }</span>`,
                  })
                  setOutputPanelIsDisplayed(true)
                }

                if (selectedNode.executable === false) {
                  gameLogic.handleNodeSelection(selectedNode)
                  selectedNode.color = ''
                } else {
                  for (let nodeActionItem of selectedNode.actions) {
                    actionDisplay.push(nodeActionItem)
                  }
                  if (
                    mission.disableNodes === false &&
                    selectedNode.executed === false &&
                    actionDisplay.length > 1
                  ) {
                    setActionSelectionPromptIsDisplayed(true)
                  } else if (actionDisplay.length === 1) {
                    setActionSelectionPromptIsDisplayed(false)
                    setExecuteNodePathPromptIsDisplayed(true)
                    selectedNode.selectedAction = selectedNode.actions[0]
                  } else if (selectedNode.actions.length === 0) {
                    // console.error(
                    //   `${selectedNode.name} has no actions to choose from.`,
                    //   selectedNode.actions,
                    // )
                    setActionSelectionPromptIsDisplayed(true)
                  } else {
                    setActionDisplay([])
                  }
                }
              }}
              applyNodeClassName={(node: MissionNode) => {
                let className = ''

                if (node.executing) {
                  className += ' LoadingBar'
                }

                if (node.executed && node.succeeded) {
                  className += ' succeeded'
                } else if (node.executed && !node.succeeded) {
                  className += ' failed'
                }

                return className
              }}
              renderNodeTooltipDescription={(node: MissionNode) => {
                let description: string = ''
                let nodeActionDisplay = 'None selected'

                if (node.selectedAction !== null) {
                  nodeActionDisplay = node.selectedAction.name
                }

                if (node.executable && node.executed) {
                  description =
                    `* Executed node in ${
                      (node.selectedAction?.processTime as number) / 1000
                    } second(s)\n` +
                    `* Action executed: ${node.selectedAction?.name}\n` +
                    `* Chance of success: ${
                      (node.successChance as number) * 100
                    }%`
                }

                return description
              }}
            />
            <OutputPanel
              consoleOutputs={consoleOutputs}
              setOutputPanelIsDisplayed={setOutputPanelIsDisplayed}
            />
            <NodeActions
              selectedNode={lastSelectedNode}
              setActionSelectionPromptIsDisplayed={
                setActionSelectionPromptIsDisplayed
              }
              setExecuteNodePathPromptIsDisplayed={
                setExecuteNodePathPromptIsDisplayed
              }
              setProcessTime={setProcessTime}
              actionDisplay={actionDisplay}
              setActionDisplay={setActionDisplay}
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
              processTime={processTime}
              actionDisplay={actionDisplay}
              setActionDisplay={setActionDisplay}
              notify={appActions.notify}
            />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
