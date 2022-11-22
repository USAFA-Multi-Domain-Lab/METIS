import React from 'react'
import { useStore, withStore } from 'react-context-hook'
import usersModule from '../modules/users'
import { Mission } from '../modules/missions'
import { MissionNode } from '../modules/mission-nodes'
import { MissionNodeAction } from '../modules/mission-node-actions'
import { IUser } from '../modules/users'
import { AnyObject } from 'mongoose'
import Confirmation, { IConfirmation } from './content/Confirmation'
import Notification from '../modules/notifications'
import { EAjaxStatus } from '../modules/toolbox/ajax'
import { IAuthPageSpecific } from './pages/AuthPage'

/* -- INTERFACES -- */

export interface IAppStateValues {
  forcedUpdateCounter: number
  currentUser: IUser | null
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
  consoleOutputs: Array<{ date: number; value: string }>
  notifications: Array<Notification>
  postLoadNotifications: Array<Notification>
  confirmation: IConfirmation | null
  outputPanelIsDisplayed: boolean
  executeNodePathPromptIsDisplayed: boolean
  actionSelectionPromptIsDisplayed: boolean
  lastSelectedNode: MissionNode | null
  actionDisplay: Array<MissionNodeAction>
  actionName: string
  processTime: number
  actionSuccessChance: number
  allMissions: Array<Mission>
}

export interface IAppStateSetters {
  setForcedUpdateCounter: (forcedUpdateCounter: number) => void
  setCurrentUser: (user: IUser | null) => void
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
  setConsoleOutputs: (
    consoleOutputs: Array<{ date: number; value: string }>,
  ) => void
  setNotifications: (notifications: Array<Notification>) => void
  setPostLoadNotifications: (postLoadNotifications: Array<Notification>) => void
  setConfirmation: (confirmation: IConfirmation | null) => void
  setOutputPanelIsDisplayed: (outputPanelIsDisplayed: boolean) => void
  setExecuteNodePathPromptIsDisplayed: (
    executeNodePathPromptIsDisplayed: boolean,
  ) => void
  setActionSelectionPromptIsDisplayed: (
    actionSelectionPromptIsDisplayed: boolean,
  ) => void
  setLastSelectedNode: (lastSelectedNode: MissionNode | null) => void
  setActionDisplay: (actionDisplay: Array<MissionNodeAction>) => void
  setActionName: (actionName: string) => void
  setProcessTime: (processTime: number) => void
  setActionSuccessChance: (actionSuccessChance: number) => void
  setAllMissions: (allMissions: Array<Mission>) => void
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

/* -- CONSTANTS -- */

const loadingMinTime = 500
const pageSwitchMinTime = 500

/* -- CLASSES -- */

// These are actions that can be
// enacted upon the app state.
export class AppActions {
  appState: AppState

  constructor(appState: AppState) {
    this.appState = appState
  }

  _handleLoadCompletion = (): void => {
    for (let notification of this.appState.postLoadNotifications) {
      this.appState.notifications.push(notification)
      notification.startExpirationTimer()
    }
    this.appState.setPostLoadNotifications([])
  }

  // This will force the component to
  // rerender.
  forceUpdate = (): void => {
    this.appState.setForcedUpdateCounter(this.appState.forcedUpdateCounter + 1)
  }

