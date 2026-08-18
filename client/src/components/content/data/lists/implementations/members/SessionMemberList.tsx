import Prompt from '@client/components/content/communication/Prompt'
import { useGlobalContext } from '@client/context/global'
import type { ClientSessionMember } from '@client/sessions/ClientSessionMember'
import type { SessionClient } from '@client/sessions/SessionClient'
import { useEventListener } from '@client/toolbox/hooks'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'
import type { TListSorting } from '../../List'
import List from '../../List'
import type {
  TGetItemButtonLabel,
  TOnItemButtonClick,
} from '../../pages/items/ListItem'
import SessionMemberForceCell, {
  shouldShowForceDropdown,
} from './cells/SessionMemberForceCell'
import SessionMemberRoleCell, {
  shouldShowRoleDropdown,
} from './cells/SessionMemberRoleCell'
import './SessionMemberList.scss'

/**
 * A component for displaying a list of session members.
 * @note Uses the `List` component.
 * @note This renders the rich role and force cells, and exposes the
 * member controls (kick/ban/unban) through the list's item options
 * menu, hiding each action based on the member's status.
 */
export default function SessionMemberList({
  session,
}: TSessionMemberList_P): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { prompt, beginLoading, finishLoading, handleError } =
    globalContext.actions
  const [members, setMembers] = useState<ClientSessionMember[]>(
    session.membersSorted,
  )

  /* -- HOOKS -- */

  // Keep the list in sync with member updates.
  useEventListener(server, 'session-members-updated', () => {
    setMembers([...session.membersSorted])
  })

  /* -- FUNCTIONS -- */

  /**
   * Gets the column label for a session member list.
   */
  const getColumnLabel = (column: keyof ClientSessionMember): string => {
    switch (column) {
      case 'role':
        return 'Role'
      case 'assignedForce':
        return 'Force'
      case 'status':
        return 'Status'
      default:
        return 'Unknown column'
    }
  }

  const getColumnWidth = (column: keyof ClientSessionMember) => {
    switch (column) {
      case 'status':
        return '6em'
      default:
        return '10em'
    }
  }

  /**
   * Gets the content for a session member list cell.
   */
  const getCellContent = (
    member: ClientSessionMember,
    column: keyof ClientSessionMember,
  ): React.ReactNode => {
    switch (column) {
      case 'role':
        return <SessionMemberRoleCell member={member} session={session} />
      case 'assignedForce':
        return <SessionMemberForceCell member={member} session={session} />
      case 'status':
        return StringToolbox.toTitleCase(member.status)
      default:
        return member[column]?.toString() ?? ''
    }
  }

  /**
   * @param member The member to check.
   * @returns whether a member cell should be selectable. The role and
   * force cells are only non-selectable when they render their own
   * interactive dropdown; when they show plain display text there is
   * no reason to block selection.
   */
  const isCellSelectable = (
    member: ClientSessionMember,
    column: keyof ClientSessionMember,
  ): boolean => {
    switch (column) {
      case 'role':
        return !shouldShowRoleDropdown(member, session)
      case 'assignedForce':
        return !shouldShowForceDropdown(member, session)
      default:
        return true
    }
  }

  /**
   * Gets status-based classes for a member's row, used to drive
   * row-level styling (e.g. red text for banned members).
   */
  const getAdditionalItemClasses = (member: ClientSessionMember): ClassList =>
    new ClassList().switch(
      {
        'joined': 'MemberStatus_Joined',
        'not-joined': 'MemberStatus_NotJoined',
        'banned': 'MemberStatus_Banned',
      },
      member.status,
    )

  /**
   * Sorts members for the role and force columns, since those cells
   * render JSX and can't be sorted by their raw value. Roles sort by
   * their canonical order in `MemberRole`, and forces by their order
   * in the mission's force array. Other columns defer to the default
   * sort.
   * @param a The first member to compare.
   * @param b The second member to compare.
   * @param sorting The current sorting state (column and direction).
   * @param applyDefault Applies the default sort for the two members.
   * @returns A negative, zero, or positive number, per `Array.sort`.
   */
  const sortMembers = (
    a: ClientSessionMember,
    b: ClientSessionMember,
    sorting: TListSorting<ClientSessionMember>,
    applyDefault: () => number,
  ): number => {
    // Only the role and force columns need custom sorting.
    if (sorting.method !== 'column-based') return applyDefault()

    // Compare ascending; the sort direction is applied afterward.
    const directed = (comparison: number): number =>
      sorting.direction === 'descending' ? -comparison : comparison

    // The index of a member's role in the canonical role order.
    const roleOrder = (member: ClientSessionMember): number =>
      MemberRole.AVAILABLE_ROLE_IDS.indexOf(member.roleId)

    // The index of a member's force in the mission's force array.
    // Members without a resolvable force sort after those with one.
    const forceOrder = (member: ClientSessionMember): number => {
      let index = session.mission.forces.findIndex(
        (force) => force._id === member.assignedForceId,
      )
      return index === -1 ? session.mission.forces.length : index
    }

    switch (sorting.column) {
      case 'role':
        return directed(roleOrder(a) - roleOrder(b))
      case 'assignedForce':
        return directed(forceOrder(a) - forceOrder(b))
      default:
        return applyDefault()
    }
  }

  /**
   * Gets whether a member control should be hidden. Controls are only
   * available to managers acting on non-managers, and each action is
   * further gated on the member's current status.
   */
  const getItemButtonHidden = (
    button: string,
    member: ClientSessionMember | null,
  ): boolean => {
    // Hide all controls if there is no member, the current member
    // can't manage members, or the target member can manage members.
    if (
      !member ||
      !session.member.isAuthorized('manageSessionMembers') ||
      member.isAuthorized('manageSessionMembers')
    ) {
      return true
    }

    switch (button) {
      // Kick is only available for members that have joined.
      case 'kick':
        return member.status !== 'joined'
      // Ban is available unless the member is already banned.
      case 'ban':
        return member.status === 'banned'
      // Unban is only available for banned members.
      case 'unban':
        return member.status !== 'banned'
      default:
        return false
    }
  }

  /**
   * Gets the tooltip label for a member control.
   */
  const getItemButtonLabel: TGetItemButtonLabel<ClientSessionMember> = (
    button,
  ) => {
    switch (button) {
      case 'kick':
        return 'Kick'
      case 'ban':
        return 'Ban'
      case 'unban':
        return 'Unban'
      default:
        return ''
    }
  }

  /**
   * Prompts for confirmation, then runs the given member action with
   * loading and error handling.
   */
  const runMemberAction = async (
    member: ClientSessionMember,
    confirmation: string,
    loadingMessage: string,
    action: () => Promise<void>,
    errorMessage: string,
  ): Promise<void> => {
    // Confirm the user wants to perform the operation.
    let { choice } = await prompt(confirmation, Prompt.ConfirmationChoices)

    // If the user cancels, return.
    if (choice === 'Cancel') return

    try {
      beginLoading(loadingMessage)
      await action()
    } catch (error) {
      handleError({ message: errorMessage, notifyMethod: 'bubble' })
    }

    finishLoading()
  }

  /**
   * Callback for when a member control is clicked.
   */
  const onItemButtonClick: TOnItemButtonClick<ClientSessionMember> = (
    button,
    member,
  ) => {
    switch (button) {
      case 'kick':
        runMemberAction(
          member,
          `Are you sure you want to kick "${member.username}"?`,
          `Kicking "${member.username}"...`,
          () => session.$kick(member._id),
          `Failed to kick "${member.username}".`,
        )
        break
      case 'ban':
        runMemberAction(
          member,
          `Are you sure you want to ban "${member.username}"?`,
          `Banning "${member.username}"...`,
          () => session.$ban(member._id),
          `Failed to ban "${member.username}".`,
        )
        break
      case 'unban':
        runMemberAction(
          member,
          `Are you sure you want to lift the ban on "${member.username}"?`,
          `Lifting ban on "${member.username}"...`,
          () => session.$unban(member._id),
          `Failed to lift ban on "${member.username}".`,
        )
        break
      default:
        console.warn('Unknown button clicked in member list.')
        break
    }
  }

  // Render the list of members.
  return (
    <div className='SessionMemberList'>
      <List<ClientSessionMember>
        name={'Members'}
        items={members}
        columns={['role', 'assignedForce', 'status']}
        searchBlacklist={['role', 'assignedForce']}
        getColumnWidth={getColumnWidth}
        getColumnLabel={getColumnLabel}
        getCellContent={getCellContent}
        isCellSelectable={isCellSelectable}
        getAdditionalItemClasses={getAdditionalItemClasses}
        sortItems={sortMembers}
        itemButtonIcons={['kick', 'ban', 'unban']}
        getItemButtonHidden={getItemButtonHidden}
        getItemButtonLabel={getItemButtonLabel}
        onItemButtonClick={onItemButtonClick}
      />
    </div>
  )
}

/**
 * Props for `SessionMemberList`.
 */
export type TSessionMemberList_P = {
  /**
   * The session whose members to display.
   */
  session: SessionClient
}
