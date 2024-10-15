import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { TAppError, TAppErrorNotifyMethod } from 'src/components/App'
import { message as connectionStatusMessage } from 'src/components/content/communication/ConnectionStatus'
import {
  TPromptResult,
  TPrompt_P,
} from 'src/components/content/communication/Prompt'
import { TButtonMenu_P } from 'src/components/content/user-controls/buttons/ButtonMenu'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { TButtonText_P } from 'src/components/content/user-controls/buttons/ButtonText'
import { PAGE_REGISTRY, TPage_P } from 'src/components/pages'
import ServerConnection, { IServerConnectionOptions } from 'src/connect/servers'
import MetisInfo from 'src/info'
import ClientLogin from 'src/logins'
import Notification from 'src/notifications'
import ClientUser from 'src/users'
import { v4 as generateHash } from 'uuid'
import { TResponseEvents, TServerEvents } from '../../../shared/connect/data'
import { ServerEmittedError } from '../../../shared/connect/errors'
import { TLogin } from '../../../shared/logins'
import { TExecutionCheats } from '../../../shared/missions/actions/executions'
import ObjectToolbox, {
  AnyObject,
  TWithKey,
} from '../../../shared/toolbox/objects'
import { Vector2D } from '../../../shared/toolbox/space'
import StringToolbox from '../../../shared/toolbox/strings'

/* -- constants -- */

/**
 * The default values of the global context state.
 */
