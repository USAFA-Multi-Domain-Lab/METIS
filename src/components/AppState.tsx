import React from 'react'
import { useStore, withStore } from 'react-context-hook'
import usersModule, { IMetisSession } from '../modules/users'
import { User } from '../modules/users'
import { AnyObject } from 'mongoose'
import Confirmation, {
  IConfirmation,
} from './content/communication/Confirmation'
import Prompt, { IPrompt } from './content/communication/Prompt'
import Notification from '../modules/notifications'
import { EAjaxStatus } from '../modules/toolbox/ajax'
import { IAuthPageSpecific } from './pages/AuthPage'
import { IButtonText } from './content/user-controls/ButtonText'
import { v4 as generateHash } from 'uuid'

/* -- INTERFACES -- */

export interface IAppStateValues {
  forcedUpdateCounter: number
  session: IMetisSession
  currentPagePath: string
  currentPageProps: AnyObject
  appMountHandled: boolean
  loading: boolean
  loadingMessage: string
  loadingMinTimeReached: boolean
  pageSwitchMinTimeReached: boolean
  errorMessage: string | null
  tooltips: React.RefObject<HTMLDivElement>
  tooltipDescription: string
  notifications: Array<Notification>
  postLoadNotifications: Array<Notification>
  confirmation: IConfirmation | null
  prompt: IPrompt | null
  missionNodeColors: Array<string>
}

export interface IAppStateSetters {
  setForcedUpdateCounter: (forcedUpdateCounter: number) => void
  setSession: (session: IMetisSession) => void
  setCurrentPagePath: (currentPagePath: string) => void
  setCurrentPageProps: (currentPageProps: AnyObject) => void
  setAppMountHandled: (appMountHandled: boolean) => void
  setLoading: (loading: boolean) => void
  setLoadingMessage: (loadingMessage: string) => void
  setLoadingMinTimeReached: (loadingMinTimeReached: boolean) => void
  setPageSwitchMinTimeReached: (pageSwitchMinTimeReached: boolean) => void
  setErrorMessage: (errorMessage: string | null) => void
  setTooltips: (tooltips: React.RefObject<HTMLDivElement>) => void
  setTooltipDescription: (tooltipDescription: string) => void
  setNotifications: (notifications: Array<Notification>) => void
  setPostLoadNotifications: (postLoadNotifications: Array<Notification>) => void
  setConfirmation: (confirmation: IConfirmation | null) => void
  setPrompt: (prompt: IPrompt | null) => void
  setMissionNodeColors: (missionNodeColors: Array<string>) => void
}

// Options available when confirming
// an action using page props.
export interface IConfirmOptions {
  requireEntry?: boolean
  handleAlternate?: (concludeAction: () => void, entry: string) => void
  entryLabel?: string
  pendingMessageUponConfirm?: string
  pendingMessageUponAlternate?: string
  buttonConfirmText?: string
  buttonAlternateText?: string
  buttonCancelText?: string
}

// Options available when prompting a user
// with a message.
export interface IPromptOptions {
  buttonDismissalText?: string
}

// Options available when notifying
// the user using the notify function.
export interface INotifyOptions {
  duration?: number | null
  buttons?: Array<IButtonText>
  errorMessage?: boolean
}

/* -- CONSTANTS -- */

const loadingMinTime = 500
const pageSwitchMinTime = 500

/* -- CLASSES -- */

// These are actions that can be
// enacted upon the app state.
export class AppActions {
  public appState: AppState
  private sessionSyncID: string = ''

  constructor(appState: AppState) {
    this.appState = appState
    this.sessionSyncID = ''
  }

  _handleLoadCompletion = (): void => {
    for (let notification of this.appState.postLoadNotifications) {
      this.appState.notifications.push(notification)
      notification.startExpirationTimer()
    }
    this.appState.setPostLoadNotifications([])
  }

  /**
   * This will force the state of the entire app to update, causing a rerender, even if no actual changes to the state were made.
   */
  forceUpdate = (): void => {
    this.appState.setForcedUpdateCounter(this.appState.forcedUpdateCounter + 1)
  }

