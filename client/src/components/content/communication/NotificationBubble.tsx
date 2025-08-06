import { useState } from 'react'
import { compute } from 'src/toolbox'
import { useEventListener, useListComponent } from 'src/toolbox/hooks'
import ClassList from '../../../../../shared/toolbox/html/class-lists'
import Notification from '../../../notifications'
import Markdown, { MarkdownTheme } from '../general-layout/Markdown'
import { ButtonText } from '../user-controls/buttons/ButtonText'
import If from '../util/If'
import './NotificationBubble.scss'
import { useNotifications } from './Notifications'

/**
 * Displays a notification bubble with a message and optional buttons.
 */
export default function NotificationBubble({
  notification,
}: TNotificationBubble_P) {
  /* -- CONTEXT -- */
  const { dismissNotification } = useNotifications().actions

  /* -- STATE -- */

  const [status, setStatus] = useState<Notification['status']>(
    notification.status,
  )
  const [buttons, setButtons] = useState<Notification['buttons']>(
    notification.buttons,
  )

  /* -- EFFECTS -- */

  useEventListener(notification, 'statusChange', () => {
    setStatus(notification.status)
  })

  useEventListener(notification, 'buttonsChange', () => {
    setButtons(notification.buttons)
  })

  /* -- COMPUTED -- */

  /**
   * JSX for the buttons in the notification bubble.
   */
  const ButtonJsx = compute<JSX.Element | null>(
    useListComponent(ButtonText, buttons, 'text'),
  )

  /**
   * The classes for the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('NotificationBubble')
    result.set('Expiring', status === 'expiring')
    return result
  })

  /**
   * The class name for the buttons container.
   */
  const buttonListClasses = compute<ClassList>(() => {
    let result = new ClassList('Buttons')
    result.set('Hidden', buttons.length === 0)
    return result
  })

  /**
   * The style for the root element.
   */
  const rootStyle = compute<React.CSSProperties>(() => {
    return {
      transition: `opacity ${Notification.EXPIRED_FADE_OUT_DURATION}ms linear`,
    }
  })

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value} style={rootStyle}>
      <div className='Message'>
        <Markdown
          theme={MarkdownTheme.ThemeSecondary}
          markdown={notification.message}
        />
      </div>
      <div
        className='Dismiss'
        onClick={() => dismissNotification(notification._id)}
      >
        x
      </div>
      <If condition={ButtonJsx}>
        <div className={buttonListClasses.value}>{ButtonJsx}</div>
      </If>
    </div>
  )
}

/* ---------------------------- TYPE(S) FOR NOTIFICATION BUBBLE ---------------------------- */

/**
 * Props for the {@link NotificationBubble} component.
 */
export type TNotificationBubble_P = {
  /**
   * The notification to display in the bubble.
   */
  notification: Notification
}
