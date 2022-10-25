import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  createTestMission,
  getMission,
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
import { AnyObject } from 'mongoose'

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
  let [
    nodeActionSelectionPromptIsDisplayed,
    setNodeActionSelectionPromptIsDisplayed,
  ] = useStore<boolean>('nodeActionSelectionPromptIsDisplayed')
  let [nodeActionItemDisplay, setNodeActionItemDisplay] = useStore<
    Array<MissionNodeAction>
  >('nodeActionItemDisplay')
  const [processDelayTime, setProcessDelayTime] =
    useStore<number>('processDelayTime')
  const [nodeActionItemText, setNodeActionItemText] =
    useStore<string>('nodeActionItemText')
  const [nodeActionSuccessChance, setNodeActionSuccessChance] =
    useStore<number>('nodeActionSuccessChance')
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
      // getMission((mission: Mission) => {
      //   setMission(mission)
      // })
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
    setLoadingMessage('Signing out...')

    usersModule.logout(
      () => {
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
  const editMission = () => {
    setCurrentPagePath('MissionFormPage')
  }

  /* -- RENDER -- */

  let show: boolean = props.show

  let className: string = 'DashboardPage'

  if (
    outputPanelIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === false &&
    nodeActionSelectionPromptIsDisplayed === false
  ) {
    className += ' DashboardPageWithOutputPanelOnly'
  } else if (
    outputPanelIsDisplayed === true &&
    nodeActionSelectionPromptIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === false
  ) {
    className += ' DashboardPageWithOutputPanelAndNodeActionPrompt'
  } else if (
    outputPanelIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === true &&
    nodeActionSelectionPromptIsDisplayed === false
  ) {
    className += ' DashboardPageWithOutputPanelAndExecuteNodePathPrompt'
  } else {
    className += ' DashboardPageWithMapOnly'
  }

  if (show && mission !== null) {
    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className='Navigation'>
          <Branding />
          <div className='EditMission Link' onClick={editMission}>
            Edit mission
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
                if (currentUser !== null) {
                  let username: string = currentUser.userID

                  setLastSelectedNode(selectedNode)

                  if (selectedNode.preExecutionText !== '') {
                    let timeStamp: number = 5 * (new Date() as any)
                    consoleOutputs.push({
                      date: timeStamp,
                      value: `<span class='line-cursor'>${username}@USAFA: </span>
                              <span class="default">${selectedNode.preExecutionText}</span>`,
                    })
                    setOutputPanelIsDisplayed(true)
                  }

                  if (selectedNode.executable === false) {
                    gameLogic.handleNodeSelection(selectedNode)
                    selectedNode.color = ''
                    return
                  } else {
                    for (let nodeActionItem of selectedNode.nodeActionItems) {
                      nodeActionItemDisplay.push(nodeActionItem)
                    }
                    setNodeActionSelectionPromptIsDisplayed(true)
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
