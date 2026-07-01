import type { SessionClient } from '@client/sessions/SessionClient'
import SessionMemberList from '../../data/lists/implementations/members/SessionMemberList'
import './SessionMembersPanel.scss'

/**
 * A panel displaying the members in the session.
 */
export default function SessionMembersPanel({
  session,
}: TSessionMembersPanel_P): TReactElement | null {
  /* -- RENDER -- */

  return (
    <div className='SessionMembersPanel'>
      <SessionMemberList session={session} />
    </div>
  )
}

/**
 * The props for `SessionMembersPanel` component.
 */
export type TSessionMembersPanel_P = {
  /**
   * The session client with the members to display.
   */
  session: SessionClient
}
