import React, { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { createTestMission, MissionNode } from '../../modules/missions'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import usersModule, { IUser } from '../../modules/users'
import Branding from '../content/Branding'
import MissionMap from '../content/MissionMap'
import OutputBox from '../content/OutputPanel'
import './MissionFormPage.scss'

const syncRate = 1 /* seconds */ * 1000

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function MissionFormPage(props: {
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

  /* -- COMPONENT STATE -- */

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

  /* -- RENDER -- */

  let show: boolean = props.show
  let className: string = 'MissionFormPage'

  if (show) {
    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className='Navigation'>
          <Branding />
          <div className='Logout Link' onClick={logout}>
            Sign out
          </div>
        </div>
        {
          // -- content --
          <div className='Content'>
            <MissionMap
              mission={createTestMission()}
              missionAjaxStatus={EAjaxStatus.Loaded}
              handleNodeSelection={() => {}}
              applyNodeClassName={(node: MissionNode) => ''}
              renderNodeTooltipDescription={(node: MissionNode) => ''}
            />
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
