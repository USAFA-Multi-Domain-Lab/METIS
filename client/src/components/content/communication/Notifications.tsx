import { useGlobalContext } from 'metis/client/context/global'
import NotificationBubble from './NotificationBubble'
import './Notifications.scss'

/**
 * The main Notifications component that manages and displays notifications.
 */
export default function Notifications() {
  /* -- STATE -- */
  const [notifications] = useGlobalContext().notifications

  /* -- RENDER -- */

  return (
    <div className='Notifications'>
      {notifications.map((notification) => (
        <NotificationBubble
          key={notification._id}
          notification={notification}
        />
      ))}
    </div>
  )
}
