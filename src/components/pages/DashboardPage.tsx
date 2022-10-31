import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  createTestMission,
  Mission,
  MissionNode,
  MissionNodeAction,
} from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import OutputPanel from '../content/OutputPanel'
import './DashboardPage.scss'
import gameLogic from '../../modules/game-logic'
import ExecuteNodePath from '../content/ExecuteNodePath'
import NodeActions from '../content/NodeActions'

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function DashboardPage(props: {
  show: boolean
}): JSX.Element | null {
  /* -- GLOBAL STATE -- */

  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [currentPagePath, setCurrentPagePath] =
    useStore<string>('currentPagePath')
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
  let [outputPanelIsDisplayed, setOutputPanelIsDisplayed] = useStore<boolean>(
    'outputPanelIsDisplayed',
  )
  let [executeNodePathPromptIsDisplayed, setExecuteNodePathPromptIsDisplayed] =
    useStore<boolean>('executeNodePathPromptIsDisplayed')
  let [actionSelectionPromptIsDisplayed, setActionSelectionPromptIsDisplayed] =
    useStore<boolean>('actionSelectionPromptIsDisplayed')
  let [actionDisplay, setActionDisplay] =
    useStore<Array<MissionNodeAction>>('actionDisplay')
  const [processTime, setProcessTime] = useStore<number>('processTime')
  const [actionName, setActionName] = useStore<string>('actionName')
  const [actionSuccessChance, setActionSuccessChance] = useStore<number>(
    'actionSuccessChance',
  )
  const [mission, setMission] = useStore<Mission | null>('mission')

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  const [lastSelectedNode, setLastSelectedNode] = useState<MissionNode | null>(
    null,
  )

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled) {
      setMountHandled(true)
    }
  }, [mountHandled])

  /* -- COMPONENTS -- */

  /* -- COMPONENT FUNCTIONS -- */

  // This forces a rerender of the component.
  const forceUpdate = (): void => {
    setForcedUpdateCounter(forcedUpdateCounter + 1)
  }

  // This will logout the current user.
  const logout = () => {
    setLoadingMessage('')

    usersModule.logout(
      () => {
        setLastLoadingMessage('Signing out...')
        setCurrentUser(null)
        setLoadingMessage(null)
        setCurrentPagePath('AuthPage')
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
    setCurrentPagePath(currentUser === null ? 'AuthPage' : 'MissionFormPage')
  }

  // This will switch to the edit mission form.
  const editMission = () => {
    setCurrentPagePath('MissionFormPage')
  }

  /* -- RENDER -- */

  let show: boolean = props.show

  let className: string = 'DashboardPage'

  if (
    outputPanelIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === false &&
    actionSelectionPromptIsDisplayed === false
  ) {
    className += ' DashboardPageWithOutputPanelOnly'
  } else if (
    outputPanelIsDisplayed === true &&
    actionSelectionPromptIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === false
  ) {
    className += ' DashboardPageWithOutputPanelAndNodeActionPrompt'
  } else if (
    outputPanelIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === true &&
    actionSelectionPromptIsDisplayed === false
  ) {
    className += ' DashboardPageWithOutputPanelAndExecuteNodePathPrompt'
  } else {
    className += ' DashboardPageWithMapOnly'
  }

  // Keeps track of if the user is logged in or not.
  // If the user is not logged in then the sign out button will not display.
  // If the user is logged in then the "Login" button will change to "Edit Mission"
  // and the "Sign Out" button will appear.
  let navClassName = 'Navigation'

  if (currentUser !== null) {
    navClassName += ' SignOut'
  }

  if (show && mission !== null) {
    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className={navClassName}>
          <Branding />
          <div className='EditMission Link' onClick={editMission}>
            Edit mission
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
                  for (let nodeActionItem of selectedNode.nodeActionItems) {
                    actionDisplay.push(nodeActionItem)
                  }
                  if (mission.disableNodes === false) {
                    setActionSelectionPromptIsDisplayed(true)
                  }
                }
              }}
              applyNodeClassName={(node: MissionNode) => {
                let className = ''

                if (node.executable) {
                  className += 'ExecutableNode'
                }

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
                let description = ''
                let nodeActionDisplay = 'None selected'

                if (node.selectedNodeAction !== null) {
                  nodeActionDisplay = node.selectedNodeAction.text
                }

                if (node.executable === true && node.executed) {
                  description =
                    `* Executed node in ${
                      (node.selectedNodeAction?.timeDelay as number) / 1000
                    } second(s)\n` +
                    `* Node action executed: ${node.selectedNodeAction?.text}\n` +
                    `* Chance of success: ${
                      (node.successChance as number) * 100
                    }%\n`
                }

                return description
              }}
            />
            <OutputPanel />
            <NodeActions selectedNode={lastSelectedNode} />
            <ExecuteNodePath selectedNode={lastSelectedNode} />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
