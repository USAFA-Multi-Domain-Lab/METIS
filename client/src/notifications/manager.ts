import Notification, { TNotificationOptions } from '.'

/**
 * Manages notifications in the application.
 */
export default class NotificationManager {
  /**
   * Listeners that listen for changes to notifications.
   */
  private static listeners: ((notifications: Notification[]) => void)[] = []

  /**
   * Current list of notifications in the application.
   */
  private static notifications: Notification[] = []

  /**
   * Notifies all listeners of the current notifications.
   */
  private static notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener([...this.notifications])
    })
  }

  /**
   * Adds a new notification to the state.
   * @param message The message to display in the notification.
   * @param options Optional settings for the notification.
   * @returns The created notification object.
   */
  public static addNotification(
    message: string,
    options: TAddNotificationOptions = {},
  ): Notification {
    // Create the notification and add it to the list of notifications
    const notification = Notification.create(message, options)
    this.notifications = [...this.notifications, notification]
    this.notifyListeners()

    // Set timeout for auto-dismissal if duration is provided
    const { _id } = notification
    const { startExpirationTimer = true } = options
    if (startExpirationTimer) this.expireNotification(_id)

    // Return the created notification
    return notification
  }

  /**
   * Dismisses a notification immediately.
   * @param notificationId The ID of the notification to dismiss.
   */
  public static dismissNotification(notificationId: string): void {
    this.removeNotification(notificationId)
  }

  /**
   * Starts the expiration process for a notification.
   * @param notificationId The ID of the notification to expire.
   */
  public static expireNotification(notificationId: string): void {
    this.notifications.forEach((notification) => {
      if (notification._id === notificationId) {
        notification.startExpirationTimer()
      }
    })
  }

  /**
   * Removes a notification from the state.
   * @param notificationId The ID of the notification to remove.
   */
  public static removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(
      ({ _id }) => _id !== notificationId,
    )

    this.notifyListeners()
  }

  /**
   * Retrieves the current list of notifications.
   * @returns The current list of notifications.
   */
  public static getNotifications(): Notification[] {
    return this.notifications
  }

  /**
   * Adds a listener that will be called whenever the notifications change.
   * @param listener The function to call when notifications change.
   */
  public static addListener(
    listener: (notifications: Notification[]) => void,
  ): () => void {
    this.listeners.push(listener)

    // Return function to remove the listener
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  /**
   * Starts the expiration timer for all active notifications.
   */
  public static expireAllNotifications(): void {
    this.notifications.forEach((notification) => {
      notification.startExpirationTimer()
    })
  }
}

/* ---------------------------- TYPES FOR NOTIFICATION MANAGER ---------------------------- */

/**
 * Options for adding a notification.
 * - Extends: {@link TNotificationOptions}
 */
export type TAddNotificationOptions = TNotificationOptions & {
  /**
   * Whether to start the expiration timer for the notification.
   * @default true
   */
  startExpirationTimer?: boolean
}