const GLOBAL_CONTEXT_VALUES_DEFAULT: TGlobalContextValues = {
  info: new MetisInfo({
    name: '',
    description: '',
    version: '',
  }),
  forcedUpdateCounter: 0,
  server: null,
  login: null,
  currentPageKey: 'BlankPage',
  currentPageProps: {},
  appMountHandled: false,
  loading: true,
  loadingMessage: 'Initializing application...',
  loadingMinTimeReached: false,
  pageSwitchMinTimeReached: true,
  error: null,
  buttonMenu: null,
  tooltips: React.createRef<HTMLDivElement>(),
  tooltipDescription: '',
  notifications: [],
  promptData: null,
  cheats: {
    zeroCost: true,
    instantaneous: false,
    guaranteedSuccess: true,
  },
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
  /**
   * This is a reference to the latest context.
   * @note This is useful for callbacks.
   */
  const contextRef = useRef<TGlobalContext>(context)

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

  const [info, setInfo] = context.info
  const [forcedUpdateCounter, setForcedUpdateCounter] =
    context.forcedUpdateCounter
  const [server, setServer] = context.server
  const [login, setLogin] = context.login
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
  const [buttonMenu, setButtonMenu] = context.buttonMenu
  const [notifications, setNotifications] = context.notifications
  const [promptData, setPromptData] = context.promptData

  /**
   * Handles a member being kicked from a session.
   */
  const onMemberKicked = useRef<(event: TResponseEvents['kicked']) => void>(
    () => {},
  )
  /**
   * Handles a member being banned from a session.
   */
  const onMemberBanned = useRef<(event: TResponseEvents['banned']) => void>(
    () => {},
  )
  /**
   * Handles an error emitted by the server.
   */
  const onServerError = useRef<(event: TServerEvents['error']) => void>(
    () => {},
  )
  const onPageMinTimeReached = useRef<() => void>(() => {})
  const onLoadCompletion = useRef<() => void>(() => {})

  /* -- HOOKS -- */

  // This effect updates varioius event listener functions,
  // giving them access to the current context.
  useEffect(() => {
    onMemberKicked.current = (event: TResponseEvents['kicked']) => {
      const { handleError } = context.actions

      if (login?.user._id === event.data.userId) {
        handleError('You have been kicked from the session.')
      }
    }

    onMemberBanned.current = (event: TResponseEvents['banned']) => {
      const { handleError } = context.actions

      if (login?.user._id === event.data.userId) {
        handleError('You have been banned from the session.')
      }
    }

    onServerError.current = ({ code, message }) => {
      const { handleError } = context.actions

      switch (code) {
        case ServerEmittedError.CODE_UNAUTHENTICATED:
          if (login !== null) {
            setLogin(null)
            connectionStatusMessage.value = null
          }
          break
        case ServerEmittedError.CODE_SWITCHED_CLIENT:
          handleError({
            message:
              'You have been disconnected because you have connected from another location.',
            notifyMethod: 'page',
          })
          break
        case ServerEmittedError.CODE_MESSAGE_RATE_LIMIT:
          handleError(message)
          break
      }
    }
  }, [login])

  // This effect updates the page loading functions
  // giving them access to the current context.
  useEffect(() => {
    onPageMinTimeReached.current = () => {
      setPageSwitchMinTimeReached(true)
      if (!loading && loadingMinTimeReached) onLoadCompletion.current()
    }
    onLoadCompletion.current = () => {
      for (let notification of notifications)
        notification.startExpirationTimer()
    }
  }, [loading, loadingMinTimeReached, notifications])

  /* -- CONTEXT ACTION DEFINITION -- */

  context.actions = {
    forceUpdate: () => {
      setForcedUpdateCounter(forcedUpdateCounter + 1)
    },
    navigateTo: (pageKey, props, options = {}) => {
      // Scroll to top so that the content
      // for the loading page is properly
      // displayed.
      window.scrollTo(0, 0)
      // Hide the button menu in case it is
      // currently displayed.
      setButtonMenu(null)

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
        setTimeout(() => onPageMinTimeReached.current(), PAGE_SWITCH_MIN_TIME)
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

      // If there is middleware to run and the
      // bypassMiddleware option is not set, run
      // the middleware.
      if (middlewares.length > 0 && !options.bypassMiddleware) {
        middlewares[0](pageKey, next)
      } else {
        // Else realize the page switch immediately.
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
        // Get the latest context.
        const [loading] = contextRef.current.loading
        const [pageSwitchMinTimeReached] =
          contextRef.current.pageSwitchMinTimeReached

        setLoadingMinTimeReached(true)

        if (!loading && pageSwitchMinTimeReached) {
          onLoadCompletion.current()
        }
      }, LOADING_MIN_TIME)
    },
    finishLoading: () => {
      setLoading(false)

      if (loadingMinTimeReached && pageSwitchMinTimeReached) {
        onLoadCompletion.current()
      }
    },
    loadLoginInfo: async (): Promise<TLogin<ClientUser>> => {
      const { handleError } = context.actions

      return new Promise<TLogin<ClientUser>>(async (resolve, reject) => {
        try {
          let login: TLogin<ClientUser> = await ClientLogin.$fetchLoginInfo()
          setLogin(login)
          resolve(login)
        } catch (error: any) {
          handleError('Failed to load login information.')
          reject(error)
        }
      })
    },
    connectToServer: (): Promise<ServerConnection> => {
      const { handleError, beginLoading } = context.actions

      return new Promise<ServerConnection>(async (resolve, reject) => {
        let options: IServerConnectionOptions = {
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
            'dismissed': () => {
              handleError('You have been dismissed from the session.')
            },
            'kicked': (event) => onMemberKicked.current(event),
            'banned': (event) => onMemberBanned.current(event),
            'session-destroyed': () => {
              handleError('The session you were in has been deleted.')
            },
            'error': (event) => {
              onServerError.current(event)

              if (event.code === ServerEmittedError.CODE_DUPLICATE_CLIENT) {
                handleError({
                  message: event.message,
                  notifyMethod: 'page',
                  solutions: [
                    {
                      text: 'Switch Tabs',
                      onClick: () => {
                        // Clear error.
                        setError(null)
                        // Begin loading again.
                        beginLoading('Switching tabs...')
                        // Mark `disconnectExisting` as true to disconnect the existing connection.
                        options.disconnectExisting = true
                        // Pass options back into the `ServerConnection`
                        // class and try again.
                        server = new ServerConnection(options)
                      },
                    },
                    {
                      text: 'Logout',
                      onClick: async () => {
                        // Logout the user.
                        await context.actions.logout()
                        // Clear error.
                        setError(null)
                      },
                    },
                  ],
                })
              }
            },
          },
        }
        let server: ServerConnection = new ServerConnection(options)
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
    notify: (message: string, options: TNotifyOptions = {}): Notification => {
      let onLoadingPage: boolean =
        loading || !loadingMinTimeReached || !pageSwitchMinTimeReached

      let notification: Notification = new Notification(
        message,
        (dismissed: boolean, expired: boolean) => {
          // Get the notifications from the latest context.
          const [notifications] = contextRef.current.notifications

          if (dismissed) {
            notifications.splice(notifications.indexOf(notification), 1)
          } else if (expired) {
            setTimeout(() => {
              notifications.splice(notifications.indexOf(notification), 1)
              setNotifications([...notifications])
            }, 1000)
          }
          setNotifications([...notifications])
        },
        { ...options, startExpirationTimer: !onLoadingPage },
      )

      setNotifications([...notifications, notification])

      return notification
    },
    prompt: <TChoice extends string, TList extends object = {}>(
      message: string,
      choices: TChoice[],
      options: TPromptOptions<TChoice, TList> = {},
    ): Promise<TPromptResult<TChoice, TList>> => {
      const { textField, capitalizeChoices, list, defaultChoice } = options

      // Return a promise that will be resolved once the
      // user makes a choice.
      return new Promise<TPromptResult<TChoice, TList>>((resolve) => {
        // Create prompt.
        let promptData: TWithKey<TPrompt_P<TChoice, TList>> = {
          message,
          choices,
          resolve,
          textField,
          capitalizeChoices,
          list,
          defaultChoice,
          key: generateHash(),
        }

        // Store prompt in state.
        setPromptData(promptData)
      })
    },
    showButtonMenu: <TButton extends TButtonSvgType>(
      buttons: TButton[],
      onButtonClick: (button: TButton) => void,
      options: TShowButtonMenuOptions<TButton> = {},
    ): void => {
      // Parse options.
      const {
        position = new Vector2D(100, 100),
        positioningTarget,
        highlightTarget,
        getDescription,
      } = options
      // Prepare the button menu props.
      const buttonMenuProps: TWithKey<TButtonMenu_P> = {
        key: StringToolbox.generateRandomId(),
        buttons,
        position,
        positioningTarget,
        highlightTarget,
        onButtonClick: (button) => {
          // Preprocess the button click,
          // starting by hiing the button menu.
          setButtonMenu(null)

          // Call the callback passed.
          onButtonClick(button as TButton)
        },
        onCloseRequest: () => {
          setButtonMenu(null)
        },
      }

      // If a description function is provided,
      // pass a new function with pre-processing
      // that calls the function provided.
      if (getDescription) {
        buttonMenuProps.getDescription = (button) =>
          getDescription(button as TButton)
      }

      // Update the state.
      setButtonMenu(buttonMenuProps)
    },
    hideButtonMenu: (): void => {
      setButtonMenu(null)
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
        await ClientLogin.$logOut()
        navigateTo('AuthPage', {})
        setLogin(null)
        finishLoading()
      } catch (error: any) {
        finishLoading()
        handleError('Failed to logout.')
      }
    },
  }

  // Update the context reference with the
  // latest context.
  contextRef.current = context
}

