import './App.scss'
import GamePage from './pages/GamePage'
import AuthPage from './pages/AuthPage'
import { TMetisSession, User } from '../modules/users'
import { useEffect, useState } from 'react'
import ErrorPage from './pages/ErrorPage'
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
import { ServerConnection } from '../modules/connect/server-connect'
import { IButtonText } from './content/user-controls/ButtonText'

/**
 * Props that every page accepts. Extend this to include more.
 */
export interface IPage {
  appState: AppState
  appActions: AppActions
}

export type TAppErrorNotifyMethod = 'bubble' | 'page'

/**
 * An error that is resolved either via a notification bubble or a message on the error page. Default is page.
 */
export type TAppError = {
  message: string
  notifyMethod?: TAppErrorNotifyMethod // Default is page.
  solutions?: Array<IButtonText> // Only used when handled with error page.
} & (
  | {
      notifyMethod?: 'bubble'
      solutions: never
    }
  | {
      notifyMethod?: 'page'
      solutions?: Array<IButtonText>
    }
)

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
    async function componentDidMount(): Promise<void> {
      try {
        // Display default loading message to
        // the user.
        appActions.beginLoading(AppState.defaultAppStateValues.loadingMessage)

        // Add global event listeners.
        document.addEventListener('mousemove', positionTooltip)
        document.addEventListener('drag', positionTooltip)

        // Initialize tooltips.
        let tooltips_elm: HTMLDivElement | null | undefined =
          appState.tooltips.current

        if (tooltips_elm !== null) {
          tooltips_elm.id = ''
          tooltips_elm.style.visibility = 'hidden'
          appState.setTooltipDescription('')
        }

        // Sync session.
        let session: TMetisSession = await appActions.syncSession()

        // If there is no established session,
        // navigate to the auth page to have
        // the visitor login.
        if (session === null) {
          appActions.goToPage('AuthPage', {
            returningPagePath: 'MissionSelectionPage',
            returningPageProps: {},
          })
        }
        // Else establish a web socket connection
        // with the server.
        else {
          let server: ServerConnection = await appActions.connectToServer()

          // If the sessioned user is in a game,
          // then switch to the game page.
          if (session.inGame) {
            appActions.goToPage('GamePage', {})
          }
          // Else, go to the mission selection
          // page.
          else {
            appActions.goToPage('MissionSelectionPage', {})
          }
        }

        // Open the app up for use by the user.
        appState.setAppMountHandled(true)
        appActions.finishLoading()
      } catch (error: any) {
        console.error('Failed to handle app mount:')
        console.error(error)
        appActions.handleError('App initialization failed.')
      }
    }

    if (!appState.appMountHandled) {
      componentDidMount()
    }
  }, [appState.appMountHandled])

  // Equivalent of componentWillUnmount.
  useEffect(() => {
    return () => {}
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

  if (appState.error !== null) {
    className += ' Error'
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
      <ErrorPage {...pageProps} />
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