  /**
   * This will switch the currently rendered page to the requested page.
   * @param pagePath The path of the page to go to.
   * @param pageProps The props to pass to the destination page.
   */
  goToPage = (pagePath: string, pageProps: AnyObject): void => {
    // Actually switches the page. Called after any confirmations.
    const switchPage = (): void => {
      // Display to the user that the
      // page is loading.
      this.appState.setLoadingMessage('Switching pages...')
      this.appState.setPageSwitchMinTimeReached(false)

      // Set the current page props and path.
      this.appState.setCurrentPagePath('')
      this.appState.setCurrentPageProps(pageProps)
      this.appState.setCurrentPagePath(pagePath)

      // If the page switch takes less than
      // the minimum time, wait until the
      // minimum time has passed before
      // completing the page switch. This will
      // make the page transition feel more
      // smooth.
      setTimeout(() => {
        this.appState.setPageSwitchMinTimeReached(true)

        if (!this.appState.loading && this.appState.loadingMinTimeReached) {
          this._handleLoadCompletion()
        }
      }, pageSwitchMinTime)
    }

    // If the user is currently in a game,
    // confirm they want to quit before switching
    // the page.
    if (
      this.appState.currentPagePath === 'GamePage' &&
      this.appState.session.user &&
      this.appState.session.game
    ) {
      this.confirm(
        'Are you sure you want to quit?',
        (concludeAction: () => void) => {
          if (this.appState.session.user && this.appState.session.game) {
            this.appState.session.game
              .quit(this.appState.session.user.userID)
              .then(() => {
                switchPage()
                this.appState.setSession({
                  ...this.appState.session,
                  game: undefined,
                })
                concludeAction()
              })
              .catch((error: Error) => {
                console.log(error)
                this.handleServerError('Failed to quit game.')
                concludeAction()
              })
          }
        },
      )
    }
    // Else, go ahead and switch the page.
    else {
      switchPage()
    }
  }

  // This will set the loading message
  // in the global state, switching the
  // user to the loading page until the
  // loading has been ended by the finishLoading
  // function.
  beginLoading = (loadingMessage: string): void => {
    this.appState.setLoading(true)
    this.appState.setLoadingMessage(loadingMessage)
    this.appState.setLoadingMinTimeReached(false)
    setTimeout(() => {
      this.appState.setLoadingMinTimeReached(true)

      if (!this.appState.loading && this.appState.pageSwitchMinTimeReached) {
        this._handleLoadCompletion()
      }
    }, loadingMinTime)
  }

  // This will end the loading process
  // started by the beginLoading function,
  // bringing the user to the current page
  // set in the global state.
  finishLoading = (): void => {
    this.appState.setLoading(false)

    if (
      this.appState.loadingMinTimeReached &&
      this.appState.pageSwitchMinTimeReached
    ) {
      this._handleLoadCompletion()
    }
  }