  // This will go to a specific page
  // passing the necessary props.
  goToPage = (pagePath: string, pageProps: AnyObject): void => {
    this.appState.setLoadingMessage('Switching pages...')
    this.appState.setPageSwitchMinTimeReached(false)
    this.appState.setCurrentPagePath('')
    this.appState.setCurrentPageProps(pageProps)
    this.appState.setCurrentPagePath(pagePath)

    setTimeout(() => {
      this.appState.setPageSwitchMinTimeReached(true)

      if (!this.appState.loading && this.appState.loadingMinTimeReached) {
        this._handleLoadCompletion()
      }
    }, pageSwitchMinTime)
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

  // This will navigate the user to the
  // server error page, displaying the
  // given message.
  handleServerError = (errorMessage: string): void => {
    this.appState.setErrorMessage(errorMessage)
  }

  // This can be called to the notify
  // the user of something.
  notify = (message: string, duration?: number | null): Notification => {
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
      { duration, startExpirationTimer: !onLoadingPage },
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

  // This will logout the current user from
  // the session.
  logout = (authPageProps: IAuthPageSpecific) => {
    this.beginLoading('Signing out...')

    usersModule.logout(
      () => {
        this.appState.setCurrentUser(null)
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
  currentUser: IUser | null
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
  consoleOutputs: { date: number; value: string }[]
  notifications: Notification[]
  postLoadNotifications: Array<Notification>
  confirmation: IConfirmation | null
  outputPanelIsDisplayed: boolean
  executeNodePathPromptIsDisplayed: boolean
  actionSelectionPromptIsDisplayed: boolean
  lastSelectedNode: MissionNode | null
  actionDisplay: MissionNodeAction[]
  actionName: string
  processTime: number
  actionSuccessChance: number
  allMissions: Mission[]

  setForcedUpdateCounter: (forcedUpdateCounter: number) => void
  setCurrentUser: (user: IUser | null) => void
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
  setConsoleOutputs: (consoleOutputs: { date: number; value: string }[]) => void
  setNotifications: (notifications: Notification[]) => void
  setPostLoadNotifications: (postLoadNotifications: Array<Notification>) => void
  setConfirmation: (confirmation: IConfirmation | null) => void
  setOutputPanelIsDisplayed: (outputPanelIsDisplayed: boolean) => void
  setExecuteNodePathPromptIsDisplayed: (
    executeNodePathPromptIsDisplayed: boolean,
  ) => void
  setActionSelectionPromptIsDisplayed: (
    actionSelectionPromptIsDisplayed: boolean,
  ) => void
  setLastSelectedNode: (lastSelectedNode: MissionNode | null) => void
  setActionDisplay: (actionDisplay: MissionNodeAction[]) => void
  setActionName: (actionName: string) => void
  setProcessTime: (processTime: number) => void
  setActionSuccessChance: (actionSuccessChance: number) => void
  setAllMissions: (allMissions: Mission[]) => void

  static get defaultAppStateValues(): IAppStateValues {
    return {
      forcedUpdateCounter: 0,
      currentUser: null,
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
      consoleOutputs: [],
      notifications: [],
      postLoadNotifications: [],
      confirmation: null,
      outputPanelIsDisplayed: false,
      executeNodePathPromptIsDisplayed: false,
      actionSelectionPromptIsDisplayed: false,
      lastSelectedNode: null,
      actionDisplay: [],
      actionName: '',
      processTime: 0,
      actionSuccessChance: 0,
      allMissions: [],
    }
  }

  static get defaultAppStateSetters(): IAppStateSetters {
    return {
      setForcedUpdateCounter: () => {},
      setTooltipDescription: () => {},
      setCurrentUser: (): void => {},
      setCurrentPagePath: (): void => {},
      setCurrentPageProps: (): void => {},
      setAppMountHandled: (): void => {},
      setLoading: () => {},
      setLoadingMessage: () => {},
      setLoadingMinTimeReached: (): void => {},
      setPageSwitchMinTimeReached: (): void => {},
      setErrorMessage: (): void => {},
      setTooltips: (): void => {},
      setConsoleOutputs: (): void => {},
      setNotifications: (): void => {},
      setPostLoadNotifications: (): void => {},
      setConfirmation: (): void => {},
      setOutputPanelIsDisplayed: (): void => {},
      setExecuteNodePathPromptIsDisplayed: (): void => {},
      setActionSelectionPromptIsDisplayed: (): void => {},
      setLastSelectedNode: (): void => {},
      setActionDisplay: (): void => {},
      setActionName: (): void => {},
      setProcessTime: (): void => {},
      setActionSuccessChance: (): void => {},
      setAllMissions: (): void => {},
    }
  }

  constructor(
    appStateValues: IAppStateValues,
    appStateSetters: IAppStateSetters,
  ) {
    this.forcedUpdateCounter = appStateValues.forcedUpdateCounter
    this.currentUser = appStateValues.currentUser
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
    this.consoleOutputs = appStateValues.consoleOutputs
    this.notifications = appStateValues.notifications
    this.postLoadNotifications = appStateValues.postLoadNotifications
    this.confirmation = appStateValues.confirmation
    this.outputPanelIsDisplayed = appStateValues.outputPanelIsDisplayed
    this.executeNodePathPromptIsDisplayed =
      appStateValues.executeNodePathPromptIsDisplayed
    this.actionSelectionPromptIsDisplayed =
      appStateValues.actionSelectionPromptIsDisplayed
    this.lastSelectedNode = appStateValues.lastSelectedNode
    this.actionDisplay = appStateValues.actionDisplay
    this.actionName = appStateValues.actionName
    this.processTime = appStateValues.processTime
    this.actionSuccessChance = appStateValues.actionSuccessChance
    this.allMissions = appStateValues.allMissions

    this.setForcedUpdateCounter = appStateSetters.setForcedUpdateCounter
    this.setCurrentUser = appStateSetters.setCurrentUser
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
    this.setConsoleOutputs = appStateSetters.setConsoleOutputs
    this.setNotifications = appStateSetters.setNotifications
    this.setPostLoadNotifications = appStateSetters.setPostLoadNotifications
    this.setConfirmation = appStateSetters.setConfirmation
    this.setOutputPanelIsDisplayed = appStateSetters.setOutputPanelIsDisplayed
    this.setExecuteNodePathPromptIsDisplayed =
      appStateSetters.setExecuteNodePathPromptIsDisplayed
    this.setActionSelectionPromptIsDisplayed =
      appStateSetters.setActionSelectionPromptIsDisplayed
    this.setLastSelectedNode = appStateSetters.setLastSelectedNode
    this.setActionDisplay = appStateSetters.setActionDisplay
    this.setActionName = appStateSetters.setActionName
    this.setProcessTime = appStateSetters.setProcessTime
    this.setActionSuccessChance = appStateSetters.setActionSuccessChance
    this.setAllMissions = appStateSetters.setAllMissions
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
      const [currentUser, setCurrentUser] = useStore<IUser | null>(
        'currentUser',
      )
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
      const [consoleOutputs, setConsoleOutputs] = useStore<
        {
          date: number
          value: string
        }[]
      >('consoleOutputs')
      const [notifications, setNotifications] =
        useStore<Notification[]>('notifications')
      const [postLoadNotifications, setPostLoadNotifications] = useStore<
        Array<Notification>
      >('postLoadNotifications')
      const [confirmation, setConfirmation] = useStore<IConfirmation | null>(
        'confirmation',
      )
      const [outputPanelIsDisplayed, setOutputPanelIsDisplayed] =
        useStore<boolean>('outputPanelIsDisplayed')
      const [
        executeNodePathPromptIsDisplayed,
        setExecuteNodePathPromptIsDisplayed,
      ] = useStore<boolean>('executeNodePathPromptIsDisplayed')
      const [
        actionSelectionPromptIsDisplayed,
        setActionSelectionPromptIsDisplayed,
      ] = useStore<boolean>('actionSelectionPromptIsDisplayed')
      const [lastSelectedNode, setLastSelectedNode] =
        useStore<MissionNode | null>('lastSelectedNode')
      const [actionDisplay, setActionDisplay] =
        useStore<MissionNodeAction[]>('actionDisplay')
      const [actionName, setActionName] = useStore<string>('actionName')
      const [processTime, setProcessTime] = useStore<number>('processTime')
      const [actionSuccessChance, setActionSuccessChance] = useStore<number>(
        'actionSuccessChance',
      )
      const [allMissions, setAllMissions] = useStore<Mission[]>('allMissions')

      let appStateValues: IAppStateValues = {
        forcedUpdateCounter,
        currentUser,
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
        consoleOutputs,
        notifications,
        postLoadNotifications,
        confirmation,
        outputPanelIsDisplayed,
        executeNodePathPromptIsDisplayed,
        actionSelectionPromptIsDisplayed,
        lastSelectedNode,
        actionDisplay,
        actionName,
        processTime,
        actionSuccessChance,
        allMissions,
      }
      let appStateSetters: IAppStateSetters = {
        setForcedUpdateCounter,
        setCurrentUser,
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
        setConsoleOutputs,
        setNotifications,
        setPostLoadNotifications,
        setConfirmation,
        setOutputPanelIsDisplayed,
        setExecuteNodePathPromptIsDisplayed,
        setActionSelectionPromptIsDisplayed,
        setLastSelectedNode,
        setActionDisplay,
        setActionName,
        setProcessTime,
        setActionSuccessChance,
        setAllMissions,
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
