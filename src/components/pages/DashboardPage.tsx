import React, { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { EAjaxStatus } from '../../modules/ajax'
import usersModule, { IUser } from '../../modules/users'
import './DashboardPage.scss'

const syncRate = 1 /* seconds */ * 1000

// This will render a dashboard with a radar
// on it, indicating air traffic passing by.
export default function DashboardPage(): JSX.Element | null {
  /* -- GLOBAL STATE -- */

  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
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
      },
      () => {
        setLoadingMessage(null)
        setErrorMessage('Server is down. Contact system administrator.')
      },
    )
  }

  /* -- RENDER -- */

  let className: string = 'DashboardPage'

  if (currentUser !== null) {
    return (
      <div className={className}>
        {
          // -- navigation --
        }
        <div className='Navigation'>
          <div className='Heading'>MDL</div>
          <div className='Logout Link' onClick={logout}>
            Sign out
          </div>
        </div>
        {
          // -- content --
          <div className='Content'>
            <div className='States'></div>
          </div>
        }
      </div>
    )
  } else {
    return null
  }
}
