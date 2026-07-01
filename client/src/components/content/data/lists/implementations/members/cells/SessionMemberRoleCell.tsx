import { DetailDropdown } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
import { useGlobalContext } from '@client/context/global'
import type { ClientSessionMember } from '@client/sessions/ClientSessionMember'
import type { SessionClient } from '@client/sessions/SessionClient'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type { TMemberRoleId } from '@shared/sessions/members/MemberRole'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import { useEffect, useState } from 'react'

/**
 * The role cell for a session member in a `List`.
 * @note Owns its own state/effects so it can be rendered as cell
 * content via `getCellContent`. Returns only the inner content; the
 * surrounding cell wrapper is provided by the list.
 */
export default function SessionMemberRoleCell({
  member,
  session,
  session: { member: currentMember },
}: TSessionMemberRoleCell_P): TReactElement | null {
  /* -- STATE -- */

  const { handleError } = useGlobalContext().actions
  const [assignedRole, setAssignedRole] = useState<MemberRole>(member.role)
  const [roleLock, setRoleLock] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The ID of the assigned role.
   */
  const assignedRoleId: TMemberRoleId = assignedRole._id

  /**
   * Whether the dropdown to assign a role to the member should
   * be shown.
   */
  const showRoleDropdown: boolean = shouldShowRoleDropdown(member, session)

  /* -- HOOKS -- */

  usePostInitEffect(() => {
    // If the current member can't manage session members,
    // return.
    if (!currentMember.isAuthorized('manageSessionMembers')) return

    // Gather details.
    let previousRole = member.role
    let previousRoleId = member.roleId

    // Request to assign the role if the state changes.
    if (assignedRoleId !== previousRoleId) {
      // Lock changes to the dropdown.
      setRoleLock(true)
      // Assign the role.
      session
        .$assignRole(member._id, assignedRoleId)
        .catch(() => {
          setAssignedRole(previousRole)
          handleError({
            message: 'Failed to assign role.',
            notifyMethod: 'bubble',
          })
        })
        .finally(() => setRoleLock(false))
    }
  }, [assignedRole])

  // Sync the assigned role on a member list update.
  useEffect(() => {
    if (assignedRoleId !== member.roleId) {
      setAssignedRole(member.role)
    }
  }, [member])

  /* -- RENDER -- */

  // If the current member can manage session members
  // and the target member can be assigned a role, render
  // the dropdown.
  if (showRoleDropdown) {
    return (
      <DetailDropdown<ClientSessionMember['role']>
        label={null}
        options={MemberRole.ASSIGNABLE_ROLES}
        value={assignedRole}
        setValue={setAssignedRole}
        isExpanded={false}
        getKey={(value) => value._id}
        render={(value) => value.name}
        fieldType='required'
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: MemberRole.AVAILABLE_ROLES['participant'],
        }}
        emptyText='Assign role'
        disabled={roleLock}
      />
    )
  }

  // Else, render the role name.
  return <span>{member.role.name}</span>
}

/**
 * Whether the role cell renders an interactive assignment dropdown
 * for the given member, as opposed to plain display text.
 * @param member The member whose role cell is being evaluated.
 * @param session The session that the member belongs to.
 * @returns Whether an assignment dropdown is rendered for the member.
 * @note Shared with the list so a text-only cell can remain
 * selectable.
 */
export function shouldShowRoleDropdown(
  member: ClientSessionMember,
  session: SessionClient,
): boolean {
  const currentMember = session.member
  return (
    member.isAuthorized('roleAssignable') &&
    currentMember.isAuthorized('manageSessionMembers') &&
    session.state === 'unstarted' &&
    !member.isAuthorized('completeVisibility') &&
    currentMember.isAuthorized('completeVisibility') &&
    !member.banned
  )
}

/**
 * Props for `SessionMemberRoleCell`.
 */
export type TSessionMemberRoleCell_P = {
  /**
   * The member whose role to display.
   */
  member: ClientSessionMember
  /**
   * The session that the member belongs to.
   */
  session: SessionClient
}
