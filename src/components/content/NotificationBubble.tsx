import './NotificationBubble.scss'
import Notification from '../../modules/notifications'
import Markdown, { MarkdownTheme } from './Markdown'

// This will brand the app with the
// logo.
const NotificationBubble = (props: {
  notification: Notification
}): JSX.Element => {
  let notification: Notification = props.notification
  let containerClassName: string = 'NotificationBubble'

  if (notification.expired) {
    containerClassName += ' Expired'
  }
  if (notification.dismissed) {
    containerClassName += ' Dismissed'
  }

  return (
    <div className={containerClassName}>
      <div className='Message'>
        <Markdown
          theme={MarkdownTheme.ThemeSecondary}
          markdown={notification.message}
        />
      </div>
      <div className='Dismiss' onClick={() => notification.dismiss()}>
        x
      </div>
    </div>
  )
}

export default NotificationBubble