/**
 * The provider to be used in the root component of METIS.
 * @param props Props containing the children to wrap in the provider.
 * @returns The JSX of the provider wrapping the children passed.
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
 * @returns The value of the global context.
 */
export function useGlobalContext(): TGlobalContext {
  return React.useContext<TGlobalContext>(globalReactContext)
}

/**
 * Defines middleware for whenever a navigation event is created.
 * @param middleware The navigation middleware.
 * @param dependencies The dependencies to watch for changes.
 */
export function useNavigationMiddleware(
  middleware: TNavigationMiddleware,
  dependencies: React.DependencyList = [],
): void {
  const [key] = useState<string>(StringToolbox.generateRandomId())

  useEffect(() => {
    navigationMiddleware.set(key, middleware)

    return () => {
      navigationMiddleware.delete(key)
    }
  }, dependencies)
}

/* -- classes -- */

/**
 * The global context management system for METIS.
 */
export default class GlobalContext {
  /**
   * The provider to be used in the root component of METIS.
   * @param props Props containing the children to wrap in the provider.
   * @returns The JSX of the provider wrapping the children passed.
   */
  public static Provider = GlobalContextProvider
  /**
   * The consumer to be used in any component that needs to consume the global context.
   */
  public static Consumer = globalReactContext.Consumer
  /**
   * Used as a hook in function components as a consumer of the global context.
   * @returns The value of the global context.
   */
  public static useGlobalContext = useGlobalContext
}

/* -- types -- */

/**
 * The values available in the global context.
 */
