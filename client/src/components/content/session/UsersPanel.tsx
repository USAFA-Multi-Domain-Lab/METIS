import ClientSession from 'src/sessions'
import SessionUsers from './SessionUsers'
import './UsersPanel.scss'

/**
 * A panel displaying the users in the session.
 */
export default function UsersPanel({
  session,
}: TUsersPanel_P): JSX.Element | null {
  /* -- RENDER -- */

  return (
    <div className='UsersPanel'>
      <div className='BorderBox'>
        <SessionUsers session={session} />
      </div>
    </div>
  )
}

/**
 * The props for `UsersPanel` component.
 */
export type TUsersPanel_P = {
  /**
   * The session client with the users to display.
   */
  session: ClientSession
}
