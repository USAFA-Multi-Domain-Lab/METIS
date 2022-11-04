import { useEffect, useState } from 'react'
import { useStore } from 'react-context-hook'
import { getAllMissions, getMission, Mission } from '../../modules/missions'
import { Counter } from '../../modules/numbers'
import { IPageProps } from '../App'
import Branding from '../content/Branding'
import usersModule, { IUser } from '../../modules/users'
import './MissionSelectionPage.scss'

interface IMissionSelectionPageProps extends IPageProps {}

const MissionSelectionPage = (props: {
  pageProps: IMissionSelectionPageProps
}): JSX.Element | null => {
  let pageProps: IMissionSelectionPageProps = props.pageProps

  /* -- GLOBAL STATE -- */

  const [appMountHandled, setAppMountHandled] =
    useStore<boolean>('appMountHandled')
  const [loadingMessage, setLoadingMessage] = useStore<string | null>(
    'loadingMessage',
  )
  const [lastLoadingMessage, setLastLoadingMessage] =
    useStore<string>('lastLoadingMessage')

  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )
  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')

  /* -- COMPONENT STATE -- */

  const [mountHandled, setMountHandled] = useState<boolean>(false)
  const [missions, setMissions] = useState<Array<Mission>>([])

  /* -- COMPONENT EFFECTS -- */

  // Equivalent of componentDidMount.
  useEffect(() => {
    if (!mountHandled && pageProps.isCurrentPage) {
      let loadingMessage: string = 'Getting missions...'

      setLoadingMessage(loadingMessage)

      // This loads the mission in session from the database
      // and stores it in a global state to be used on the GamePage
      // where the Mission Map renders
      getAllMissions(
        (missions: Array<Mission>) => {
          setMissions(missions)
          setLastLoadingMessage(loadingMessage)
          setLoadingMessage(null)
          setMountHandled(true)
        },
        () => {
          setErrorMessage('Failed to retrieve mission.')
          setLastLoadingMessage(loadingMessage)
          setLoadingMessage(null)
          setMountHandled(true)
        },
      )
    } else if (mountHandled && !pageProps.isCurrentPage) {
      setMountHandled(false)
    }
  }, [mountHandled, pageProps.isCurrentPage])

  // If active page.
  if (pageProps.show) {
    /* -- COMPONENT FUNCTIONS -- */

    // This loads the mission in session from the database
    // and stores it in a global state to be used on the GamePage
    // where the Mission Map renders
    const selectMission = (missionIDValue: string) => {
      setLoadingMessage('')

      getMission(
        (selectedMission: Mission) => {
          pageProps.goToPage('GamePage', { mission: selectedMission })
          setLastLoadingMessage('Initializing application...')
          setLoadingMessage(null)
        },
        () => {
          setErrorMessage('Failed to retrieve mission.')
          setLoadingMessage(null)
        },
        missionIDValue,
      )
    }

    // This will logout the current user.
    const logout = () => {
      setLoadingMessage('')

      usersModule.logout(
        () => {
          setLastLoadingMessage('Signing out...')
          setCurrentUser(null)
          setLoadingMessage(null)
          pageProps.goToPage('AuthPage', {
            goBackPagePath: 'MissionSelectionPage',
            goBackPageProps: {},
            postLoginPagePath: 'MissionSelectionPage',
            postLoginPageProps: {},
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
          goBackPagePath: 'MissionSelectionPage',
          goBackPageProps: {},
          postLoginPagePath: 'MissionSelectionPage',
          postLoginPageProps: {},
        })
      }
    }

    /* -- RENDER -- */

    // Keeps track of if the user is logged in or not.
    // If the user is not logged in then the sign out button will not display.
    // If the user is logged in then the "Login" button will change to "Edit Mission"
    // and the "Sign Out" button will appear.
    let navClassName = 'Navigation'

    if (currentUser !== null) {
      navClassName += ' SignOut'
    }

    return (
      <div className='MissionSelectionPage'>
        {/* { Navigation } */}
        <div className={navClassName}>
          <Branding
            goHome={() => pageProps.goToPage('MissionSelectionPage', {})}
            tooltipDescription=''
          />
          <div className='Login Link' onClick={login}>
            Login
          </div>
          <div className='Logout Link' onClick={logout}>
            Sign out
          </div>
        </div>
        {/* { Content } */}
        <div className='MissionListContainer'>
          <ol className='MissionList'>
            Choose your mission:
            {missions.map((mission: Mission) => {
              return (
                <li
                  className='MissionName'
                  key={mission.name}
                  onClick={() => selectMission(mission.missionID)}
                >
                  {' '}
                  {mission.name}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    )
  } else {
    return null
  }
}

export default MissionSelectionPage
