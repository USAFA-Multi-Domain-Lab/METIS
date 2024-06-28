import { useEffect, useRef } from 'react'
import ServerConnection from 'src/connect/servers'
import { useGlobalContext } from 'src/context'
import ClientMissionNode from 'src/missions/nodes'
import ClientSession from 'src/sessions'
import ClientUser from 'src/users'
import { TLogin } from '../../../shared/logins'
import Notification from '../notifications'
import './App.scss'
import ConnectionStatus from './content/communication/ConnectionStatus'
import NotificationBubble from './content/communication/NotificationBubble'
import { default as Prompt } from './content/communication/Prompt'
import {
  tooltipsOffsetX,
  tooltipsOffsetY,
} from './content/communication/Tooltip'
import Markdown, { MarkdownTheme } from './content/general-layout/Markdown'
import { TButtonText } from './content/user-controls/ButtonText'
import { PAGE_REGISTRY } from './pages'
import ErrorPage from './pages/ErrorPage'
import LoadingPage from './pages/LoadingPage'

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
  solutions?: TButtonText[] // Only used when handled with error page.
} & (
  | {
      notifyMethod?: 'bubble'
      solutions?: never
    }
  | {
      notifyMethod?: 'page'
      solutions?: TButtonText[]
    }
)

// This is the renderer for the entire application.
function App(props: {}): JSX.Element | null {
  /* -- REFS -- */
  const app = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  const globalContext = useGlobalContext()

  const [login] = globalContext.login
  const [appMountHandled, setAppMountHandled] = globalContext.appMountHandled
  const [server] = globalContext.server
  const [tooltips] = globalContext.tooltips
  const [tooltipDescription, setTooltipDescription] =
    globalContext.tooltipDescription
  const [_, setMissionNodeColors] = globalContext.missionNodeColors
  const [loading] = globalContext.loading
  const [loadingMinTimeReached] = globalContext.loadingMinTimeReached
  const [pageSwitchMinTimeReached] = globalContext.pageSwitchMinTimeReached
  const [notifications] = globalContext.notifications
  const [promptData] = globalContext.promptData
  const [currentPageKey] = globalContext.currentPageKey
  const [currentPageProps] = globalContext.currentPageProps
  const [error] = globalContext.error

  const {
    beginLoading,
    finishLoading,
    handleError,
    loadLoginInfo,
    navigateTo,
    connectToServer,
  } = globalContext.actions

  /* -- FUNCTIONS -- */

  /**
   * Recalculates and positions any tooltip being displayed in the DOM based on the current position of the mouse.
   * @param event The mouse event that triggered the tooltip position to be recalculated.
   */
  const positionTooltip = (event: MouseEvent): void => {
    let tooltip_elm: HTMLDivElement | null = tooltips.current
    let app_elm: HTMLDivElement | null = app.current

    if (tooltip_elm && app_elm) {
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

      // If the tooltip is going off the bottom of the page, then
      // set the tooltip to be at the bottom of the page.
      if (tooltipsDestinationY + tooltipHeight + 5 > app_elm.clientHeight) {
        tooltipsDestinationY = app_elm.clientHeight - tooltipHeight - 5
      }

      tooltip_elm.style.transform = `translate(${tooltipsDestinationX}px, ${tooltipsDestinationY}px)`
    }
  }

  /* -- EFFECTS -- */

  // This is called to handle the app being mounted,
  // will load the login information and connect to
  // the server if the user is logged in.
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
        let tooltip_elm: HTMLDivElement | null = tooltips.current

        if (tooltip_elm) {
          tooltip_elm.style.opacity = '0'
          tooltip_elm.style.transition = 'opacity 0ms'
          setTooltipDescription('')
        }

        // Load login info.
        beginLoading('Loading login information...')
        let login: TLogin<ClientUser> = await loadLoginInfo()

        // If the user's login information fails to load,
        // navigate to the auth page to have the visitor
        // login.
        if (login === null) {
          navigateTo('AuthPage', {})
        }
        // Else establish a web socket connection
        // with the server.
        else {
          // Connect to the server.
          beginLoading('Connecting to server...')
          let server: ServerConnection = await connectToServer()

          // If the logged in user needs a password
          // reset, then navigate to the user
          // reset page.
          if (login.user.needsPasswordReset) {
            navigateTo('UserResetPage', {})
          }
          // Or, if the logged in user is in a session,
          // then switch to the session page.
          else if (login.sessionId !== null) {
            let session: ClientSession = await server.$fetchCurrentSession(
              login.sessionId,
            )
            // Navigate based on the session state.
            switch (session.state) {
              case 'unstarted':
                navigateTo('LobbyPage', { session })
                break
              case 'started':
                navigateTo('SessionPage', { session })
                break
              case 'ended':
                navigateTo('HomePage', {})
                break
            }
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
      if (login === null) {
        setMissionNodeColors([])
      } else {
        try {
          setMissionNodeColors(await ClientMissionNode.$fetchColors())
        } catch {
          handleError('Failed to load post-login data.')
        }
      }
    }
    effect()
  }, [login === null])

  /* -- PAGE DETAILS -- */

  let CurrentPage = PAGE_REGISTRY[currentPageKey]
  let pageProps: any = {
    ...currentPageProps,
  }

  /* -- RENDER -- */

  let className: string = 'App'

  if (error !== null) {
    className += ' Error'
  } else if (loading || !loadingMinTimeReached || !pageSwitchMinTimeReached) {
    className += ' Loading'
  }

  return (
    <div className={className} key={'App'} ref={app}>
      <div className='Tooltips' ref={tooltips}>
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
      {promptData !== null ? <Prompt {...promptData} /> : null}
      <ErrorPage {...pageProps} />
      <LoadingPage {...pageProps} />
      <ConnectionStatus />
      <CurrentPage {...pageProps} />
    </div>
  )
}

export default App
