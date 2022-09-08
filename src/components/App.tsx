import './App.scss'
import DashboardPage from './pages/DashboardPage'
import AuthPage from './pages/AuthPage'
import { useStore, withStore } from 'react-context-hook'
import usersModule, { IUser } from '../modules/users'
import { useEffect, useState } from 'react'
import ServerErrorPage from './pages/ServerErrorPage'
import LoadingPage from './pages/LoadingPage'

const loadingMinTime = 500

// This function normalizes how pages are rendered.
// in the application.
function StandardPage(props: {
  Page: () => JSX.Element | null
}): JSX.Element | null {
  const [appMountHandled] = useStore('appMountHandled')
  const [errorMessage] = useStore('errorMessage')
  const [loadingMessage] = useStore('loadingMessage')
  const [loadingMinTimeReached] = useStore('loadingMinTimeReached')

  let Page = props.Page

  if (
    appMountHandled &&
    loadingMessage === null &&
    loadingMinTimeReached &&
    errorMessage === null
  ) {
    return <Page />
  } else {
    return null
  }
}

// This is the renderer for the entire application.
function App(): JSX.Element | null {
  // -- GLOBAL STATE --

  const [currentUser, setCurrentUser] = useStore<IUser | null>('currentUser')
  const [appMountHandled, setAppMountHandled] =
    useStore<boolean>('appMountHandled')
  const [loadingMessage, setLoadMessage] = useStore<string | null>(
    'loadingMessage',
  )
  const [lastLoadingMessage, setLastLoadingMessage] =
    useStore<string>('lastLoadingMessage')
  const [loadingMinTimeReached, setLoadingMinTimeReached] = useStore<boolean>(
    'loadingMinTimeReached',
  )
  const [errorMessage, setErrorMessage] = useStore<string | null>(
    'errorMessage',
  )

  const [consoleOutputs, setConsoleOutputs] =
    useStore<string[]>('consoleOutputs')

  // -- COMPONENT STATE --

  const [loadingMinTimeout, setLoadingMinTimeout] = useState<any>(undefined)

  // -- COMPONENT EFFECTS --

  // This is called to handle the app being mounted,
  // will load the user in the session to see if a
  // login is necessary.
  useEffect(() => {
    if (!appMountHandled) {
      usersModule.retrieveCurrentUser(
        (currentUser: IUser | null) => {
          setCurrentUser(currentUser)
          setAppMountHandled(true)
          setLoadMessage(null)
        },
        () => {
          setErrorMessage('Server is down. Contact server administrator.')
          setAppMountHandled(true)
          setLoadMessage(null)
        },
      )
    }
  }, [appMountHandled])

  // This handles the minTime variables, which are
  // used to set a minumum time that the load screen
  // is displayed for.
  useEffect(() => {
    if (loadingMessage !== null) {
      clearTimeout(loadingMinTimeout)

      setLastLoadingMessage(loadingMessage)
      setLoadingMinTimeReached(false)
      setLoadingMinTimeout(
        setTimeout(() => {
          setLoadingMinTimeReached(true)
          setLoadingMinTimeout(undefined)
        }, loadingMinTime),
      )
    }
  }, [loadingMessage])

  return (
    <div className='App' key={'App'}>
      <StandardPage Page={AuthPage} />
      <StandardPage Page={DashboardPage} />
      <ServerErrorPage />
      <LoadingPage />
    </div>
  )
}

// -- GLOBAL APPLICATION STATE --

// This is the interface defining the global
// state for the application.
interface IGlobalState {
  currentUser: IUser | null
  appMountHandled: boolean
  loadingMinTimeReached: boolean
  loadingMessage: string | null
  lastLoadingMessage: string
  errorMessage: string | null
  consoleOutputs: Array<{ date: number; value: string }>
}

// This is the initial state of the application.
const initialGlobalState: IGlobalState = {
  currentUser: null,
  appMountHandled: false,
  loadingMessage: 'Initializing application...',
  lastLoadingMessage: '',
  loadingMinTimeReached: false,
  errorMessage: null,
  consoleOutputs: [],
}

export default withStore(App, initialGlobalState)
