import React, { ReactNode, useState } from 'react'
import { TAppError, TAppErrorNotifyMethod } from 'src/components/App'
import Confirmation, {
  IConfirmation,
} from 'src/components/content/communication/Confirmation'
import { message as connectionStatusMessage } from 'src/components/content/communication/ConnectionStatus'
import Prompt, { IPrompt } from 'src/components/content/communication/Prompt'
import { TButtonText } from 'src/components/content/user-controls/ButtonText'
import { PAGE_REGISTRY, TPage_P } from 'src/components/pages'
import ServerConnection from 'src/connect/servers'
import Notification from 'src/notifications'
import { useMountHandler, useUnmountHandler } from 'src/toolbox/hooks'
import ClientUser from 'src/users'
import { ServerEmittedError } from '../../../shared/connect/errors'
import { TMetisSession } from '../../../shared/sessions'
import ObjectToolbox, { AnyObject } from '../../../shared/toolbox/objects'
import StringToolbox from '../../../shared/toolbox/strings'

/* -- constants -- */

/**
 * The default values of the global context state.
 */
const GLOBAL_CONTEXT_VALUES_DEFAULT: TGlobalContextValues = {
  forcedUpdateCounter: 0,
  server: null,
  session: null,
  currentPageKey: 'BlankPage',
  currentPageProps: {},
  appMountHandled: false,
  loading: true,
  loadingMessage: 'Initializing application...',
  loadingMinTimeReached: false,
  pageSwitchMinTimeReached: true,
  error: null,
  tooltips: React.createRef<HTMLDivElement>(),
  tooltipDescription: '',
  notifications: [],
  confirmation: null,
  prompt: null,
  missionNodeColors: [],
}

/**
 * Delay in milliseconds before the message is cleared after the connection
 * has been reopened.
 */
const CONNECT_MESSAGE_CLEAR_DELAY = 3000

/**
 * The default value of the global context passed in the
 * provider.
 */
const globalContextDefault: TGlobalContext = ObjectToolbox.map(
  GLOBAL_CONTEXT_VALUES_DEFAULT,
  (key: string, value: any) => {
    return [value, () => {}]
  },
)

/**
 * The React context used for the global context. This is obfuscated
 * and managed by the GlobalContext class exposed as the default export.
 */
const globalReactContext: React.Context<TGlobalContext> =
  React.createContext(globalContextDefault)

/**
 * Cache of middleware used for navigation events.
 */
const navigationMiddleware: Map<string, TNavigationMiddleware> = new Map<
  string,
  TNavigationMiddleware
>()

/* -- functions -- */

/**
 * Used as a hook in the GlobalContextProvider component to populate the context with the state before supplying it to consumers.
 * @param context The global context to define, should contain only default values that will be overwritten by what is stored in the state.
 */
