import SessionClient from 'src/sessions'
import SessionMembers from './SessionMembers'
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
        <SessionMembers session={session} />
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
  session: SessionClient
}
