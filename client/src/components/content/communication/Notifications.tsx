import {
  createContext,
  Provider,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import Notification from 'src/notifications'
import NotificationManager, {
  TAddNotificationOptions,
} from 'src/notifications/manager'
import NotificationBubble from './NotificationBubble'
import './Notifications.scss'

/**
 * Context for notifications.
 * @note This helps distribute props to child components.
 */
const NotificationsContext = createContext<TNotificationsContextData | null>(
  null,
)

/**
 * Custom hook used by Notifications-related components to access the
 * notifications context.
 */
export const useNotifications = (): TNotificationsContextData => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error(
      'useNotifications must be used within a notifications provider.',
    )
  }
  return context
}

export default function Notifications() {
  /* -- CONTEXT -- */
  const Provider: Provider<TNotificationsContextData> =
    NotificationsContext.Provider as Provider<TNotificationsContextData>

  /* -- STATE -- */

  const state: TNotifications_S = {
    notifications: useState<Notification[]>(
      NotificationManager.getNotifications(),
    ),
  }
  const [notifications, setNotifications] = state.notifications

  /* -- EFFECTS -- */

  // Connect to the NotificationManager when the component mounts
  useEffect(() => {
    // Register a listener for notification changes
    const removeListener = NotificationManager.addListener(
      (updatedNotifications) => setNotifications(updatedNotifications),
    )

    // Initialize with any existing notifications
    setNotifications(NotificationManager.getNotifications())

    // Clean up listener on unmount
    return () => removeListener()
  }, [])

  /* -- FUNCTIONS -- */

  /**
   * @see {@link TNotificationActions.actions}
   */
  const addNotification = useCallback(
    (message: string, options: TAddNotificationOptions = {}): Notification => {
      return NotificationManager.addNotification(message, options)
    },
    [],
  )

  /**
   * @see {@link TNotificationActions.actions}
   */
  const dismissNotification = useCallback((id: string): void => {
    NotificationManager.dismissNotification(id)
  }, [])

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * Context value that will be provided to child components.
   */
  const contextValue: TNotificationsContextData = {
    ...state,
    actions: {
      addNotification,
      dismissNotification,
    },
  }

  /* -- RENDER -- */

  return (
    <Provider value={contextValue}>
      <div className='Notifications'>
        {notifications.map((notification) => (
          <NotificationBubble
            key={notification._id}
            notification={notification}
          />
        ))}
      </div>
    </Provider>
  )
}

/* ---------------------------- TYPES FOR NOTIFICATIONS ---------------------------- */

/**
 * The state for {@link Notifications}, provided in the context.
 */
type TNotifications_S = {
  /**
   * The current list of notifications.
   */
  notifications: TReactState<Notification[]>
}

/**
 * The available actions for notifications, provided in the context.
 */
type TNotificationActions = {
  /**
   * Actions related to notifications.
   */
  actions: {
    /**
     * Adds a notification to the {@link NotificationManager}.
     * @param message The message to display in the notification.
     * @param options Optional settings for the notification.
     * @returns The created notification object.
     */
    addNotification: (
      message: string,
      options?: TAddNotificationOptions,
    ) => Notification
    /**
     * Dismisses a notification immediately.
     * @param id The ID of the notification to dismiss.
     */
    dismissNotification: (id: string) => void
  }
}

/**
 * The notifications context data provided to all children of the
 * {@link Notifications} component.
 */
type TNotificationsContextData = TNotifications_S & TNotificationActions
