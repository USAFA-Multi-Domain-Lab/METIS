import './NotificationBubble.scss'
import Notification from '../../modules/notifications'
import Markdown, { MarkdownTheme } from './Markdown'
import { ButtonText, IButtonText } from './ButtonText'

// This will brand the app with the
// logo.
const NotificationBubble = (props: {
  notification: Notification
}): JSX.Element => {
  let notification: Notification = props.notification
  let containerClassName: string = 'NotificationBubble'
  let buttonsClassName: string = 'Buttons'

  if (notification.expired) {
    containerClassName += ' Expired'
  }
  if (notification.dismissed) {
    containerClassName += ' Dismissed'
  }
  if (notification.buttons.length === 0) {
    buttonsClassName += 'Hidden'
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
      <div className={buttonsClassName}>
        {notification.buttons.map((button: IButtonText) => {
          return <ButtonText {...button} />
        })}
      </div>
    </div>
  )
}

export default NotificationBubble
