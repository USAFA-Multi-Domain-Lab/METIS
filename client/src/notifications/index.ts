import { v4 as generateHash } from 'uuid'
import { TButtonText_P } from '../components/content/user-controls/ButtonText'

export interface INotificationOptions {
  duration?: number | null
  errorMessage?: boolean
  buttons?: Array<TButtonText_P>
  startExpirationTimer?: boolean
}

const defaultDuration: number = 5000

// This represents a notification that
// can be displayed to the user.
export default class Notification {
  _notificationID: string
  _message: string
  _handleDismissalOrExpiration: (dismissed: boolean, expired: boolean) => void
  _duration: number | null /* ms */
  _buttons: Array<TButtonText_P>
  _dismissed: boolean
  _expired: boolean
  _expirationTimerStarted: boolean
  _errorMessage: boolean

  get notificationID(): string {
    return this._notificationID
  }

  get message(): string {
    return this._message
  }

  get duration(): number | null {
    return this._duration
  }

  get buttons(): Array<TButtonText_P> {
    return this._buttons
  }

  // This is whether the user dismissed
  // the notifiation themselves.
  get dismissed(): boolean {
    return this._dismissed
  }

  // This is whether the notification
  // expired after the set duration.
  get expired(): boolean {
    return this._expired
  }

  // This is whether the notification
  // was either dismissed by the user,
  // or had expired after the alotted
  // duration.
  get dismissedOrExpired(): boolean {
    return this._dismissed || this._expired
  }

  // This is if the message is an error
  // message or not.
  get errorMessage(): boolean {
    return this._errorMessage
  }

  constructor(
    message: string,
    handleDismissalOrExpiration: (dismissed: boolean, expired: boolean) => void,
    options: INotificationOptions,
  ) {
    this._notificationID = generateHash()
    this._message = message
    this._handleDismissalOrExpiration = handleDismissalOrExpiration
    this._duration =
      options.duration !== undefined ? options.duration : defaultDuration
    this._buttons = options.buttons !== undefined ? options.buttons : []
    this._dismissed = false
    this._expired = false
    this._expirationTimerStarted = false
    this._errorMessage =
      options.errorMessage !== undefined ? options.errorMessage : false

    if (
      options.startExpirationTimer === true ||
      options.startExpirationTimer === undefined
    ) {
      this.startExpirationTimer()
    }
  }

  // This will dismiss this notification.
  dismiss(): void {
    if (!this.dismissedOrExpired) {
      this._dismissed = true
      this._handleDismissalOrExpiration(true, false)
    }
  }

  // This will start the expiration
  // timer if it hasn't been started
  // already.
  startExpirationTimer(): void {
    if (this._duration !== null && !this._expirationTimerStarted) {
      setTimeout(() => {
        if (!this._dismissed) {
          this._expired = true
          this._handleDismissalOrExpiration(false, true)
        }
      }, this._duration)
      this._expirationTimerStarted = true
    }
  }
}
