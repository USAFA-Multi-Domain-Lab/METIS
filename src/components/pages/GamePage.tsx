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
import { IPageProps } from '../App'
import { MissionNodeAction } from '../../modules/mission-node-actions'
import { MissionNode } from '../../modules/mission-nodes'

interface IGamePageProps extends IPageProps {
  missionID: string
}

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function GamePage(props: {
  pageProps: IGamePageProps
}): JSX.Element | null {
  let pageProps: IGamePageProps = props.pageProps

  /* -- GLOBAL STATE -- */

  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [loadingMessage, setLoadingMessage] = useStore<string | null>(
    'loadingMessage',
  )
  const [lastLoadingMessage, setLastLoadingMessage] =
    useStore<string>('lastLoadingMessage')
  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )
  const [consoleOutputs, setConsoleOutputs] =
    useStore<Array<{ date: number; value: string }>>('consoleOutputs')
  const [outputPanelIsDisplayed, setOutputPanelIsDisplayed] = useStore<boolean>(
    'outputPanelIsDisplayed',
  )
  const [
    executeNodePathPromptIsDisplayed,
    setExecuteNodePathPromptIsDisplayed,
  ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
  const [
    actionSelectionPromptIsDisplayed,
    setActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('actionSelectionPromptIsDisplayed')
  const [actionDisplay, setActionDisplay] =
    useStore<Array<MissionNodeAction>>('actionDisplay')

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [mission, setMission] = useState<Mission | null>(null)
  const [lastSelectedNode, setLastSelectedNode] = useState<MissionNode | null>(
    null,
  )

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled && pageProps.isCurrentPage) {
      setLoadingMessage('Launching mission...')
      getMission(
        pageProps.missionID,
        (mission: Mission) => {
          setLoadingMessage(null)
          setLastLoadingMessage('Launching mission...')
          setMission(mission)
          setMountHandled(true)
        },
        (error: Error) => {
          setErrorMessage('Failed to load mission.')
          setMountHandled(true)
        },
      )
    } else if (mountHandled && !pageProps.isCurrentPage) {
      setMission(null)
      setLastSelectedNode(null)
      setMountHandled(false)
    }
  }, [mountHandled, pageProps.isCurrentPage])

  if (pageProps.show && mission !== null) {
    /* -- COMPONENTS -- */

    /* -- COMPONENT FUNCTIONS -- */

    // This will logout the current user.
    const logout = () => {
      setLoadingMessage('')

      usersModule.logout(
        () => {
          setLastLoadingMessage('Signing out...')
          setCurrentUser(null)
          setLoadingMessage(null)
          pageProps.goToPage('AuthPage', {
            goBackPagePath: 'GamePage',
            goBackPageProps: { missionID: mission.missionID },
            postLoginPagePath: 'GamePage',
            postLoginPageProps: { missionID: mission.missionID },
          })
        },
        () => {
          setLoadingMessage(null)
          setErrorMessage('Server is down. Contact system administrator.')
        },
      )
    }

    // This will switch to the edit mission
    // form.
    const login = () => {
      if (currentUser === null) {
        pageProps.goToPage('AuthPage', {
          goBackPagePath: 'GamePage',
          goBackPageProps: { missionID: mission.missionID },
          postLoginPagePath: 'GamePage',
          postLoginPageProps: { missionID: mission.missionID },
        })
      }
    }

    // This will switch to the edit mission form.
    const editMission = () => {
      if (currentUser !== null && mission !== null) {
        pageProps.goToPage('MissionFormPage', {
          missionID: mission.missionID,
        })
      }
    }

    /* -- RENDER -- */

    let className: string = 'GamePage'

    if (
      outputPanelIsDisplayed === true &&
      executeNodePathPromptIsDisplayed === false &&
      actionSelectionPromptIsDisplayed === false
    ) {
      className += ' GamePageWithOutputPanelOnly'
    } else if (
      outputPanelIsDisplayed === true &&
      actionSelectionPromptIsDisplayed === true &&
      executeNodePathPromptIsDisplayed === false
    ) {
      className += ' GamePageWithOutputPanelAndActionPrompt'
    } else if (
      outputPanelIsDisplayed === true &&
      executeNodePathPromptIsDisplayed === true &&
      actionSelectionPromptIsDisplayed === false
    ) {
      className += ' GamePageWithOutputPanelAndExecuteNodePathPrompt'
    } else if (
      outputPanelIsDisplayed === false &&
      executeNodePathPromptIsDisplayed === true &&
      actionSelectionPromptIsDisplayed === false
    ) {
      className += ' GamePageWithExecuteNodePathPromptOnly'
    } else if (
      outputPanelIsDisplayed === false &&
      executeNodePathPromptIsDisplayed === false &&
      actionSelectionPromptIsDisplayed === true
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

    if (currentUser !== null) {
      navClassName += ' SignOut'
    }

    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className={navClassName}>
          <Branding
            goHome={() => pageProps.goToPage('MissionSelectionPage', {})}
            tooltipDescription='Go home.'
            showTooltip={true}
          />
          <div
            className='Home Link'
            onClick={() => pageProps.goToPage('MissionSelectionPage', {})}
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
                  return
                } else {
                  for (let nodeActionItem of selectedNode.actions) {
                    actionDisplay.push(nodeActionItem)
                  }
                  if (
                    mission.disableNodes === false &&
                    selectedNode.executed === false
                  ) {
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
              notify={pageProps.notify}
            />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