export type TGlobalContextValues = {
  info: MetisInfo
  forcedUpdateCounter: number
  server: ServerConnection | null
  login: TLogin<ClientUser>
  currentPageKey: keyof typeof PAGE_REGISTRY
  currentPageProps: AnyObject
  appMountHandled: boolean
  loading: boolean
  loadingMessage: string
  loadingMinTimeReached: boolean
  pageSwitchMinTimeReached: boolean
  error: TAppError | null
  /**
   * The button menu to display.
   * @note If null, no button menu will be displayed.
   */
  buttonMenu: TWithKey<TButtonMenu_P> | null
  tooltips: React.RefObject<HTMLDivElement>
  tooltipDescription: string
  notifications: Notification[]
  /**
   * Current prompt to display to the user.
   */
  promptData: TWithKey<TPrompt_P<any, any>> | null
  /**
   * Global settings for cheats when executing actions.
   * This will ensure that when the user executes an action,
   * the cheats will be the same as the last action executed.
   */
  cheats: TExecutionCheats
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
    options?: TNavigateOptions,
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
   * Fetches the current login information and stores the result in the global state
   * variable "login", returning a promise for the login as well.
   * @return {Promise<TLogin<ClientUser>>} The promise of the login information.
   */
  loadLoginInfo: () => Promise<TLogin<ClientUser>>
  /**
   * Establish a web socket connection with the server. The new server
   * connection will be stored in the global state variable "server".
   * @returns The promise of the server connection.
   */
  connectToServer: () => Promise<ServerConnection>
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
   * Opens the prompt modal to display a specified message, prompting the user to
   * choose from a list of choices.
   * @param message The message to display to the user.
   * @param choices The choices the user can make.
   * @param options Additional configuration for the prompt.
   * @returns A promise that resolves with the user's choice.
   */
  prompt: <TChoice extends string, TList extends object = {}>(
    message: string,
    choices: TChoice[],
    options?: TPromptOptions<TChoice, TList>,
  ) => Promise<TPromptResult<TChoice, TList>>
  /**
   * Displays a button menu at the specified position.
   * @param buttons The buttons to display in the menu.
   * @param onButtonClick The function to call when a button is clicked.
   * @param options Additional configuration for the button menu.
   */
  showButtonMenu: <TButton extends TButtonSvgType>(
    buttons: TButton[],
    onButtonClick: (button: TButton) => void,
    options?: TShowButtonMenuOptions<TButton>,
  ) => void
  /**
   * Hides the button menu if it is currently displayed.
   */
  hideButtonMenu: () => void
  /**
   * This will notify the user with a notification bubble.
   * @param message The message to display in the notification bubble.
   * @param options The options to use for the notification.
   * @returns The emitted notification.
   */
  notify: (message: string, options?: TNotifyOptions) => Notification
  /**
   * This will logout the user that is currently logged in, closing the connection
   * with the server as well. Afterwards, the user will be navigated to the auth page.
   */
  logout: () => Promise<void>
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
 * Options available when navigating to a page using the
 * `navigateTo` method in the global context actions.
 */
export type TNavigateOptions = {
  /**
   * If true, all navigation middleware will be skipped.
   * @default false
   */
  bypassMiddleware?: boolean
}

/**
 * Options available when confirming an action using the
 * confirm method in the global context actions.
 */
export type TConfirmOptions = {
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
export type TPromptOptions<
  TChoice extends string,
  TList extends object = {},
> = Omit<TPrompt_P<TChoice, TList>, 'message' | 'choices' | 'resolve'>

/**
 * Options available when notifying the user using the
 * notify function in the global context actions.
 */
export type TNotifyOptions = {
  duration?: number | null
  buttons?: TButtonText_P[]
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

/**
 * Options for showing a button menu.
 */
export type TShowButtonMenuOptions<TButton extends TButtonSvgType> = {
  /**
   * The focal position at which to place the button menu.
   * @note The actual position may be adjusted to ensure the
   * button menu is fully visible on the screen.
   * @note If not provided, this will be determined by the
   * current mouse position.
   */
  position?: TButtonMenu_P['position']
  /**
   * A target element relative to which the button menu can
   * be positioned.
   * @note This will nullify the `position` property, if
   * provided.
   */
  positioningTarget?: HTMLElement
  /**
   * A target element to highlight, showing the relationship
   * between the element and the button menu.
   * @note Applies 'ButtonMenuHighlight' class to the target element.
   * Styles should be defined in the CSS.
   */
  highlightTarget?: HTMLElement
  /**
   * A function to get the description for a button.
   * @param button The button for which to get the description.
   * @returns The description for the button, if null, the type
   * will be used in its plain text form.
   * @note If this function is not provided, the type will be
   * used in its plain text form.
   */
  getDescription?: (button: TButton) => string | null
}