  /**
   * Continually syncs the session with the server (Once a second or longer if latent). Storing updated session data in the app state. Calling this a second time will immediately sync the session, cancelling any current sync, restarting the sync cycle.
   * @param initialCallback A callback made when the session is first synced. Every subsequent sync will not use this callback.
   */
  syncSession = (
    initialCallback: (session: IMetisSession) => void = () => {},
  ): void => {
    let initialCall: boolean = true

    // Used internally to track the when
    // the initial call is made.
    let sync = (sessionSyncID: string) => {
      // If the session sync ID has changed,
      // abort.
      if (sessionSyncID !== this.sessionSyncID) {
        return
      }

      // Create a timestamp for before
      // the request.
      let preRequestTimestamp: number = Date.now()

      // Fetch the current session from the server.
      User.fetchSession()
        .then((session: IMetisSession) => {
          // Save the session in the state.
          this.appState.setSession(session)

          // If this is the initial call to this
          // function, then call the initial
          // callback.
          if (initialCall) {
            initialCallback(session)
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
          window.setTimeout(() => sync(sessionSyncID), timeUntilNextRequest)
        })
        .catch((error: any) => {
          console.error('Failed to sync session.')
          console.error(error)
          this.notify('Failed to sync session.')
        })
    }

    // Generate a new session sync ID
    // and call the sync function.
    this.sessionSyncID = generateHash()
    sync(this.sessionSyncID)
  }

  // This will navigate the user to the
  // server error page, displaying the
  // given message.
  handleServerError = (errorMessage: string): void => {
    this.appState.setErrorMessage(errorMessage)
  }

  // This can be called to the notify
  // the user of something.
  notify = (message: string, options: INotifyOptions = {}): Notification => {
    let onLoadingPage: boolean =
      this.appState.loading ||
      !this.appState.loadingMinTimeReached ||
      !this.appState.pageSwitchMinTimeReached

    let notification: Notification = new Notification(
      message,
      (dismissed: boolean, expired: boolean) => {
        if (dismissed) {
          this.appState.notifications.splice(
            this.appState.notifications.indexOf(notification),
            1,
          )
        } else if (expired) {
          setTimeout(() => {
            this.appState.notifications.splice(
              this.appState.notifications.indexOf(notification),
              1,
            )
            this.forceUpdate()
          }, 1000)
        }
        this.forceUpdate()
      },
      { ...options, startExpirationTimer: !onLoadingPage },
    )

    if (!onLoadingPage) {
      this.appState.notifications.push(notification)
    } else {
      this.appState.postLoadNotifications.push(notification)
    }

    this.forceUpdate()
    return notification
  }

  // This will pop up a confirmation box
  // to confirm some action. concludeAction
  // must be called by the handleConfirmation
  // callback function to make the confirm
  // box disappear.
  confirm = (
    message: string,
    handleConfirmation: (concludeAction: () => void, entry: string) => void,
    options: IConfirmOptions = {},
  ): void => {
    let confirmation: IConfirmation = {
      confirmAjaxStatus: EAjaxStatus.NotLoaded,
      alternateAjaxStatus: EAjaxStatus.NotLoaded,
      active: true,
      confirmationMessage: message,
      handleConfirmation: (entry: string) => {
        this.appState.setConfirmation({
          ...confirmation,
          confirmAjaxStatus: EAjaxStatus.Loading,
        })
        handleConfirmation(() => {
          this.appState.setConfirmation(null)
        }, entry)
      },
      handleAlternate: options.handleAlternate
        ? (entry: string) => {
            if (options.handleAlternate) {
              this.appState.setConfirmation({
                ...confirmation,
                alternateAjaxStatus: EAjaxStatus.Loading,
              })
              options.handleAlternate(() => {
                this.appState.setConfirmation(null)
              }, entry)
            }
          }
        : null,
      handleCancelation: () => this.appState.setConfirmation(null),
      pendingMessageUponConfirm: options.pendingMessageUponConfirm
        ? options.pendingMessageUponConfirm
        : Confirmation.defaultProps.pendingMessageUponConfirm,
      pendingMessageUponAlternate: options.pendingMessageUponAlternate
        ? options.pendingMessageUponAlternate
        : Confirmation.defaultProps.pendingMessageUponAlternate,
      buttonConfirmText: options.buttonConfirmText
        ? options.buttonConfirmText
        : Confirmation.defaultProps.buttonConfirmText,
      buttonAlternateText: options.buttonAlternateText
        ? options.buttonAlternateText
        : Confirmation.defaultProps.buttonAlternateText,
      buttonCancelText: options.buttonCancelText
        ? options.buttonCancelText
        : Confirmation.defaultProps.buttonCancelText,
      requireEntry: options.requireEntry === true,
      entryLabel: options.entryLabel
        ? options.entryLabel
        : Confirmation.defaultProps.entryLabel,
    }

    this.appState.setConfirmation(confirmation)
  }

  // This will pop up a prompt box
  // to inform the user of a something.
  prompt = (message: string, options: IPromptOptions = {}): void => {
    let prompt: IPrompt = {
      active: true,
      promptMessage: message,
      handleDismissal: () => this.appState.setPrompt(null),
      buttonDismissalText: options.buttonDismissalText
        ? options.buttonDismissalText
        : Prompt.defaultProps.buttonDismissalText,
    }

    this.appState.setPrompt(prompt)
  }

  // This will logout the current user from
  // the session.
  logout = (authPageProps: IAuthPageSpecific) => {
    this.beginLoading('Signing out...')

    usersModule.logout(
      () => {
        this.appState.setSession({})
        this.finishLoading()
        this.goToPage('AuthPage', authPageProps)
      },
      (error: Error) => {
        this.finishLoading()
        this.handleServerError('Failed to logout.')
      },
    )
  }
}

// This is the app state used
// throught the application.
export default class AppState implements IAppStateValues, IAppStateValues {
  forcedUpdateCounter: number
  session: IMetisSession
  currentPagePath: string
  currentPageProps: AnyObject
  appMountHandled: boolean
  loading: boolean
  loadingMessage: string
  loadingMinTimeReached: boolean
  pageSwitchMinTimeReached: boolean
  errorMessage: string | null
  tooltips: React.RefObject<HTMLDivElement>
  tooltipDescription: string
  notifications: Notification[]
  postLoadNotifications: Array<Notification>
  confirmation: IConfirmation | null
  prompt: IPrompt | null
  missionNodeColors: Array<string>

