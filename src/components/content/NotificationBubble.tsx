import './NotificationBubble.scss'
import Notification from '../../modules/notifications'

// This will brand the app with the
// logo.
const NotificationBubble = (props: {
  notification: Notification
}): JSX.Element => {
  let notification: Notification = props.notification
  let className: string = 'NotificationBubble'

  if (notification.expired) {
    className += ' Expired'
  }
  if (notification.dismissed) {
    className += ' Dismissed'
  }

  return (
    <div className={className}>
      <div className='Message'>{notification.message}</div>
      <div className='Dismiss' onClick={() => notification.dismiss()}>
        x
      </div>
    </div>
  )
}

export default NotificationBubble
