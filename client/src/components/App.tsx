import { ReactNode, useEffect, useRef } from 'react'
import backgroundImage from 'src/assets/images/landing-page-img.webp'
import ServerConnection from 'src/connect/servers'
import { useGlobalContext } from 'src/context/global'
import MetisInfo from 'src/info'
import SessionClient from 'src/sessions'
import { ClientTargetEnvironment } from 'src/target-environments'
import { compute } from 'src/toolbox'
import { LoginRequiredError, useEventListener } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { TLogin } from '../../../shared/logins'
import ClassList from '../../../shared/toolbox/html/class-lists'
import './App.scss'
import ConnectionStatus from './content/communication/ConnectionStatus'
import Notifications from './content/communication/Notifications'
import { default as Prompt } from './content/communication/Prompt'
import {
  tooltipsOffsetX,
  tooltipsOffsetY,
} from './content/communication/Tooltip'
import { DevOptions } from './content/debug/DevOptions'
import Markdown, { MarkdownTheme } from './content/general-layout/Markdown'
import ButtonMenu from './content/user-controls/buttons/ButtonMenu'
import { TButtonText_P } from './content/user-controls/buttons/ButtonText'
import { PAGE_REGISTRY } from './pages'
import AuthPage from './pages/AuthPage'
import ErrorPage from './pages/ErrorPage'
import LoadingPage from './pages/LoadingPage'
import ReactErrorBoundary from './ReactErrorBoundary'

/**
 * Component of all components, renders all of METIS.
 */
export default function (props: {}): JSX.Element | null {
  /* -- REFS -- */
  const app = useRef<HTMLDivElement>(null)

  /* -- STATE -- */

  const globalContext = useGlobalContext()

  const [_, setInfo] = globalContext.info
  const [login] = globalContext.login
  const [appMountHandled, setAppMountHandled] = globalContext.appMountHandled
  const [tooltips] = globalContext.tooltips
  const [tooltipDescription, setTooltipDescription] =
    globalContext.tooltipDescription
  const [debugOptionsActive, setDebugOptionsActive] =
    globalContext.devOptionsActive
  const [buttonMenu] = globalContext.buttonMenu
  const [loading] = globalContext.loading
  const [loadingMinTimeReached] = globalContext.loadingMinTimeReached
  const [loadingPageId] = globalContext.loadingPageId
  const [pageSwitchMinTimeReached] = globalContext.pageSwitchMinTimeReached
  const [backgroundLoaded, setBackgroundLoaded] = globalContext.backgroundLoaded
  const [promptData] = globalContext.promptData
  const [currentPageKey] = globalContext.currentPageKey
  const [currentPageProps] = globalContext.currentPageProps
  const [error] = globalContext.error
  const [server] = globalContext.server

  const {
    beginLoading,
    finishLoading,
    handleError,
    loadLoginInfo,
    navigateTo,
    connectToServer,
    notify,
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

  /**
   * Handles an uncaught error.
   * @param error The error that was caught.
   * @param info The information about the error.
   */
  const handleUncaughtError = (
    error: Error | LoginRequiredError,
    info: React.ErrorInfo,
  ): void => {
    // If the error is a login required error, then
    // navigate to the auth page.
    if (error instanceof LoginRequiredError) {
      // Log the error.
      console.error('ErrorBoundary caught an error -\n', error)
      // Navigate to the auth page.
      navigateTo('AuthPage', {}, { bypassMiddleware: true })
      // Notify the user.
      handleError({
        message:
          'You are no longer logged in. This is most likely due to the server restarting.',
        notifyMethod: 'bubble',
      })
    }
    // Otherwise, throw the error to be caught by the
    // app level error boundary.
    else {
      throw error
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

        // Preload the large background image.
        // A smaller version is used initially
        // until the large version is fully loaded.
        const background = new window.Image()
        background.src = backgroundImage
        background.onload = () => {
          setBackgroundLoaded(true)
        }

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

        // Load app info.
        beginLoading('Loading application information...')
        let info = await MetisInfo.$fetch()
        setInfo(info)

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
            let session: SessionClient = await server.$fetchCurrentSession()
            // Navigate based on the session state.
            switch (session.state) {
              case 'unstarted':
                navigateTo('LobbyPage', { session })
                break
              case 'started':
                navigateTo('SessionPage', { session, returnPage: 'HomePage' })
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
      if (login !== null) {
        try {
          // Load target environments.
          await ClientTargetEnvironment.$populateRegistry()
        } catch {
          handleError('Failed to load post-login data.')
        }
      }
    }
    effect()
  }, [login === null])

  // Logs the user out if the server emits a logout event.
  useEventListener(
    server,
    'logout-user-update',
    async () => {
      navigateTo('AuthPage', {}, { bypassMiddleware: true })
      notify(
        'You have been logged out due to a change to your account. If you believe this is an error, please contact your system administrator. Otherwise, please log back in.',
        {
          duration: null,
        },
      )
    },
    [server],
  )

  /* -- COMPUTED -- */

  /**
   * Classes to apply to the root app element.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('App')
      .set('Error', error)
      .set(
        'Loading',
        loading || !loadingMinTimeReached || !pageSwitchMinTimeReached,
      )
      .switch('BackgroundImageLarge', 'BackgroundImageSmall', backgroundLoaded),
  )

  let CurrentPage = PAGE_REGISTRY[currentPageKey]
  let pageProps: any = {
    ...currentPageProps,
  }

  /* -- RENDER -- */

  /**
   * The JSX for the button menu.
   */
  const buttonMenuJsx = compute<ReactNode>(() => {
    // Render nothing, if there is no button menu.
    if (!buttonMenu) return null

    return <ButtonMenu {...buttonMenu} />
  })

  // Render METIS.
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorPage}
      onError={(error) =>
        console.error('ErrorBoundary caught an error -\n', error)
      }
    >
      <div className={rootClasses.value} key={'App'} ref={app}>
        {buttonMenuJsx}
        <div className='Tooltips' ref={tooltips}>
          <Markdown
            markdown={tooltipDescription}
            theme={MarkdownTheme.ThemeSecondary}
          />
        </div>
        <Notifications />
        <DevOptions />
        {promptData !== null ? <Prompt {...promptData} /> : null}
        <ErrorPage {...pageProps} key='error-page' />
        <LoadingPage {...pageProps} key={loadingPageId} />
        <ConnectionStatus />
        <ReactErrorBoundary
          FallbackComponent={AuthPage}
          onError={handleUncaughtError}
          resetKeys={[currentPageKey, error]}
        >
          <CurrentPage {...pageProps} key={pageProps.key} />
        </ReactErrorBoundary>
      </div>
    </ReactErrorBoundary>
  )
}

/**
 * The method by which an application error is resolved.
 */
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
  solutions?: TButtonText_P[] // Only used when handled with error page.
} & (
  | {
      notifyMethod?: 'bubble'
      solutions?: never
    }
  | {
      notifyMethod?: 'page'
      solutions?: TButtonText_P[]
    }
)