const useGlobalContextDefinition = (context: TGlobalContext) => {
  /* -- CONSTANTS -- */

  const LOADING_MIN_TIME = 500
  const PAGE_SWITCH_MIN_TIME = 500

  /* -- CONTEXT STATE DEFINITION -- */

  const [globalState, setGlobalState] = useState<any>(
    GLOBAL_CONTEXT_VALUES_DEFAULT,
  )

  // Loop through context and define
  // the state for each value except
  // actions.
  for (let key in context) {
    type TValue = [any, React.Dispatch<React.SetStateAction<any>>]

    // Skip actions.
    if (key === 'actions') {
      continue
    }
    // Determine default state, call
    // useState, then store the result
    // from react in the context.
    let contextAsAny: any = context

    contextAsAny[key] = [
      globalState[key],
      (arg1: any | ((prevState: any) => any)) => {
        let previousState: any = globalState[key]
        let updatedState: any

        if (typeof arg1 === 'function') {
          updatedState = arg1(previousState)
        } else {
          updatedState = arg1
        }
        setGlobalState((previousGlobalState: any) => {
          return {
            ...previousGlobalState,
            [key]: updatedState,
          }
        })
      },
    ] as TValue
  }

  /* -- CONTEXT STATE EXTRACTION -- */

  // ! IMPORTANT - Context actions cannot be extracted yet because they are not defined until further below.

  const [forcedUpdateCounter, setForcedUpdateCounter] =
    context.forcedUpdateCounter
  const [server, setServer] = context.server
  const [session, setSession] = context.session
  const [currentPageKey, setCurrentPageKey] = context.currentPageKey
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
  const [confirmation, setConfirmation] = context.confirmation
  const [prompt, setPrompt] = context.prompt
  const [missionNodeColors, setMissionNodeColors] = context.missionNodeColors

  /* -- PRIVATE STATE -- */

  const [postLoadNotifications, setPostLoadNotifications] = useState<
    Notification[]
  >([])
  const [initialConnectionFailed, setInitialConnectionFailed] =
    useState<boolean>(false)

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
    navigateTo: (pageKey, props) => {
      // Actually switches the page. Called after any confirmations.
      const realizePageSwitch = (): void => {
        // Display to the user that the
        // page is loading.
        setLoadingMessage('Switching pages...')
        setPageSwitchMinTimeReached(false)

        // Set the current page props and path.
        setCurrentPageKey(pageKey)
        setCurrentPageProps(props)

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

      // Create an array from navigation middleware.
      const middlewares: TNavigationMiddleware[] = Array.from(
        navigationMiddleware.values(),
      )

      // Cursor for tracking which middleware to
      // call next.
      let cursor: number = 0

      // A function for determining which middleware to
      // call next.
      const next = () => {
        // See if end is reached.
        if (cursor + 1 === middlewares.length) {
          // Call realizePageSwitch.
          realizePageSwitch()
        }
        // Else call next middleware.
        else {
          cursor++
          middlewares[cursor](pageKey, next)
        }
      }

      if (middlewares.length > 0) {
        middlewares[0](pageKey, next)
      } else {
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
        loadingMessage ?? globalContextDefault.loadingMessage[0],
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
    syncSession: async (): Promise<TMetisSession<ClientUser>> => {
      const { handleError } = context.actions

      return new Promise<TMetisSession<ClientUser>>(async (resolve, reject) => {
        try {
          let session: TMetisSession<ClientUser> =
            await ClientUser.$fetchSession()
          setSession(session)
          resolve(session)
        } catch (error: any) {
          handleError('Failed to sync session.')
          reject(error)
        }
      })
    },
    connectToServer: (
      options: {
        disconnectExisting?: boolean
      } = {},
    ): Promise<ServerConnection> => {
      const { handleError, beginLoading } = context.actions

      return new Promise<ServerConnection>(async (resolve, reject) => {
        let server: ServerConnection = new ServerConnection({
          on: {
            'connection-success': () => {
              setServer(server)
              resolve(server)
            },
            'reconnection-success': () => {
              // Update server with updated connection object.
              setServer(server)
              // If a message was displayed to the user notifying
              // of connection loss, then show a message notifying
              // of reconnection.
              if (connectionStatusMessage.value?.color === 'Red') {
                // Update status message.
                connectionStatusMessage.value = {
                  message: 'Connection reestablished.',
                  color: 'Green',
                }
                // Set a timeout to clear the message.
                setTimeout(() => {
                  // If the connection status is open, then
                  // clear the message.
                  if (server.status === 'open') {
                    connectionStatusMessage.value = null
                  }
                }, CONNECT_MESSAGE_CLEAR_DELAY)
              }
            },
            'connection-failure': () => {
              // Update loading message to reflect connection failure.
              beginLoading(
                'Failed to connect to server. Retrying until connection is established...',
              )
            },
            'connection-loss': () => {
              // Wait three seconds, then display a connection
              // loss message.
              setTimeout(() => {
                // If the connection status is still not open,
                // then display a connection loss message.
                if (server.status !== 'open') {
                  // Update status message.
                  connectionStatusMessage.value = {
                    message: 'Connection dropped. Attempting to reconnect...',
                    color: 'Red',
                  }
                }
              }, 3000)
            },
            'error': ({ code, message }) => {
              if (code === ServerEmittedError.CODE_DUPLICATE_CLIENT) {
                handleError({
                  message,
                  // solutions: [
                  //   {
                  //     text: 'Force Connect',
                  //     onClick: () => {
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
        confirmAjaxStatus: 'NotLoaded',
        alternateAjaxStatus: 'NotLoaded',
        active: true,
        confirmationMessage: message,
        handleConfirmation: (entry: string) => {
          setConfirmation({
            ...confirmation,
            confirmAjaxStatus: 'Loading',
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
                  alternateAjaxStatus: 'Loading',
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
    logout: async () => {
      // Extract context actions.
      const { beginLoading, finishLoading, handleError, navigateTo } =
        context.actions

      // Notify the user of logout.
      beginLoading('Signing out...')

      // If connected to the server via web
      // socket, disconnect now.
      if (server !== null) {
        server.disconnect()
        setServer(null)
      }

      try {
        await ClientUser.$logout()
        setSession(null)
        finishLoading()
        navigateTo('AuthPage', {})
      } catch (error: any) {
        finishLoading()
        handleError('Failed to logout.')
      }
    },
  }
}

/**
 * The provider to be used in the root component of METIS.
 * @param { children: ReactNode } props Props containing the children to wrap in the provider.
 * @returns {JSX.Element} The JSX of the provider wrapping the children passed.
 */
function GlobalContextProvider(props: { children: ReactNode }): JSX.Element {
  // Extract props.
  const { children } = props

  // Initialize context with the default
  // values.
  let context: TGlobalContext = {
    ...globalContextDefault,
  }

  // Use the context definition to load
  // the state of the context into the
  // context object.
  useGlobalContextDefinition(context)

  // Return JSX with the context provider
  // wrapping the children dependent on
  // the context.
  return (
    <globalReactContext.Provider value={context}>
      {children}
    </globalReactContext.Provider>
  )
}

/**
 * Used as a hook in function components as a consumer of the global context.
 * @returns {TGlobalContext} The value of the global context.
 */
export function useGlobalContext(): TGlobalContext {
  return React.useContext<TGlobalContext>(globalReactContext)
}

/**
 * Defines middleware for whenever a navigation event is created.
 * @param middleware The navigation middleware.
 */
export function useNavigationMiddleware(
  middleware: TNavigationMiddleware,
): void {
  const [key] = useState<string>(StringToolbox.generateRandomID())

  useMountHandler((done) => {
    navigationMiddleware.set(key, middleware)
  })

  useUnmountHandler(() => {
    navigationMiddleware.delete(key)
  })
}

/* -- classes -- */

/**
 * The global context management system for METIS.
 */
export default class GlobalContext {
  /**
   * The provider to be used in the root component of METIS.
   * @param { children: ReactNode } props Props containing the children to wrap in the provider.
   * @returns {JSX.Element} The JSX of the provider wrapping the children passed.
   */
  public static Provider = GlobalContextProvider
  /**
   * The consumer to be used in any component that needs to consume the global context.
   */
  public static Consumer = globalReactContext.Consumer
  /**
   * Used as a hook in function components as a consumer of the global context.
   * @returns {TGlobalContext} The value of the global context.
   */
  public static useGlobalContext = useGlobalContext
}

/* -- types -- */

/**
 * The values available in the global context.
 */
export type TGlobalContextValues = {
  forcedUpdateCounter: number
  server: ServerConnection | null
  session: TMetisSession<ClientUser>
  currentPageKey: keyof typeof PAGE_REGISTRY
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
  confirmation: IConfirmation | null
  prompt: IPrompt | null
  missionNodeColors: string[]
}

/**
 * The actions available in the global context via
 * the actions property.
 */
export type TGlobalContextActions = {
  /**
   * This will force the state of the entire app to update, causing
   * a rerender, even if no actual changes to the state were made.
   */
  forceUpdate: () => void
  /**
   * This will switch the currently rendered page to the requested page.
   * @param page The page to navigate to.
   * @param props The props to pass to the destination page.
   */
  navigateTo: <
    TPageKey extends keyof typeof PAGE_REGISTRY,
    TComponent extends (typeof PAGE_REGISTRY)[TPageKey],
    TProps extends Parameters<TComponent>[0] extends {}
      ? Parameters<TComponent>[0]
      : {},
  >(
    pageKey: TPageKey,
    props: TProps,
  ) => void
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
   * @return {Promise<TMetisSession<ClientUser>>} The promise of the session.
   */
  syncSession: () => Promise<TMetisSession<ClientUser>>
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
   */
  logout: () => void
}

/**
 * The value of the global context passed
 * to consumers.
 */
export type TGlobalContext = {
  [key in keyof TGlobalContextValues]: [
    TGlobalContextValues[key],
    React.Dispatch<React.SetStateAction<TGlobalContextValues[key]>>,
  ]
} & { actions: TGlobalContextActions }

/**
 * Represents any key used in the global context.
 */
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
  buttons?: TButtonText[]
  errorMessage?: boolean
}

/**
 * Middleware that is run during navigation between pages.
 * @note If `next` is not called, the navigation will be aborted.
 * @param to The destination of the navigation event.
 * @param next Proceed to the next navigation middleware.
 */
export type TNavigationMiddleware = <TProps extends TPage_P>(
  to: keyof typeof PAGE_REGISTRY,
  next: () => void,
) => void
