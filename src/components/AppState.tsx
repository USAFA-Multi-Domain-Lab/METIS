import React from 'react'
import { useStore, withStore } from 'react-context-hook'
import usersModule, { TMetisSession } from '../modules/users'
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
import {
  IServerConnectionOptions,
  ServerConnection,
} from '../modules/connect/server-connect'
import { ServerEmittedError } from 'src/modules/connect/errors'
import { TAppError, TAppErrorNotifyMethod } from './App'

/* -- INTERFACES -- */

export interface IAppStateValues {
  forcedUpdateCounter: number
  server: ServerConnection | null
  session: TMetisSession
  currentPagePath: string
  currentPageProps: AnyObject
  appMountHandled: boolean
  loading: boolean
  loadingMessage: string
  loadingMinTimeReached: boolean
  pageSwitchMinTimeReached: boolean
  error: TAppError | null
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
  setServer: (server: ServerConnection | null) => void
  setSession: (session: TMetisSession) => void
  setCurrentPagePath: (currentPagePath: string) => void
  setCurrentPageProps: (currentPageProps: AnyObject) => void
  setAppMountHandled: (appMountHandled: boolean) => void
  setLoading: (loading: boolean) => void
  setLoadingMessage: (loadingMessage: string) => void
  setLoadingMinTimeReached: (loadingMinTimeReached: boolean) => void
  setPageSwitchMinTimeReached: (pageSwitchMinTimeReached: boolean) => void
  setError: (error: TAppError | null) => void
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

const LOADING_MIN_TIME = 500
const PAGE_SWITCH_MIN_TIME = 500

/* -- CLASSES -- */

// These are actions that can be
// enacted upon the app state.
export class AppActions {
  public appState: AppState

  public constructor(appState: AppState) {
    this.appState = appState
  }

  private handleLoadCompletion = (): void => {
    for (let notification of this.appState.postLoadNotifications) {
      this.appState.notifications.push(notification)
      notification.startExpirationTimer()
    }
    this.appState.setPostLoadNotifications([])
  }

  /**
   * This will force the state of the entire app to update, causing a rerender, even if no actual changes to the state were made.
   */
  public forceUpdate = (): void => {
    this.appState.setForcedUpdateCounter(this.appState.forcedUpdateCounter + 1)
  }

