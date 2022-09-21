import React, { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { Mission, MissionNode } from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import OutputBox from '../content/OutputPanel'
import './DashboardPage.scss'
import gameLogic from '../../modules/game-logic'

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

  /* -- COMPONENT STATE -- */

  const [missionState, setMissionState] = useState<Mission>(
    gameLogic.createInitialMissionState(),
  )

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
              mission={missionState}
              missionAjaxStatus={EAjaxStatus.Loaded}
              handleNodeSelection={(selectedNode: MissionNode) => {
                let currentMissionState: Mission = missionState
                let updatedMissionState: Mission =
                  gameLogic.handleNodeSelection(
                    currentMissionState,
                    selectedNode,
                  )

                setMissionState(updatedMissionState)

                console.log(selectedNode)

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
                }
              }}
              // use ref below
              // const BorderBox = document.querySelector('.BorderBox')
              // BorderBox?.scrollTo(0, 10000000000000000)
              // terminalScroll={() => {}}
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
                    return '#ffffff'
                    break
                }
              }}
              renderNodeTooltipDescription={(node: MissionNode) => ''}
            />
            <OutputBox />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
