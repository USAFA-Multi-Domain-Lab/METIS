import { useListComponent } from 'src/toolbox/hooks'
import Notification from '../../../notifications'
import Markdown, { MarkdownTheme } from '../general-layout/Markdown'
import { ButtonText } from '../user-controls/ButtonText'
import './NotificationBubble.scss'

// This will brand the app with the
// logo.
const NotificationBubble = (props: {
  notification: Notification
}): JSX.Element => {
  let Buttons = useListComponent(ButtonText, props.notification.buttons, 'text')

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
        <Buttons />
      </div>
    </div>
  )
}

export default NotificationBubble