  /**
   * This will switch the currently rendered page to the requested page.
   * @param pagePath The path of the page to go to.
   * @param pageProps The props to pass to the destination page.
   */
  public goToPage = (pagePath: string, pageProps: AnyObject): void => {
    // Actually switches the page. Called after any confirmations.
    const realizePageSwitch = (): void => {
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
          this.handleLoadCompletion()
        }
      }, PAGE_SWITCH_MIN_TIME)
    }

    // If the user is currently in a game,
    // confirm they want to quit before switching
    // the page.
    if (
      this.appState.currentPagePath === 'GamePage' &&
      this.appState.session?.inGame
    ) {
      this.confirm(
        'Are you sure you want to quit?',
        (concludeAction: () => void) => {
          if (this.appState.session?.inGame) {
            // this.appState.session.game
            //   .quit(this.appState.session.user.userID)
            //   .then(() => {
            //     switchPage()
            //     this.appState.setSession({
            //       ...this.appState.session,
            //       game: undefined,
            //     })
            //     concludeAction()
            //   })
            //   .catch((error: Error) => {
            //     console.log(error)
            //     this.handleServerError('Failed to quit game.')
            //     concludeAction()
            //   })
          }
        },
      )
    }
    // Else, go ahead and switch the page.
    else {
      realizePageSwitch()
    }
  }

  // This will set the loading message
  // in the global state, switching the
  // user to the loading page until the
  // loading has been ended by the finishLoading
  // function.
  public beginLoading = (loadingMessage: string): void => {
    this.appState.setLoading(true)
    this.appState.setLoadingMessage(loadingMessage)
    this.appState.setLoadingMinTimeReached(false)
    setTimeout(() => {
      this.appState.setLoadingMinTimeReached(true)

      if (!this.appState.loading && this.appState.pageSwitchMinTimeReached) {
        this.handleLoadCompletion()
      }
    }, LOADING_MIN_TIME)
  }

  // This will end the loading process
  // started by the beginLoading function,
  // bringing the user to the current page
  // set in the global state.
  public finishLoading = (): void => {
    this.appState.setLoading(false)

    if (
      this.appState.loadingMinTimeReached &&
      this.appState.pageSwitchMinTimeReached
    ) {
      this.handleLoadCompletion()
    }
  }

  /**
   * Fetches the current session and stores the result in the global state variable "session", returning a promise for the session as well.
   * @return {Promise<TMetisSession>} The promise of the session.
   */
  public syncSession = async (): Promise<TMetisSession> => {
    return new Promise<TMetisSession>(async (resolve, reject) => {
      try {
        let session: TMetisSession = await User.fetchSession()
        this.appState.setSession(session)
        resolve(session)
      } catch (error: any) {
        this.handleError('Failed to sync session.')
        reject(error)
      }
    })
  }

  /**
   * Establish a web socket connection with the server. The new server connection will be stored in the global state variable "server".
   * @returns {Promise<ServerConnection>} The promise of the server connection.
   */
  public connectToServer = async (
    options: {
      disconnectExisting?: boolean
    } = {},
  ): Promise<ServerConnection> => {
    return new Promise<ServerConnection>(async (resolve, reject) => {
      let server: ServerConnection = new ServerConnection({
        on: {
          open: () => {
            console.log('Server connection opened.')
            this.appState.setServer(server)
            resolve(server)
          },
          close: () => {
            console.log('Server connection closed.')
          },
          error: ({ code, message }) => {
            console.error(`Server Connection Error (${code}):\n${message}`)

            if (code === ServerEmittedError.CODE_DUPLICATE_CLIENT) {
              this.handleError({
                message,
                // solutions: [
                //   {
                //     text: 'Force Connect',
                //     handleClick: () => {
                //       this.confirm(
                //         'Force connecting will disconnect the current connection to the server. Any unsaved changes may be lost. Do you wish to proceed?',
                //         async (concludeAction) => {
                //           let server: ServerConnection =
                //             await this.connectToServer({
                //               disconnectExisting: true,
                //             })
                //           concludeAction()
                //           resolve(server)
                //         },
                //         {
                //           buttonConfirmText: 'Proceed',
                //           pendingMessageUponConfirm: 'Force connecting...',
                //         },
                //       )
                //     },
                //     componentKey: 'force-connect',
                //   },
                // ],
              })
            }
          },
        },
        disconnectExisting: options.disconnectExisting ?? false,
      })
    })
  }

  /**
   * Handles an error passed. How it is handled is dependent on the value of the 'notifyMethod' property. By default, if none is selected, 'page' will be chosen as the notify method, which will navigate to the error page. A string can also be passed for quicker error handling.
   * @param {TAppError | string} error The error to handle. Strings will be converted to a TAppError object with default properties selected.
   */
  public handleError = (error: TAppError | string): void => {
    // Converts strings passed to TAppError
    // objects.
    if (typeof error === 'string') {
      error = { message: error }
    }

    // Parse notify method.
    let notifyMethod: TAppErrorNotifyMethod = error.notifyMethod ?? 'page'

    // Handle error accordingly.
    switch (notifyMethod) {
      // If notify via page, set the error
      // in the app state, which will trigger
      // the app renderer to render the error
      // page instead of the current page.
      case 'page':
        this.appState.setError(error)
        break
      // If notify via bubble, notify the
      // user with a bubble notification.
      case 'bubble':
        this.notify(error.message, { errorMessage: true })
        break
    }
  }

  // This can be called to the notify
  // the user of something.
  public notify = (
    message: string,
    options: INotifyOptions = {},
  ): Notification => {
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
  public confirm = (
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
  public prompt = (message: string, options: IPromptOptions = {}): void => {
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

  /**
   * This will logout the current user from the session, closing the connection with the server as well. Afterwards, the user will be navigated to the auth page.
   * @param {IAuthPageSpecific} authPageProps The props to pass to the auth page.
   */
  public logout = (authPageProps: IAuthPageSpecific) => {
    // Notify the user of logout.
    this.beginLoading('Signing out...')

    // If connected to the server via web
    // socket, disconnect now.
    if (this.appState.server !== null) {
      this.appState.server.disconnect()
      this.appState.setServer(null)
    }

    // Make request to logout.
    usersModule.logout(
      () => {
        // Clear session and navigate to
        // the auth page.
        this.appState.setSession(null)
        this.finishLoading()
        this.goToPage('AuthPage', authPageProps)
      },
      (error: Error) => {
        this.finishLoading()
        this.handleError('Failed to logout.')
      },
    )
  }
}

// This is the app state used
// throught the application.
export default class AppState implements IAppStateValues, IAppStateValues {
  forcedUpdateCounter: number
  server: ServerConnection | null
  session: TMetisSession
  currentPagePath: string
  currentPageProps: AnyObject
  appMountHandled: boolean
  loading: boolean
  loadingMessage: string
  loadingMinTimeReached: boolean
  pageSwitchMinTimeReached: boolean
  error: TAppError | null
  tooltips: React.RefObject<HTMLDivElement>
  tooltipDescription: string
  notifications: Notification[]
  postLoadNotifications: Array<Notification>
  confirmation: IConfirmation | null
  prompt: IPrompt | null
  missionNodeColors: Array<string>

  setForcedUpdateCounter: (forcedUpdateCounter: number) => void
  setServer: (server: ServerConnection | null) => void
  setSession: (session: TMetisSession) => void
  setCurrentPagePath: (currentPagePath: string) => void
  setCurrentPageProps: (currentPageProps: AnyObject) => void
  setAppMountHandled: (appMountHandled: boolean) => void
  setLoading: (loading: boolean) => void
  setLoadingMessage: (loadingMessage: string) => void
  setLoadingMinTimeReached: (loadingMinTimeReached: boolean) => void
  setPageSwitchMinTimeReached: (pageSwitchMinTimeReached: boolean) => void
  setError: (error: TAppError | null) => void
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
      server: null,
      session: null,
      currentPagePath: '',
      currentPageProps: {},
      appMountHandled: false,
      loading: true,
      loadingMessage: 'Initializing application...',
      loadingMinTimeReached: false,
      pageSwitchMinTimeReached: true,
      error: null,
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
      setServer: (): void => {},
      setSession: (): void => {},
      setCurrentPagePath: (): void => {},
      setCurrentPageProps: (): void => {},
      setAppMountHandled: (): void => {},
      setLoading: () => {},
      setLoadingMessage: () => {},
      setLoadingMinTimeReached: (): void => {},
      setPageSwitchMinTimeReached: (): void => {},
      setError: (): void => {},
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
    this.server = appStateValues.server
    this.session = appStateValues.session
    this.currentPagePath = appStateValues.currentPagePath
    this.currentPageProps = appStateValues.currentPageProps
    this.appMountHandled = appStateValues.appMountHandled
    this.loading = appStateValues.loading
    this.loadingMessage = appStateValues.loadingMessage
    this.loadingMinTimeReached = appStateValues.loadingMinTimeReached
    this.pageSwitchMinTimeReached = appStateValues.pageSwitchMinTimeReached
    this.error = appStateValues.error
    this.tooltips = appStateValues.tooltips
    this.tooltipDescription = appStateValues.tooltipDescription
    this.notifications = appStateValues.notifications
    this.postLoadNotifications = appStateValues.postLoadNotifications
    this.confirmation = appStateValues.confirmation
    this.prompt = appStateValues.prompt
    this.missionNodeColors = appStateValues.missionNodeColors

    this.setForcedUpdateCounter = appStateSetters.setForcedUpdateCounter
    this.setServer = appStateSetters.setServer
    this.setSession = appStateSetters.setSession
    this.setCurrentPagePath = appStateSetters.setCurrentPagePath
    this.setCurrentPageProps = appStateSetters.setCurrentPageProps
    this.setAppMountHandled = appStateSetters.setAppMountHandled
    this.setLoading = appStateSetters.setLoading
    this.setLoadingMessage = appStateSetters.setLoadingMessage
    this.setLoadingMinTimeReached = appStateSetters.setLoadingMinTimeReached
    this.setPageSwitchMinTimeReached =
      appStateSetters.setPageSwitchMinTimeReached
    this.setError = appStateSetters.setError
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
      const [server, setServer] = useStore<ServerConnection | null>('server')
      const [session, setSession] = useStore<TMetisSession>('session')
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
      const [error, setError] = useStore<TAppError | null>('error')
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
        server,
        session,
        currentPagePath,
        currentPageProps,
        appMountHandled,
        loading,
        loadingMessage,
        loadingMinTimeReached,
        pageSwitchMinTimeReached,
        error,
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
        setServer,
        setSession,
        setCurrentPagePath,
        setCurrentPageProps,
        setAppMountHandled,
        setLoading,
        setLoadingMessage,
        setLoadingMinTimeReached,
        setPageSwitchMinTimeReached,
        setError,
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