  setForcedUpdateCounter: (forcedUpdateCounter: number) => void
  setSession: (session: IMetisSession) => void
  setCurrentPagePath: (currentPagePath: string) => void
  setCurrentPageProps: (currentPageProps: AnyObject) => void
  setAppMountHandled: (appMountHandled: boolean) => void
  setLoading: (loading: boolean) => void
  setLoadingMessage: (loadingMessage: string) => void
  setLoadingMinTimeReached: (loadingMinTimeReached: boolean) => void
  setPageSwitchMinTimeReached: (pageSwitchMinTimeReached: boolean) => void
  setErrorMessage: (errorMessage: string | null) => void
  setTooltips: (tooltips: React.RefObject<HTMLDivElement>) => void
  setTooltipDescription: (tooltipDescription: string) => void
  setNotifications: (notifications: Notification[]) => void
  setPostLoadNotifications: (postLoadNotifications: Array<Notification>) => void
  setConfirmation: (confirmation: IConfirmation | null) => void
  setPrompt: (prompt: IPrompt | null) => void
  setMissionNodeColors: (missionNodeColors: Array<string>) => void

  static get defaultAppStateValues(): IAppStateValues {
    return {
      forcedUpdateCounter: 0,
      session: {},
      currentPagePath: '',
      currentPageProps: {},
      appMountHandled: false,
      loading: true,
      loadingMessage: 'Initializing application...',
      loadingMinTimeReached: false,
      pageSwitchMinTimeReached: true,
      errorMessage: null,
      tooltips: React.createRef(),
      tooltipDescription: '',
      notifications: [],
      postLoadNotifications: [],
      confirmation: null,
      prompt: null,
      missionNodeColors: [],
    }
  }

  static get defaultAppStateSetters(): IAppStateSetters {
    return {
      setForcedUpdateCounter: () => {},
      setTooltipDescription: () => {},
      setSession: (): void => {},
      setCurrentPagePath: (): void => {},
      setCurrentPageProps: (): void => {},
      setAppMountHandled: (): void => {},
      setLoading: () => {},
      setLoadingMessage: () => {},
      setLoadingMinTimeReached: (): void => {},
      setPageSwitchMinTimeReached: (): void => {},
      setErrorMessage: (): void => {},
      setTooltips: (): void => {},
      setNotifications: (): void => {},
      setPostLoadNotifications: (): void => {},
      setConfirmation: (): void => {},
      setPrompt: (): void => {},
      setMissionNodeColors: (): void => {},
    }
  }

