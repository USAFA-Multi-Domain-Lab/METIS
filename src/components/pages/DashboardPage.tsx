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
import NewExecuteWindow from '../content/NewExecuteWindow'

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
  const [executeNodePrompts, setExecuteNodePrompts] =
    useStore<Array<{ date: number; value: string }>>('executeNodePrompts')
  let [outputPanelIsDisplayed, setOutputPanelIsDisplayed] = useStore<
    Array<Boolean>
  >('outputPanelIsDisplayed')
  let [executePromptIsDisplayed, setExecutePromptIsDisplayed] = useStore<
    Array<Boolean>
  >('executePromptIsDisplayed')

  /* -- COMPONENT STATE -- */

  const [missionState, setMissionState] =
    useState<NodeStructureReference>(initialMissionState)
  const [forcedUpdateCounter, setForcedUpdateCounter] = useState<number>(0)

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
    outputPanelIsDisplayed[0] === true &&
    executePromptIsDisplayed[0] === false
  ) {
    className = 'DashboardPageWithOutputPanel'
  } else if (
    outputPanelIsDisplayed[0] === true &&
    executePromptIsDisplayed[0] === true
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
            <NewExecuteWindow />

            <MissionMap
              mission={missionRender}
              missionAjaxStatus={EAjaxStatus.Loaded}
              handleNodeSelection={(selectedNode: MissionNode) => {
                gameLogic.handleNodeSelection(selectedNode, missionState)
                forceUpdate()

                if (currentUser !== null) {
                  let username: string = currentUser.userID

                  setConsoleOutputs([
                    ...consoleOutputs,
                    {
                      date: Date.now(),
                      value: `<span class='line-cursor'>${username}@USAFA: </span>
                              <span class = ${selectedNode.color}>${selectedNode.preExecutionText}</span>`,
                    },
                  ])

                  setExecuteNodePrompts([
                    { date: Date.now(), value: `${selectedNode.name}` },
                  ])

                  setExecutePromptIsDisplayed([true])
                  setOutputPanelIsDisplayed([true])
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
            <OutputPanel />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
