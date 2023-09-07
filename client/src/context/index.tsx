import React, { ReactNode, useState } from 'react'
import ServerConnection from 'metis/client/connect/server'
import { TMetisSession } from 'metis/sessions'
import { AnyObject } from 'metis/toolbox/objects'
import { TAppError, TAppErrorNotifyMethod } from 'metis/client/components/App'
import Notification from 'metis/client/notifications'
import Confirmation, {
  IConfirmation,
} from 'metis/client/components/content/communication/Confirmation'
import Prompt, {
  IPrompt,
} from 'metis/client/components/content/communication/Prompt'
import User, { logout } from 'metis/users'
import { ServerEmittedError } from 'metis/connect/errors'
import { IButtonText } from 'metis/client/components/content/user-controls/ButtonText'
import { EAjaxStatus } from 'metis/toolbox/ajax'
import { IAuthPageSpecific } from 'metis/client/components/pages/AuthPage'

export type TGlobalContextValues = {
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

export type TGlobalContextActions = {
  /**
   * This will force the state of the entire app to update, causing
   * a rerender, even if no actual changes to the state were made.
   */
  forceUpdate: () => void
  /**
   * This will switch the currently rendered page to the requested page.
   * @param pagePath The path of the page to go to.
   * @param pageProps The props to pass to the destination page.
   */
  goToPage: (pagePath: string, pageProps: AnyObject) => void
  /**
   * This switching the user to the loading page until
   * the loading has been ended by the finishLoading
   * function.
   * @param {string | undefined} loadingMessage The message to display until
   * "finishLoading" is called. Defaults to "Initializing application...".
   */
  beginLoading: (loadingMessage?: string) => void
  /**
   * This will end the loading process started by the
   * beginLoading function, bringing the user to the
   * current page set in the global context.
   */
  finishLoading: () => void
  /**
   * Fetches the current session and stores the result in the global state
   * variable "session", returning a promise for the session as well.
   * @return {Promise<TMetisSession>} The promise of the session.
   */
  syncSession: () => Promise<TMetisSession>
  /**
   * Establish a web socket connection with the server. The new server
   * connection will be stored in the global state variable "server".
   * @param options Options when connecting to the server.
   * @returns {Promise<ServerConnection>} The promise of the server connection.
   */
  connectToServer: (options?: {
    disconnectExisting?: boolean
  }) => Promise<ServerConnection>
  /**
   * Handles an error passed. How it is handled is dependent on the value of
   * the 'notifyMethod' property. By default, if none is selected, 'page'
   * will be chosen as the notify method, which will navigate to the error
   * page. A string can also be passed for quicker error handling.
   * @param {TAppError | string} error The error to handle. Strings will be
   * converted to a TAppError object with default properties selected.
   */
  handleError: (error: TAppError | string) => void
  /**
   * This will notify the user with a notification bubble.
   * @param {string} message The message to display in the notification bubble.
   * @param {INotifyOptions | undefined} options The options to use for the notification.
   * @returns {Notification} The emitted notification.
   */
  notify: (message: string, options?: INotifyOptions) => Notification
  /**
   * This will pop up a confirmation box to confirm some action.
   * concludeAction must be called by the handleConfirmation
   * callback function to make the confirm box disappear.
   * @param {string} message The message to display in the confirmation box.
   * @param handleConfirmation The callback function to call when the user confirms the action.
   * @param {IConfirmOptions | undefined} options The options to use for the confirmation box.
   */
  confirm: (
    message: string,
    handleConfirmation: (concludeAction: () => void, entry: string) => void,
    options?: IConfirmOptions,
  ) => void
  /**
   * The will open an alert box with a prompt, providing
   * the user with options on how to respond.
   * @param {string} message The message to display in the prompt.
   * @param {IPromptOptions | undefined} options The options to use for the prompt.
   */
  createPrompt: (message: string, options?: IPromptOptions) => void
  /**
   * This will logout the current user from the session, closing the connection
   * with the server as well. Afterwards, the user will be navigated to the auth page.
   * @param {IAuthPageSpecific} authPageProps The props to pass to the auth page.
   */
  logout: (authPageProps: IAuthPageSpecific) => void
}

export type TGlobalContext = {
  [key in keyof TGlobalContextValues]: [
    TGlobalContextValues[key],
    React.Dispatch<React.SetStateAction<TGlobalContextValues[key]>>,
  ]
} & { actions: TGlobalContextActions }

export type TGlobalContextProperty = keyof TGlobalContextValues

/**
 * Options available when confirming an action using the
 * confirm method in the global context actions.
 */
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

/**
 * Options available when prompting a user with a message
 * using the prompt method in the global context actions.
 */
export interface IPromptOptions {
  buttonDismissalText?: string
}

/**
 * Options available when notifying the user using the
 * notify function in the global context actions.
 */
export interface INotifyOptions {
  duration?: number | null
  buttons?: Array<IButtonText>
  errorMessage?: boolean
}

function createDefault<TValue>(
  value: TValue,
): [TValue, React.Dispatch<React.SetStateAction<TValue>>] {
  return [value, () => {}]
}

const GLOBAL_DEFAULT_CONTEXT: TGlobalContext = {
  forcedUpdateCounter: createDefault(0),
  server: createDefault<ServerConnection | null>(null),
  session: createDefault<TMetisSession>(null),
  currentPagePath: createDefault(''),
  currentPageProps: createDefault({}),
  appMountHandled: createDefault(false),
  loading: createDefault(true),
  loadingMessage: createDefault('Initializing application...'),
  loadingMinTimeReached: createDefault(false),
  pageSwitchMinTimeReached: createDefault(true),
  error: createDefault<TAppError | null>(null),
  tooltips: createDefault(React.createRef()),
  tooltipDescription: createDefault(''),
  notifications: createDefault<Array<Notification>>([]),
  postLoadNotifications: createDefault<Array<Notification>>([]),
  confirmation: createDefault<IConfirmation | null>(null),
  prompt: createDefault<IPrompt | null>(null),
  missionNodeColors: createDefault<Array<string>>([]),
  actions: undefined as any,
}
const LOADING_MIN_TIME = 500
const PAGE_SWITCH_MIN_TIME = 500

const GlobalReactContext: React.Context<TGlobalContext> = React.createContext(
  GLOBAL_DEFAULT_CONTEXT,
)

const useGlobalContextDefinition = (context: TGlobalContext) => {
  /* -- CONTEXT STATE DEFINITION -- */

  // Loop through context and define
  // the state for each value except
  // actions.
  for (let key in context) {
    // Skip actions.
    if (key === 'actions') {
      return
    }
    // Determine default state, call
    // useState, then store the result
    // from react in the context.
    let contextAsAny: any = context
    let defaultState: any = (context as any)[key]
    contextAsAny[key] = useState(defaultState)
  }

  /* -- CONTEXT STATE EXTRACTION -- */

  // ! IMPORTANT - Context actions cannot be extracted yet because they are not defined until further below.

  const [forcedUpdateCounter, setForcedUpdateCounter] =
    context.forcedUpdateCounter
  const [server, setServer] = context.server
  const [session, setSession] = context.session
  const [currentPagePath, setCurrentPagePath] = context.currentPagePath
  const [currentPageProps, setCurrentPageProps] = context.currentPageProps
  const [appMountHandled, setAppMountHandled] = context.appMountHandled
  const [loading, setLoading] = context.loading
  const [loadingMessage, setLoadingMessage] = context.loadingMessage
  const [loadingMinTimeReached, setLoadingMinTimeReached] =
    context.loadingMinTimeReached
  const [pageSwitchMinTimeReached, setPageSwitchMinTimeReached] =
    context.pageSwitchMinTimeReached
  const [error, setError] = context.error
  const [tooltips, setTooltips] = context.tooltips
  const [tooltipDescription, setTooltipDescription] = context.tooltipDescription
  const [notifications, setNotifications] = context.notifications
  const [postLoadNotifications, setPostLoadNotifications] =
    context.postLoadNotifications
  const [confirmation, setConfirmation] = context.confirmation
  const [prompt, setPrompt] = context.prompt
  const [missionNodeColors, setMissionNodeColors] = context.missionNodeColors

  /* -- LOCAL FUNCTIONS -- */

  /**
   * This will handle the completion of
   * the loading process of the app.
   */
  const handleLoadCompletion = (): void => {
    for (let notification of postLoadNotifications) {
      notifications.push(notification)
      notification.startExpirationTimer()
    }
    setPostLoadNotifications([])
  }

  /* -- CONTEXT ACTION DEFINITION -- */

  context.actions = {
    forceUpdate: () => {
      setForcedUpdateCounter(forcedUpdateCounter + 1)
    },
    goToPage: (pagePath: string, pageProps: AnyObject) => {
      const { confirm } = context.actions

      // Actually switches the page. Called after any confirmations.
      const realizePageSwitch = (): void => {
        // Display to the user that the
        // page is loading.
        setLoadingMessage('Switching pages...')
        setPageSwitchMinTimeReached(false)

        // Set the current page props and path.
        setCurrentPagePath('')
        setCurrentPageProps(pageProps)
        setCurrentPagePath(pagePath)

        // If the page switch takes less than
        // the minimum time, wait until the
        // minimum time has passed before
        // completing the page switch. This will
        // make the page transition feel more
        // smooth.
        setTimeout(() => {
          setPageSwitchMinTimeReached(true)

          if (loading && loadingMinTimeReached) {
            handleLoadCompletion()
          }
        }, PAGE_SWITCH_MIN_TIME)
      }

      // If the user is currently in a game,
      // confirm they want to quit before switching
      // the page.
      if (currentPagePath === 'GamePage' && session?.inGame) {
        confirm(
          'Are you sure you want to quit?',
          (concludeAction: () => void) => {
            if (session?.inGame) {
              // session.game
              //   .quit(session.user.userID)
              //   .then(() => {
              //     switchPage()
              //     setSession({
              //       ...session,
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
    },
    // in the global state, switching the
    // user to the loading page until the
    // loading has been ended by the finishLoading
    // function.
    beginLoading: (loadingMessage?: string) => {
      setLoading(true)
      setLoadingMessage(
        loadingMessage ?? GLOBAL_DEFAULT_CONTEXT.loadingMessage[0],
      )
      setLoadingMinTimeReached(false)
      setTimeout(() => {
        setLoadingMinTimeReached(true)

        if (!loading && pageSwitchMinTimeReached) {
          handleLoadCompletion()
        }
      }, LOADING_MIN_TIME)
    },
    finishLoading: () => {
      setLoading(false)

      if (loadingMinTimeReached && pageSwitchMinTimeReached) {
        handleLoadCompletion()
      }
    },
    syncSession: async (): Promise<TMetisSession> => {
      const { handleError } = context.actions

      return new Promise<TMetisSession>(async (resolve, reject) => {
        try {
          let session: TMetisSession = await User.fetchSession()
          setSession(session)
          resolve(session)
        } catch (error: any) {
          handleError('Failed to sync session.')
          reject(error)
        }
      })
    },
    connectToServer: async (
      options: {
        disconnectExisting?: boolean
      } = {},
    ): Promise<ServerConnection> => {
      const { handleError } = context.actions

      return new Promise<ServerConnection>(async (resolve, reject) => {
        let server: ServerConnection = new ServerConnection({
          on: {
            'open': () => {
              console.log('Server connection opened.')
              setServer(server)
              resolve(server)
            },
            'close': () => {
              console.log('Server connection closed.')
            },
            'connection-loss': () => {
              handleError('Lost connection to server.')
            },
            'error': ({ code, message }) => {
              console.error(`Server Connection Error (${code}):\n${message}`)

              if (code === ServerEmittedError.CODE_DUPLICATE_CLIENT) {
                handleError({
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
    },
    handleError: (error: TAppError | string): void => {
      const { notify } = context.actions

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
          setError(error)
          break
        // If notify via bubble, notify the
        // user with a bubble notification.
        case 'bubble':
          notify(error.message, { errorMessage: true })
          break
      }
    },
    notify: (message: string, options: INotifyOptions = {}): Notification => {
      const { forceUpdate } = context.actions

      let onLoadingPage: boolean =
        loading || !loadingMinTimeReached || !pageSwitchMinTimeReached

      let notification: Notification = new Notification(
        message,
        (dismissed: boolean, expired: boolean) => {
          if (dismissed) {
            notifications.splice(notifications.indexOf(notification), 1)
          } else if (expired) {
            setTimeout(() => {
              notifications.splice(notifications.indexOf(notification), 1)
              forceUpdate()
            }, 1000)
          }
          forceUpdate()
        },
        { ...options, startExpirationTimer: !onLoadingPage },
      )

      if (!onLoadingPage) {
        notifications.push(notification)
      } else {
        postLoadNotifications.push(notification)
      }

      forceUpdate()
      return notification
    },
    confirm: (
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
          setConfirmation({
            ...confirmation,
            confirmAjaxStatus: EAjaxStatus.Loading,
          })
          handleConfirmation(() => {
            setConfirmation(null)
          }, entry)
        },
        handleAlternate: options.handleAlternate
          ? (entry: string) => {
              if (options.handleAlternate) {
                setConfirmation({
                  ...confirmation,
                  alternateAjaxStatus: EAjaxStatus.Loading,
                })
                options.handleAlternate(() => {
                  setConfirmation(null)
                }, entry)
              }
            }
          : null,
        handleCancelation: () => setConfirmation(null),
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

      setConfirmation(confirmation)
    },
    createPrompt: (message: string, options: IPromptOptions = {}): void => {
      let prompt: IPrompt = {
        active: true,
        promptMessage: message,
        handleDismissal: () => setPrompt(null),
        buttonDismissalText: options.buttonDismissalText
          ? options.buttonDismissalText
          : Prompt.defaultProps.buttonDismissalText,
      }

      setPrompt(prompt)
    },
    logout: (authPageProps: IAuthPageSpecific) => {
      // Extract context actions.
      const { beginLoading, finishLoading, handleError, goToPage } =
        context.actions

      // Notify the user of logout.
      beginLoading('Signing out...')

      // If connected to the server via web
      // socket, disconnect now.
      if (server !== null) {
        server.disconnect()
        setServer(null)
      }

      // Make request to logout.
      logout(
        () => {
          // Clear session and navigate to
          // the auth page.
          setSession(null)
          finishLoading()
          goToPage('AuthPage', authPageProps)
        },
        (error: Error) => {
          finishLoading()
          handleError('Failed to logout.')
        },
      )
    },
  }
}

const GlobalContextProvider = function GlobalContextProvider(props: {
  children: ReactNode
}) {
  // Extract props.
  const { children } = props

  // Initialize context with the default
  // values.
  let context: TGlobalContext = {
    ...GLOBAL_DEFAULT_CONTEXT,
  }

  // Use the context definition to load
  // the state of the context into the
  // context object.
  useGlobalContextDefinition(context)

  // Return JSX with the context provider
  // wrapping the children dependent on
  // the context.
  return (
    <GlobalReactContext.Provider value={context}>
      {children}
    </GlobalReactContext.Provider>
  )
}

const GlobalContext = {
  Provider: GlobalContextProvider,
}

export function useGlobalContext(): TGlobalContext {
  return React.useContext<TGlobalContext>(GlobalReactContext)
}

export default GlobalContext
