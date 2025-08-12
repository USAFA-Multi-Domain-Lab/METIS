import { EventManager, TListenerTargetEmittable } from '../../../shared/events'
import StringToolbox from '../../../shared/toolbox/strings'
import { TButtonText_P } from '../components/content/user-controls/buttons/ButtonText'

/**
 * Notifies a user of an event or message.
 */
export default class Notification
  implements TNotification, TListenerTargetEmittable<TNotificationEventMethods>
{
  // Implemented
  public readonly _id: TNotification['_id']

  // Implemented
  public readonly createdAt: TNotification['createdAt']

  /**
   * @see {@link TNotification.status}
   */
  private _status: TNotification['status']
  public get status(): TNotification['status'] {
    return this._status
  }

  /**
   * Whether the notification is currently active.
   */
  private get active(): boolean {
    return this.status === 'active'
  }

  /**
   * Whether the notification is in the process of expiring.
   */
  private get expiring(): boolean {
    return this.status === 'expiring'
  }

  /**
   * Whether the notification has expired.
   */
  private get expired(): boolean {
    return this.status === 'expired'
  }

  /**
   * Manages the notification's event listeners and events.
   */
  private eventManager: EventManager<TNotificationEventMethods>

  /**
   * @see {@link TNotification}
   */
  private constructor(
    public readonly message: TNotification['message'],
    public readonly duration: TNotification['duration'],
    public readonly isError: TNotification['isError'],
    public readonly buttons: TNotification['buttons'],
    startExpirationTimer: TNotificationOptions['startExpirationTimer'],
  ) {
    this.message = message
    this.duration = duration
    this.isError = isError
    this.buttons = buttons

    // Initialize properties.
    this._id = StringToolbox.generateRandomId()
    this.createdAt = Date.now()
    this._status = 'active'

    // Initialize event manager.
    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent

    // Start the expiration timer if applicable.
    if (startExpirationTimer) this.startExpirationTimer()
  }

  // Implemented
  public emitEvent

  // Implemented
  public addEventListener

  // Implemented
  public removeEventListener

  /**
   * Starts the expiration timer for the notification.
   */
  public startExpirationTimer(): void {
    // Only start the timer for notifications that have a duration and are active
    if (this.duration && this.active) {
      setTimeout(() => {
        // Mark the notification as expiring.
        this._status = 'expiring'
        this.emitEvent('statusChange')

        // Remove the notification after it fades out from the UI.
        setTimeout(() => {
          this._status = 'expired'
          this.emitEvent('statusChange')
        }, Notification.EXPIRED_FADE_OUT_DURATION)
      }, this.duration)
    }
  }

  /**
   * Duration for which expired notifications fade out.
   * @unit `milliseconds`
   */
  public static readonly EXPIRED_FADE_OUT_DURATION: number = 1000 /*ms*/

  /**
   * Creates a new notification instance.
   * @param message The message to display in the notification.
   * @param options Optional settings for the notification.
   * @returns A new notification instance.
   */
  public static create(
    message: TNotification['message'],
    options: TNotificationOptions = {},
  ): Notification {
    const {
      duration = 5000,
      isError = false,
      buttons = [],
      startExpirationTimer = true,
    } = options

    return new Notification(
      message,
      duration,
      isError,
      buttons,
      startExpirationTimer,
    )
  }
}

/* ------------------------------ NOTIFICATION TYPES ------------------------------ */

/**
 * Options for creating a notification.
 */
export type TNotificationOptions = {
  /**
   * Duration for which the notification is displayed, in milliseconds.
   * @note If `null`, the notification does not expire automatically.
   * @default 5000 // (5 sec)
   */
  duration?: number | null
  /**
   * Whether the notification is an error message.
   * @default false
   */
  isError?: boolean
  /**
   * Buttons associated with the notification.
   * @default []
   */
  buttons?: TButtonText_P[]
  /**
   * Whether to start the expiration timer for the notification.
   * @default true
   */
  startExpirationTimer?: boolean
}

/**
 * Represents a notification in the application.
 */
export type TNotification = Omit<
  Required<TNotificationOptions>,
  'startExpirationTimer'
> & {
  /**
   * Unique identifier for the notification.
   */
  _id: string
  /**
   * The message to display in the notification.
   */
  message: string
  /**
   * The time when the notification was created, in milliseconds since epoch.
   */
  createdAt: number
  /**
   * The status of the notification.
   * @option `active:` Notification is currently displayed.
   * @option `expiring:` Notification is in the process of being dismissed.
   * @option `expired:` Notification has been dismissed or expired.
   */
  status: 'active' | 'expiring' | 'expired'
}

/**
 * An event that occurs on a mission, which can be listened for.
 * @option `statusChange:` The status of the notification has changed.
 * @option `buttonsChange:` The buttons associated with the notification have changed.
 */
type TNotificationEventMethods = 'statusChange' | 'buttonsChange'
