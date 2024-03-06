import { useEffect } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionNode from 'src/missions/nodes'
import ClientUser from 'src/users'
import { TMetisSession } from '../../../shared/sessions'
import Notification from '../notifications'
import './App.scss'
import Confirmation from './content/communication/Confirmation'
import NotificationBubble from './content/communication/NotificationBubble'
import Prompt from './content/communication/Prompt'
import {
  tooltipsOffsetX,
  tooltipsOffsetY,
} from './content/communication/Tooltip'
import Markdown, { MarkdownTheme } from './content/general-layout/Markdown'
import { IButtonText } from './content/user-controls/ButtonText'
import AuthPage from './pages/AuthPage'
import ChangelogPage from './pages/ChangelogPage'
import ErrorPage from './pages/ErrorPage'
import GamePage from './pages/GamePage'
import HomePage from './pages/HomePage'
import LoadingPage from './pages/LoadingPage'
import MissionFormPage from './pages/MissionFormPage'
import UserFormPage from './pages/UserFormPage'
import UserResetPage from './pages/UserResetPage'

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
  solutions?: IButtonText[] // Only used when handled with error page.
} & (
  | {
      notifyMethod?: 'bubble'
      solutions?: never
    }
  | {
      notifyMethod?: 'page'
      solutions?: IButtonText[]
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
  const [appMountHandled, setAppMountHandled] = globalContext.appMountHandled
  const [tooltip, setTooltip] = globalContext.tooltip
  const [tooltipDescription, setTooltipDescription] =
    globalContext.tooltipDescription
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
    goToPage,
    connectToServer,
  } = globalContext.actions

  /* -- COMPONENT FUNCTIONS -- */

  /**
   * Recalculates and positions any tooltip being displayed in the DOM based on the current position of the mouse.
   * @param event The mouse event that triggered the tooltip position to be recalculated.
   */
  const positionTooltip = (event: MouseEvent): void => {
    let tooltip_elm: HTMLDivElement | null = tooltip.current

    if (tooltip_elm) {
      let pageWidth = window.innerWidth - 25
      let pageHeight = window.innerHeight - 25
      let tooltipWidth: number = tooltip_elm.clientWidth
      let tooltipHeight: number = tooltip_elm.clientHeight
      let mouseX: number = event.pageX
      let mouseY: number = event.pageY
      let scrollY: number = window.scrollY
      let tooltipsDestinationX: number = pageWidth / 2 - tooltipWidth / 2
      let tooltipsDestinationY: number = mouseY // scrollY + pageHeight / 2

      // -- tooltip destination x --

      while (tooltipsDestinationX > mouseX) {
        tooltipsDestinationX -= tooltipWidth
      }
      while (tooltipsDestinationX + tooltipWidth < mouseX) {
        tooltipsDestinationX += tooltipWidth
      }
      if (tooltipsDestinationX < tooltipsOffsetX) {
        tooltipsDestinationX = tooltipsOffsetX
      }
      if (tooltipsDestinationX > pageWidth - tooltipWidth - tooltipsOffsetX) {
        tooltipsDestinationX = pageWidth - tooltipWidth - tooltipsOffsetX
      }

      if (mouseY - scrollY > pageHeight - tooltipHeight - tooltipsOffsetY) {
        tooltipsDestinationY -= tooltipHeight + tooltipsOffsetY
      } else {
        tooltipsDestinationY += tooltipsOffsetY
      }

      tooltip_elm.style.transform = `translate(${tooltipsDestinationX}px, ${tooltipsDestinationY}px)`
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
        let tooltip_elm: HTMLDivElement | null = tooltip.current

        if (tooltip_elm) {
          tooltip_elm.style.opacity = '0'
          tooltip_elm.style.transition = 'opacity 0ms'
          setTooltipDescription('')
        }

        // Sync session.
        let session: TMetisSession<ClientUser> = await syncSession()

        // If there is no established session,
        // navigate to the auth page to have
        // the visitor login.
        if (session === null) {
          goToPage('AuthPage', {
            returningPagePath: 'HomePage',
            returningPageProps: {},
          })
        }
        // Else establish a web socket connection
        // with the server.
        else {
          // Connect to the server.
          await connectToServer()

          // If the sessioned user needs a password
          // reset, then navigate to the user
          // reset page.
          if (session.user.needsPasswordReset) {
            goToPage('UserResetPage', {
              user: session.user,
            })
          }
          // Else, if the sessioned user is in a game,
          // then switch to the game page.
          else if (session.inGame) {
            goToPage('GamePage', {})
          }
          // Else, go to the home page.
          else {
            goToPage('HomePage', {})
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

  /**
   * Renders the current page.
   */
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
      <div className='Tooltip' ref={tooltip}>
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
