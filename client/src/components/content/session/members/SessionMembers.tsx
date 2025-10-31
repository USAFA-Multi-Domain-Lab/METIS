import { useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import ClientSession from 'src/sessions'
import ClientSessionMember from 'src/sessions/members'
import { compute } from 'src/toolbox'
import { useEventListener, useRequireLogin } from 'src/toolbox/hooks'
import SessionMemberRow from './SessionMemberRow'
import './SessionMembers.scss'

/**
 * A component displaying the users in the session.
 */
export default function SessionMembers({
  session,
}: TSessionUsers_P): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { handleError, prompt, beginLoading, finishLoading } =
    globalContext.actions
  const { login } = useRequireLogin()
  const [server] = globalContext.server
  const [members, setMembers] = useState<ClientSessionMember[]>(
    session.membersSorted,
  )

  /* -- HOOKS -- */

  // Update participant, observer, and manager
  // lists on session state change.
  useEventListener(server, 'session-members-updated', () => {
    setMembers(session.membersSorted)
  })

  /* -- RENDER -- */

  /**
   * Computed JSX for the list of members.
   */
  const rowsJsx = compute(() => {
    return members.map((member, index) => {
      let result: TReactElement[] = []

      // Get the next member that will be mapped,
      // if any.
      let nextMember: ClientSessionMember | undefined = members[index + 1]

      // Add the current member as a row to
      // the resulting JSX.
      result.push(
        <SessionMemberRow key={member._id} member={member} session={session} />,
      )

      // If the next member is not the same role as
      // the current member, add a row separator.
      // if (nextMember?.role !== member.role)
      //   result.push(<div className='RowSeparator'></div>)

      return result
    })
  })

  // Render the component.
  return (
    <div className='SessionMembers'>
      <div className='RowTitles'>
        <div className='CellTitle CellTitleName'>Name</div>
        <div className='CellTitle CellTitleRole'>Role</div>
        <div className='CellTitle CellTitleForce'>Force</div>
        <div className='CellTitle CellTitleControls'>Controls</div>
      </div>
      <div className='Rows'>{rowsJsx}</div>
    </div>
  )
}

/**
 * The props for `SessionUsers` component.
 */
export type TSessionUsers_P = {
  /**
   * The session client with the users to display.
   */
  session: ClientSession
}