  constructor(
    appStateValues: IAppStateValues,
    appStateSetters: IAppStateSetters,
  ) {
    this.forcedUpdateCounter = appStateValues.forcedUpdateCounter
    this.session = appStateValues.session
    this.currentPagePath = appStateValues.currentPagePath
    this.currentPageProps = appStateValues.currentPageProps
    this.appMountHandled = appStateValues.appMountHandled
    this.loading = appStateValues.loading
    this.loadingMessage = appStateValues.loadingMessage
    this.loadingMinTimeReached = appStateValues.loadingMinTimeReached
    this.pageSwitchMinTimeReached = appStateValues.pageSwitchMinTimeReached
    this.errorMessage = appStateValues.errorMessage
    this.tooltips = appStateValues.tooltips
    this.tooltipDescription = appStateValues.tooltipDescription
    this.notifications = appStateValues.notifications
    this.postLoadNotifications = appStateValues.postLoadNotifications
    this.confirmation = appStateValues.confirmation
    this.prompt = appStateValues.prompt
    this.missionNodeColors = appStateValues.missionNodeColors

    this.setForcedUpdateCounter = appStateSetters.setForcedUpdateCounter
    this.setSession = appStateSetters.setSession
    this.setCurrentPagePath = appStateSetters.setCurrentPagePath
    this.setCurrentPageProps = appStateSetters.setCurrentPageProps
    this.setAppMountHandled = appStateSetters.setAppMountHandled
    this.setLoading = appStateSetters.setLoading
    this.setLoadingMessage = appStateSetters.setLoadingMessage
    this.setLoadingMinTimeReached = appStateSetters.setLoadingMinTimeReached
    this.setPageSwitchMinTimeReached =
      appStateSetters.setPageSwitchMinTimeReached
    this.setErrorMessage = appStateSetters.setErrorMessage
    this.setTooltips = appStateSetters.setTooltips
    this.setTooltipDescription = appStateSetters.setTooltipDescription
    this.setNotifications = appStateSetters.setNotifications
    this.setPostLoadNotifications = appStateSetters.setPostLoadNotifications
    this.setConfirmation = appStateSetters.setConfirmation
    this.setPrompt = appStateSetters.setPrompt
    this.setMissionNodeColors = appStateSetters.setMissionNodeColors
  }
  // This will create a new app
  // with the component class/function
  // passed, using a new instance of
  // app state.
  static createAppWithState(App: any): any {
    let appActions: AppActions = new AppActions(
      new AppState(
        AppState.defaultAppStateValues,
        AppState.defaultAppStateSetters,
      ),
    )

    // This adds an extra layer to the
    // rendering of the app component.
    // This is done so that the stateSetters
    // in the AppState object have the
    // correct functions.
    const AppWithState = (): JSX.Element | null => {
      const [forcedUpdateCounter, setForcedUpdateCounter] = useStore<number>(
        'forcedUpdateCounter',
      )
      const [session, setSession] = useStore<IMetisSession>('session')
      const [currentPagePath, setCurrentPagePath] =
        useStore<string>('currentPagePath')
      const [currentPageProps, setCurrentPageProps] =
        useStore<AnyObject>('currentPageProps')
      const [appMountHandled, setAppMountHandled] =
        useStore<boolean>('appMountHandled')
      const [loading, setLoading] = useStore<boolean>('loading')
      const [loadingMessage, setLoadingMessage] =
        useStore<string>('loadingMessage')
      const [loadingMinTimeReached, setLoadingMinTimeReached] =
        useStore<boolean>('loadingMinTimeReached')
      const [pageSwitchMinTimeReached, setPageSwitchMinTimeReached] =
        useStore<boolean>('pageSwitchMinTimeReached')
      const [errorMessage, setErrorMessage] = useStore<string | null>(
        'errorMessage',
      )
      const [tooltips, setTooltips] =
        useStore<React.RefObject<HTMLDivElement>>('tooltips')
      const [tooltipDescription, setTooltipDescription] =
        useStore<string>('tooltipDescription')
      const [notifications, setNotifications] =
        useStore<Notification[]>('notifications')
      const [postLoadNotifications, setPostLoadNotifications] = useStore<
        Array<Notification>
      >('postLoadNotifications')
      const [confirmation, setConfirmation] = useStore<IConfirmation | null>(
        'confirmation',
      )
      const [prompt, setPrompt] = useStore<IPrompt | null>('prompt')
      const [missionNodeColors, setMissionNodeColors] =
        useStore<Array<string>>('missionNodeColors')

      let appStateValues: IAppStateValues = {
        forcedUpdateCounter,
        session,
        currentPagePath,
        currentPageProps,
        appMountHandled,
        loading,
        loadingMessage,
        loadingMinTimeReached,
        pageSwitchMinTimeReached,
        errorMessage,
        tooltips,
        tooltipDescription,
        notifications,
        postLoadNotifications,
        confirmation,
        prompt,
        missionNodeColors,
      }
      let appStateSetters: IAppStateSetters = {
        setForcedUpdateCounter,
        setSession,
        setCurrentPagePath,
        setCurrentPageProps,
        setAppMountHandled,
        setLoading,
        setLoadingMessage,
        setLoadingMinTimeReached,
        setPageSwitchMinTimeReached,
        setErrorMessage,
        setTooltips,
        setTooltipDescription,
        setNotifications,
        setPostLoadNotifications,
        setConfirmation,
        setPrompt,
        setMissionNodeColors,
      }
      let appState = new AppState(appStateValues, appStateSetters)
      appActions.appState = appState

      return <App appState={appState} appActions={appActions} />
    }

    let initialAppState: AppState = new AppState(
      AppState.defaultAppStateValues,
      AppState.defaultAppStateSetters,
    )

    return withStore(AppWithState, initialAppState)
  }
}
