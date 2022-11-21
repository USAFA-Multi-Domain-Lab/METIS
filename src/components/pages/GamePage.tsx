import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { getMission, Mission } from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import OutputPanel from '../content/OutputPanel'
import './GamePage.scss'
import gameLogic from '../../modules/game-logic'
import ExecuteNodePath from '../content/ExecuteNodePath'
import NodeActions from '../content/NodeActions'
import { IPage } from '../App'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { MissionNode } from '../../modules/mission-nodes'
import AppState, { AppActions } from '../AppState'

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
        (error: Error) => {
          appActions.finishLoading()
          appActions.handleServerError('Failed to load mission.')
          setMountHandled(true)
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

    // This will switch to the login page.
    const login = () =>
      appActions.goToPage('AuthPage', {
        returningPagePath: 'GamePage',
        returningPageProps: { missionID: mission.missionID },
      })

    /* -- RENDER -- */

    let className: string = 'GamePage Page'

    if (
      appState.outputPanelIsDisplayed === true &&
      appState.executeNodePathPromptIsDisplayed === false &&
      appState.actionSelectionPromptIsDisplayed === false
    ) {
      className += ' GamePageWithOutputPanelOnly'
    } else if (
      appState.outputPanelIsDisplayed === true &&
      appState.actionSelectionPromptIsDisplayed === true &&
      appState.executeNodePathPromptIsDisplayed === false
    ) {
      className += ' GamePageWithOutputPanelAndActionPrompt'
    } else if (
      appState.outputPanelIsDisplayed === true &&
      appState.executeNodePathPromptIsDisplayed === true &&
      appState.actionSelectionPromptIsDisplayed === false
    ) {
      className += ' GamePageWithOutputPanelAndExecuteNodePathPrompt'
    } else if (
      appState.outputPanelIsDisplayed === false &&
      appState.executeNodePathPromptIsDisplayed === true &&
      appState.actionSelectionPromptIsDisplayed === false
    ) {
      className += ' GamePageWithExecuteNodePathPromptOnly'
    } else if (
      appState.outputPanelIsDisplayed === false &&
      appState.executeNodePathPromptIsDisplayed === false &&
      appState.actionSelectionPromptIsDisplayed === true
    ) {
      className += ' GamePageWithActionSelectionPromptOnly'
    } else {
      className += ' GamePageWithMapOnly'
    }

    // Keeps track of if the user is logged in or not.
    // If the user is not logged in then the sign out button will not display.
    // If the user is logged in then the "Login" button will change to "Edit Mission"
    // and the "Sign Out" button will appear.
    let navClassName = 'Navigation'

    if (appState.currentUser !== null) {
      navClassName += ' SignOut'
    }

    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className={navClassName}>
          <Branding
            goHome={() => appActions.goToPage('MissionSelectionPage', {})}
            tooltipDescription='Go home.'
            showTooltip={true}
          />
          <div
            className='Home Link'
            onClick={() => appActions.goToPage('MissionSelectionPage', {})}
          >
            Back to selection
          </div>
          <div className='Login Link' onClick={login}>
            Login
          </div>
          <div className='Logout Link' onClick={logout}>
            Sign out
          </div>
        </div>
        {
          // -- content --
          <div className='Content'>
            <div className='Resources'>
              Resources remaining: {mission.resources}
            </div>
            <MissionMap
              mission={mission}
              missionAjaxStatus={EAjaxStatus.Loaded}
              handleNodeSelection={(selectedNode: MissionNode) => {
                setLastSelectedNode(selectedNode)

                if (selectedNode.preExecutionText !== '') {
                  let timeStamp: number = 5 * (new Date() as any)
                  appState.consoleOutputs.push({
                    date: timeStamp,
                    value: `<span class='line-cursor'>MDL@${selectedNode.name.replaceAll(
                      ' ',
                      '-',
                    )}: </span>
                              <span class='default'>${
                                selectedNode.preExecutionText
                              }</span>`,
                  })
                  appState.setOutputPanelIsDisplayed(true)
                }

                if (selectedNode.executable === false) {
                  gameLogic.handleNodeSelection(selectedNode)
                  selectedNode.color = ''
                  return
                } else {
                  for (let nodeActionItem of selectedNode.actions) {
                    appState.actionDisplay.push(nodeActionItem)
                  }
                  if (
                    mission.disableNodes === false &&
                    selectedNode.executed === false
                  ) {
                    appState.setActionSelectionPromptIsDisplayed(true)
                  } else {
                    appState.setActionDisplay([])
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
                    }%\n` +
                    `* Device: ${
                      // This capitalizes the first letter of the word.
                      node.device.toString().charAt(0).toUpperCase() +
                      node.device.toString().slice(1)
                    }\n` +
                    `* Executable: ${
                      node.executable.toString().charAt(0).toUpperCase() +
                      node.executable.toString().slice(1)
                    }`
                }

                // This is for the tooltip message that will display
                if (node.device && node.executable && !node.executed) {
                  description = '* Device: True\n' + '* Executable: True'
                } else if (node.executable && !node.device && !node.executed) {
                  description = '* Device: False\n' + '* Executable: True'
                }

                return description
              }}
            />
            <OutputPanel />
            <NodeActions selectedNode={lastSelectedNode} />
            <ExecuteNodePath
              mission={mission}
              selectedNode={lastSelectedNode}
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
