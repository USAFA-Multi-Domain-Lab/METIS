import React, { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { createTestMission, Mission, MissionNode } from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import OutputPanel from '../content/OutputPanel'
import './DashboardPage.scss'
import gameLogic from '../../modules/game-logic'
import NodeStructureReference from '../../modules/node-reference'
import { AnyObject } from 'mongoose'
import ExecuteNodePrompt from '../content/ExecuteNodePrompt'

const mission = createTestMission()
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
  let [executePromptIsDisplayed, setExecutePromptIsDisplayed] =
    useStore<boolean>('executePromptIsDisplayed')

  /* -- COMPONENT STATE -- */

  const [missionState, setMissionState] =
    useState<NodeStructureReference>(initialMissionState)
  let [lastSelectedNode, setLastSelectedNode] = useState<MissionNode | null>()

  /* -- COMPONENT EFFECTS -- */

  /* -- COMPONENTS -- */

  /* -- COMPONENT FUNCTIONS -- */

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

  if (outputPanelIsDisplayed === true && executePromptIsDisplayed === false) {
    className = 'DashboardPageWithOutputPanel'
  } else if (
    outputPanelIsDisplayed === true &&
    executePromptIsDisplayed === true
  ) {
    className = 'DashboardPageWithOutputPanelAndExecutePrompt'
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

                  let timeStamp: number = 5 * (new Date() as any)
                  consoleOutputs.push({
                    date: timeStamp,
                    value: `<span class='line-cursor'>${username}@USAFA: </span>
                              <span class = ${selectedNode.color}>${selectedNode.preExecutionText}</span>`,
                  })

                  setExecutePromptIsDisplayed(true)
                  setOutputPanelIsDisplayed(true)
                }
              }}
              applyNodeClassName={(node: MissionNode) => {
                switch (node.color) {
                  case 'green':
                    return 'green'
                    break
                  case 'pink':
                    return 'pink'
                    break
                  case 'yellow':
                    return 'yellow'
                    break
                  case 'blue':
                    return 'blue'
                    break
                  case 'purple':
                    return 'purple'
                    break
                  case 'red':
                    return 'red'
                    break
                  case 'khaki':
                    return 'khaki'
                    break
                  case 'orange':
                    return 'orange'
                    break
                  default:
                    return 'default'
                    break
                }
              }}
              renderNodeTooltipDescription={(node: MissionNode) => ''}
            />
            <ExecuteNodePrompt
              name={lastSelectedNode?.name as string}
              selectedNode={lastSelectedNode}
              missionState={missionState}
            />
            <OutputPanel />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
