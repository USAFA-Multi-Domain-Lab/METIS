import './App.scss'
import GamePage from './pages/GamePage'
import AuthPage from './pages/AuthPage'
import { TMetisSession } from '../../../shared/sessions'
import { useEffect } from 'react'
import ErrorPage from './pages/ErrorPage'
import LoadingPage from './pages/LoadingPage'
import Markdown, { MarkdownTheme } from './content/general-layout/Markdown'
import MissionFormPage from './pages/MissionFormPage'
import HomePage from './pages/HomePage'
import Notification from '../notifications'
import NotificationBubble from './content/communication/NotificationBubble'
import Confirmation from './content/communication/Confirmation'
import {
  tooltipsOffsetX,
  tooltipsOffsetY,
} from './content/communication/Tooltip'
import Prompt from './content/communication/Prompt'
import ChangelogPage from './pages/ChangelogPage'
import { IButtonText } from './content/user-controls/ButtonText'
import UserFormPage from './pages/UserFormPage'
import UserResetPage from './pages/UserResetPage'
import ClientMissionNode from 'src/missions/nodes'
import { useGlobalContext } from 'src/context'
import GameClient from 'src/games'
import ServerConnection from 'src/connect/server'

/**
 * Props that every page accepts. Extend this to include more.
 */
export interface IPage {}

export type TAppErrorNotifyMethod = 'bubble' | 'page'

/**
 * An error that is resolved either via a notification bubble or a message on the error page. Default is page.
 */
export type TAppError = {
  /**
   * The error message to display.
   */
  message: string
  notifyMethod?: TAppErrorNotifyMethod // Default is page.
  solutions?: Array<IButtonText> // Only used when handled with error page.
} & (
  | {
      notifyMethod?: 'bubble'
      solutions?: never
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
function App(props: {}): JSX.Element | null {
  /* -- COMPONENT STATE -- */

  const globalContext = useGlobalContext()

  const [session] = globalContext.session
  const [tooltips] = globalContext.tooltips
  const [tooltipDescription, setTooltipDescription] =
    globalContext.tooltipDescription
  const [appMountHandled, setAppMountHandled] = globalContext.appMountHandled
  const [_, setMissionNodeColors] = globalContext.missionNodeColors
  const [loading] = globalContext.loading
  const [loadingMinTimeReached] = globalContext.loadingMinTimeReached
  const [pageSwitchMinTimeReached] = globalContext.pageSwitchMinTimeReached
  const [notifications] = globalContext.notifications
  const [confirmation] = globalContext.confirmation
  const [currentPagePath] = globalContext.currentPagePath
  const [currentPageProps] = globalContext.currentPageProps
  const [error] = globalContext.error
  const [prompt] = globalContext.prompt

  const {
    beginLoading,
    finishLoading,
    handleError,
    syncSession,
    navigateTo,
    connectToServer,
  } = globalContext.actions

  /* -- COMPONENT FUNCTIONS -- */

  /**
   * Recalculates and positions any tooltip being displayed in the DOM based on the current position of the mouse.
   * @param event The mouse event that triggered the tooltip position to be recalculated.
   */
  const positionTooltip = (event: MouseEvent): void => {
    let tooltips_elm: HTMLDivElement | null = tooltips.current

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
        beginLoading()

        // Add global event listeners.
        document.addEventListener('mousemove', positionTooltip)
        document.addEventListener('drag', positionTooltip)

        // Initialize tooltips.
        let tooltips_elm: HTMLDivElement | null | undefined = tooltips.current

        if (tooltips_elm !== null) {
          tooltips_elm.id = ''
          tooltips_elm.style.visibility = 'hidden'
          setTooltipDescription('')
        }

        // Sync session.
        beginLoading('Syncing session...')
        let session: TMetisSession = await syncSession()

        // If there is no established session,
        // navigate to the auth page to have
        // the visitor login.
        if (session === null) {
          navigateTo('AuthPage', {
            returningPagePath: 'HomePage',
            returningPageProps: {},
          })
        }
        // Else establish a web socket connection
        // with the server.
        else {
          // Connect to the server.
          beginLoading('Connecting to server...')
          let server: ServerConnection = await connectToServer()

          // If the sessioned user needs a password
          // reset, then navigate to the user
          // reset page.
          if (session.user.needsPasswordReset) {
            navigateTo('UserResetPage', {
              user: session.user,
            })
          }
          // Else, if the sessioned user is in a game,
          // then switch to the game page.
          else if (session.gameID !== null) {
            let game: GameClient = await GameClient.fetch(server)
            navigateTo('GamePage', { game })
          }
          // Else, go to the home page.
          else {
            navigateTo('HomePage', {})
          }
        }

        // Open the app up for use by the user.
        setAppMountHandled(true)
        finishLoading()
      } catch (error: any) {
        console.error('Failed to handle app mount:')
        console.error(error)
        handleError('App initialization failed.')
      }
    }

    if (!appMountHandled) {
      componentDidMount()
    }
  }, [appMountHandled])

  // This is called to handle logins.
  useEffect(() => {
    async function effect(): Promise<void> {
      if (session === null) {
        setMissionNodeColors([])
      } else {
        try {
          setMissionNodeColors(await ClientMissionNode.fetchColors())
        } catch {
          handleError('Failed to load post-login data.')
        }
      }
    }
    effect()
  }, [session === null])

  /* -- PAGE PROPS CONSTRUCTION -- */

  let pageProps: IPage = {
    ...currentPageProps,
  }

  /* -- RENDER -- */

  let className: string = 'App'

  // This will render the current page.
  const renderCurrentPage = (): JSX.Element | null => {
    let Page = pageRegistry.get(currentPagePath)

    if (Page) {
      return <Page {...pageProps} />
    } else {
      return null
    }
  }

  if (error !== null) {
    className += ' Error'
  } else if (loading || !loadingMinTimeReached || !pageSwitchMinTimeReached) {
    className += ' Loading'
  }

  return (
    <div className={className} key={'App'}>
      <div className='tooltips' ref={tooltips}>
        <Markdown
          markdown={tooltipDescription}
          theme={MarkdownTheme.ThemeSecondary}
        />
      </div>
      <div className='Notifications'>
        <div className='Glue'>
          {notifications.map((notification: Notification) => (
            <NotificationBubble
              notification={notification}
              key={notification.notificationID}
            />
          ))}
        </div>
      </div>
      {confirmation !== null ? <Confirmation {...confirmation} /> : null}
      {prompt !== null ? <Prompt {...prompt} /> : null}
      <ErrorPage {...pageProps} />
      <LoadingPage {...pageProps} />
      {renderCurrentPage()}
    </div>
  )
}

// -- PAGE REGISTRATION --

registerPage('AuthPage', AuthPage)
registerPage('HomePage', HomePage)
registerPage('GamePage', GamePage)
registerPage('ChangelogPage', ChangelogPage)
registerPage('MissionFormPage', MissionFormPage)
registerPage('UserFormPage', UserFormPage)
registerPage('UserResetPage', UserResetPage)

export default App
