import { v4 as generateHash } from 'uuid'

// This represents a notification that
// can be displayed to the user.
export default class Notification {
  _notificationID: string
  _message: string
  _handleDismissalOrExpiration: (dismissed: boolean, expired: boolean) => void
  _duration: number | null /* ms */
  _dismissed: boolean
  _expired: boolean

  get notificationID(): string {
    return this._notificationID
  }

  get message(): string {
    return this._message
  }

  get duration(): number | null {
    return this._duration
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

  constructor(
    message: string,
    handleDismissalOrExpiration: (dismissed: boolean, expired: boolean) => void,
    duration: number | null = 3000,
  ) {
    this._notificationID = generateHash()
    this._message = message
    this._handleDismissalOrExpiration = handleDismissalOrExpiration
    this._duration = duration
    this._dismissed = false
    this._expired = false

    this._age()
  }

  // This will age the notification for
  // the duration set.
  _age(): void {
    if (this._duration !== null) {
      setTimeout(() => {
        if (!this._dismissed) {
          this._expired = true
          this._handleDismissalOrExpiration(false, true)
        }
      }, this._duration)
    }
  }

  // This will dismiss this notification.
  dismiss(): void {
    if (!this.dismissedOrExpired) {
      this._dismissed = true
      this._handleDismissalOrExpiration(true, false)
    }
  }
}
