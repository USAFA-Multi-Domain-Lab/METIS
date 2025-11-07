import type { SessionClient } from '@client/sessions/SessionClient'
import SessionMembers from './SessionMembers'
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
      <SessionMembers session={session} />
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
