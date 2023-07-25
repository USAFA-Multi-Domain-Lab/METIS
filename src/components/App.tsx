import './App.scss'
import GamePage from './pages/GamePage'
import AuthPage from './pages/AuthPage'
import { IMetisSession, User } from '../modules/users'
import { useEffect, useState } from 'react'
import ServerErrorPage from './pages/ServerErrorPage'
import LoadingPage from './pages/LoadingPage'
import AppState, { AppActions } from './AppState'
import Markdown, { MarkdownTheme } from './content/general-layout/Markdown'
import MissionFormPage from './pages/MissionFormPage'
import MissionSelectionPage from './pages/MissionSelectionPage'
import Notification from '../modules/notifications'
import NotificationBubble from './content/communication/NotificationBubble'
import Confirmation from './content/communication/Confirmation'
import {
  tooltipsOffsetX,
  tooltipsOffsetY,
} from './content/communication/Tooltip'
import Prompt from './content/communication/Prompt'
import ChangelogPage from './pages/ChangelogPage'
import { Mission } from '../modules/missions'

// Default props in every page.
export interface IPage {
  appState: AppState
  appActions: AppActions
}

// This is a registry of all pages
// in the system for use.
let pageRegistry: Map<string, (props: any) => JSX.Element | null> = new Map<
  string,
  (props: any) => JSX.Element | null
>()

// This will register a specific page
// with the given path so that it can
// be switched to by the application
// from other pages.
export function registerPage<TPage extends IPage>(
  targetPagePath: string,
  Page: (props: TPage) => JSX.Element | null,
): void {
  pageRegistry.set(targetPagePath, Page)
}

