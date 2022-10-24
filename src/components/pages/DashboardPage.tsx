import React, { useState } from 'react'
import { useStore } from 'react-context-hook'
import {
  createMission,
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
import NodeStructureReference from '../../modules/node-reference'
import ExecuteNodePath from '../content/ExecuteNodePath'
import NodeActions from '../content/NodeActions'
import NodeHoverDisplay from '../content/NodeHoverDisplay'
import Tooltip from '../content/Tooltip'
import List from '../content/List'

const mission = createMission()
const initialMissionState =
  NodeStructureReference.constructNodeStructureReference(
    mission.name,
    mission.nodeStructure,
  )

initialMissionState.expand()

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
  let [selectedDivElement, setSelectedDivElement] =
    useStore<HTMLDivElement>('selectedDivElement')

  /* -- COMPONENT STATE -- */

  const [missionState, setMissionState] =
    useState<NodeStructureReference>(initialMissionState)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)
  let [lastSelectedNode, setLastSelectedNode] = useState<MissionNode | null>()

  /* -- COMPONENT EFFECTS -- */

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

  let missionRender = Mission.renderMission(
    mission,
    missionState,
    mission.nodeStructure,
  )

  if (
    outputPanelIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === false &&
    nodeActionSelectionPromptIsDisplayed === false
  ) {
    className = 'DashboardPageWithOutputPanelOnly'
  } else if (
    outputPanelIsDisplayed === true &&
    nodeActionSelectionPromptIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === false
  ) {
    className = 'DashboardPageWithOutputPanelAndNodeActionPrompt'
  } else if (
    outputPanelIsDisplayed === true &&
    executeNodePathPromptIsDisplayed === true &&
    nodeActionSelectionPromptIsDisplayed === false
  ) {
    className = 'DashboardPageWithOutputPanelAndExecuteNodePathPrompt'
  }

  if (show) {
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
              mission={missionRender}
              missionAjaxStatus={EAjaxStatus.Loaded}
              handleNodeSelection={(selectedNode: MissionNode) => {
                if (currentUser !== null) {
                  let username: string = currentUser.userID

                  if (selectedNode !== undefined) {
                    lastSelectedNode = selectedNode
                    setLastSelectedNode(lastSelectedNode)
                  }

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
                    gameLogic.handleNodeSelection(selectedNode, missionState)
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
                let className = ' '

                switch (node.color) {
                  case 'green':
                    className = 'green'
                    break
                  case 'pink':
                    className = 'pink'
                    break
                  case 'yellow':
                    className = 'yellow'
                    break
                  case 'blue':
                    className = 'blue'
                    break
                  case 'purple':
                    className = 'purple'
                    break
                  case 'red':
                    className = 'red'
                    break
                  case 'khaki':
                    className = 'khaki'
                    break
                  case 'orange':
                    className = 'orange'
                    break
                  default:
                    className = 'default'
                    break
                }
                if (node.executing) {
                  className = 'LoadingBar'

                  let selectedNodeParentDiv =
                    document.querySelector<HTMLDivElement>('.LoadingBar')
                  if (selectedNodeParentDiv !== null) {
                    setSelectedDivElement(selectedNodeParentDiv)
                  }
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
            <NodeActions
              selectedNode={lastSelectedNode}
              missionState={missionState}
            />
            <ExecuteNodePath
              selectedNode={lastSelectedNode}
              missionState={missionState}
            />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