// This is the renderer for the entire application.
function App(props: {
  appState: AppState
  appActions: AppActions
}): JSX.Element | null {
  let appState = props.appState
  let appActions = props.appActions

  /* -- COMPONENT STATE -- */

  const [loadingMinTimeout, setLoadingMinTimeout] = useState<any>(undefined)

  /* -- COMPONENT FUNCTIONS -- */

  /**
   * Stops the session sync from occurring. This is during mount.
   */
  let endSessionSync = (): void => {}

  /**
   * Continually syncs the session with the server (Once a second or longer if latent). Storing updated session data in the app state.
   * @param initialCallback A callback made when the session is first synced. Every subsequent sync will not use this callback.
   * @param initialCall Recursively used parameter used to determine if this is the first call to this function. This parameter should be ignored.
   */
  const syncSession = (
    initialCallback: (
      session: IMetisSession,
      endSync: () => void,
    ) => void = () => {},
  ): void => {
    let initialCall: boolean = true

    // Used internally to track the when
    // the initial call is made.
    let sync = () => {
      let preRequestTimestamp: number = Date.now()

      // Fetch the current session from the server.
      User.fetchSession()
        .then((session: IMetisSession) => {
          // Save the session in the state.
          appState.setSession(session)

          // If this is the initial call to this
          // function, then call the initial
          // callback.
          if (initialCall) {
            initialCallback(session, () => (sync = () => {}))
            initialCall = false
          }

          // Determine the time until the next
          // request.
          let postRequestTimestamp = Date.now()
          let timeElapsed = postRequestTimestamp - preRequestTimestamp
          let timeUntilNextRequest = 1000 - timeElapsed

          // Set a timeout to make the next
          // request. If enough time has elapsed,
          // this will be done immediately.
          setTimeout(sync, timeUntilNextRequest)
        })
        .catch(() => {
          appState.setErrorMessage('Failed to sync session.')
          appState.setAppMountHandled(true)
          appActions.finishLoading()
        })
    }

    sync()
  }

  /* -- COMPONENT HANDLERS -- */

  /**
   * Recalculates and positions any tooltip being displayed in the DOM based on the current position of the mouse.
   * @param event The mouse event that triggered the tooltip position to be recalculated.
   */
  const positionTooltip = (event: MouseEvent): void => {
    let tooltips_elm: HTMLDivElement | null = appState.tooltips.current

    if (tooltips_elm) {
      let pageWidth = window.innerWidth - 25
      let pageHeight = window.innerHeight - 25
      let tooltipsWidth: number = tooltips_elm.clientWidth
      let tooltipsHeight: number = tooltips_elm.clientHeight
      let mouseX: number = event.pageX
      let mouseY: number = event.pageY
      let scrollY: number = window.scrollY
      let tooltipsDestinationX: number = pageWidth / 2 - tooltipsWidth / 2
      let tooltipsDestinationY: number = mouseY // scrollY + pageHeight / 2

      // -- tooltip destination x --

      while (tooltipsDestinationX > mouseX) {
        tooltipsDestinationX -= tooltipsWidth
      }
      while (tooltipsDestinationX + tooltipsWidth < mouseX) {
        tooltipsDestinationX += tooltipsWidth
      }
      if (tooltipsDestinationX < tooltipsOffsetX) {
        tooltipsDestinationX = tooltipsOffsetX
      }
      if (tooltipsDestinationX > pageWidth - tooltipsWidth - tooltipsOffsetX) {
        tooltipsDestinationX = pageWidth - tooltipsWidth - tooltipsOffsetX
      }

      if (mouseY - scrollY > pageHeight - tooltipsHeight - tooltipsOffsetY) {
        tooltipsDestinationY -= tooltipsHeight + tooltipsOffsetY
      } else {
        tooltipsDestinationY += tooltipsOffsetY
      }

      tooltips_elm.style.transform = `translate(${tooltipsDestinationX}px, ${tooltipsDestinationY}px)`
    }
  }

  /* -- COMPONENT EFFECTS -- */

  // This is called to handle the app being mounted,
  // will load the user in the session to see if a
  // login is necessary.
  useEffect(() => {
    if (!appState.appMountHandled) {
      let tooltips_elm: HTMLDivElement | null | undefined =
        appState.tooltips.current

      appActions.beginLoading(AppState.defaultAppStateValues.loadingMessage)

      syncSession((session: IMetisSession, endSync: () => void) => {
        appState.setAppMountHandled(true)

        endSessionSync = endSync

        appActions.finishLoading()

        // If no user data is present in the
        // session, navigate to the auth page
        // to have the visitor login.
        if (session.user === undefined) {
          appActions.goToPage('AuthPage', {
            returningPagePath: 'MissionSelectionPage',
            returningPageProps: {},
          })
        }
        // Else if no game data is present in
        // the session, navigate to the mission
        // selection page to have the user launch
        // a game.
        else if (session.game === undefined) {
          appActions.goToPage('MissionSelectionPage', {})
        } else {
          appActions.goToPage('GamePage', {})
        }
      })

      document.addEventListener('mousemove', positionTooltip)
      document.addEventListener('drag', positionTooltip)

      if (tooltips_elm !== null) {
        tooltips_elm.id = ''
        tooltips_elm.style.visibility = 'hidden'
        appState.setTooltipDescription('')
      }
    }
  }, [appState.appMountHandled])

  // Equivalent of componentWillUnmount.
  useEffect(() => {
    return () => {
      endSessionSync()
    }
  }, [])

  /* -- PAGE PROPS CONSTRUCTION -- */

  let pageProps: IPage = {
    appState,
    appActions,
    ...appState.currentPageProps,
  }

  /* -- RENDER -- */

  let className: string = 'App'

  // This will render the current page.
  const renderCurrentPage = (): JSX.Element | null => {
    let Page = pageRegistry.get(appState.currentPagePath)

    if (Page) {
      return <Page {...pageProps} />
    } else {
      return null
    }
  }

  if (appState.errorMessage !== null) {
    className += ' ServerError'
  } else if (
    appState.loading ||
    !appState.loadingMinTimeReached ||
    !appState.pageSwitchMinTimeReached
  ) {
    className += ' Loading'
  }

  return (
    <div className={className} key={'App'}>
      <div className='tooltips' ref={appState.tooltips}>
        <Markdown
          markdown={appState.tooltipDescription}
          theme={MarkdownTheme.ThemeSecondary}
        />
      </div>
      <div className='Notifications'>
        <div className='Glue'>
          {appState.notifications.map((notification: Notification) => (
            <NotificationBubble
              notification={notification}
              key={notification.notificationID}
            />
          ))}
        </div>
      </div>
      {appState.confirmation !== null ? (
        <Confirmation {...appState.confirmation} />
      ) : null}
      {appState.prompt !== null ? <Prompt {...appState.prompt} /> : null}
      <ServerErrorPage {...pageProps} />
      <LoadingPage {...pageProps} />
      {renderCurrentPage()}
    </div>
  )
}

// -- PAGE REGISTRATION --

registerPage('AuthPage', AuthPage)
registerPage('MissionSelectionPage', MissionSelectionPage)
registerPage('GamePage', GamePage)
registerPage('ChangelogPage', ChangelogPage)
registerPage('MissionFormPage', MissionFormPage)

export default AppState.createAppWithState(App)
