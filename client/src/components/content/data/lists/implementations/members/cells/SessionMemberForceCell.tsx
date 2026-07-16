import Tooltip from '@client/components/content/communication/Tooltip'
import { DetailLocked } from '@client/components/content/form/DetailLocked'
import { DetailDropdown } from '@client/components/content/form/dropdowns/standard/DetailDropdown'
import { useGlobalContext } from '@client/context/global'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { ClientSessionMember } from '@client/sessions/ClientSessionMember'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import { useEffect, useState } from 'react'

/**
 * The force cell for a session member in a `List`.
 * @note Owns its own state/effects so it can be rendered as cell
 * content via `getCellContent`. Returns only the inner content; the
 * surrounding cell wrapper is provided by the list.
 */
export default function SessionMemberForceCell({
  member,
  session,
  session: { member: currentMember },
}: TSessionMemberForceCell_P): TReactElement | null {
  /* -- STATE -- */

  const { handleError } = useGlobalContext().actions
  const [assignedForce, setAssignedForce] = useState<ClientMissionForce | null>(
    member.assignedForce,
  )
  const [forceLock, setForceLock] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The ID of the assigned force.
   */
  const assignedForceId = compute<string | null>(
    () => assignedForce?._id ?? null,
  )

  /**
   * Whether the session is in single-player mode.
   */
  const isSinglePlayer: boolean = session.config.mode === 'single-player'

  /**
   * Whether the target member can be assigned a force.
   */
  const targetIsForceAssignable: boolean =
    member.isAuthorized('forceAssignable')

  /**
   * Whether the target member is effectively assigned to a force.
   * @note In single-player mode, force-assignable members are always
   * routed to the configured single-player force, so they read as
   * assigned even before an explicit assignment lands.
   */
  const targetEffectivelyAssigned: boolean =
    member.assignedForceId != null || (isSinglePlayer && targetIsForceAssignable)

  /**
   * Whether the target member has complete visibility.
   */
  const targetCompleteVisibility: boolean =
    member.isAuthorized('completeVisibility')

  /**
   * Whether the target member can manipulate nodes.
   */
  const targetManipulatesNodes: boolean = member.isAuthorized('manipulateNodes')

  /**
   * Whether the current member has complete visibility.
   */
  const currentCompleteVisibility: boolean =
    currentMember.isAuthorized('completeVisibility')

  /**
   * Whether the current member has limited visibility.
   */
  const currentLimitedVisibility: boolean = member.roleId === 'observer_limited'

  /**
   * Whether the dropdown to assign a force to the member should
   * be shown.
   */
  const showForceDropdown: boolean = shouldShowForceDropdown(member, session)

  /* -- HOOKS -- */

  usePostInitEffect(() => {
    // If the current member can't manage session members,
    // return.
    if (!currentMember.isAuthorized('manageSessionMembers')) return

    // Gather details.
    let previousForce = member.assignedForce
    let previousForceId = member.assignedForceId

    // Request to assign the force if the state changes.
    if (assignedForceId !== previousForceId) {
      // Lock changes to the dropdown.
      setForceLock(true)
      // Assign the force.
      session
        .$assignForce(member._id, assignedForceId)
        .catch(() => {
          setAssignedForce(previousForce)
          handleError({
            message: 'Failed to assign force.',
            notifyMethod: 'bubble',
          })
        })
        .finally(() => setForceLock(false))
    }
  }, [assignedForce])

  // Sync the assigned force on a member list update.
  useEffect(() => {
    if (assignedForceId !== member.assignedForceId) {
      setAssignedForce(member.assignedForce)
    }
  }, [member])

  /* -- RENDER -- */

  /**
   * The JSX for the text to display when the
   * dropdown is not shown.
   */
  const forceTextJsx = compute<TReactElement>(() => {
    let style: React.CSSProperties = { color: 'gray', fontStyle: 'italic' }
    let text: string = ''

    if (member.banned) {
      text = 'N/A'
    } else if (targetCompleteVisibility) {
      text = targetManipulatesNodes ? 'Complete control' : 'Complete visibility'
    } else if (!currentCompleteVisibility && !currentLimitedVisibility) {
      text = targetEffectivelyAssigned ? 'Assigned' : 'Not assigned'
    } else if (!currentCompleteVisibility && currentLimitedVisibility) {
      text = targetEffectivelyAssigned ? 'Assigned (view only)' : 'Not assigned'
    } else if (assignedForce) {
      delete style.fontStyle
      style.color = assignedForce.color
      text = assignedForce.name
    } else {
      text = 'Not assigned'
    }

    return <span style={style}>{text}</span>
  })

  // If the current member can manage session members
  // and the target member can be assigned a force, render
  // the dropdown.
  if (showForceDropdown) {
    return (
      <DetailDropdown<ClientMissionForce>
        label={null}
        options={session.mission.forces}
        value={assignedForce}
        setValue={setAssignedForce}
        isExpanded={false}
        getKey={(value) => value?._id}
        render={(value) => {
          return (
            <>
              <span style={{ color: value.color }}>{value.name}</span>
              <Tooltip
                description={`*${value.name}*\n\t\n**Click to assign to force**`}
              />
            </>
          )
        }}
        fieldType='optional'
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: null,
        }}
        emptyText='Assign force'
        disabled={forceLock}
      />
    )
  }

  // In single-player mode, show the configured force as a locked
  // field for force-assignable members visible to the manager.
  if (isSinglePlayer && targetIsForceAssignable && currentCompleteVisibility) {
    let singlePlayerForce = session.mission.getForceById(
      session.config.singlePlayerForceId,
    )
    return (
      <DetailLocked
        label={null}
        value={singlePlayerForce?.name ?? 'Not configured'}
        color={`${singlePlayerForce?.color}77`}
      />
    )
  }

  // Else, render the text JSX.
  return forceTextJsx
}

/**
 * Whether the force cell renders an interactive assignment dropdown
 * for the given member, as opposed to plain display text.
 * @param member The member whose force cell is being evaluated.
 * @param session The session that the member belongs to.
 * @returns Whether an assignment dropdown is rendered for the member.
 * @note Shared with the list so a text-only cell can remain
 * selectable.
 */
export function shouldShowForceDropdown(
  member: ClientSessionMember,
  session: SessionClient,
): boolean {
  const currentMember = session.member
  return (
    member.isAuthorized('forceAssignable') &&
    currentMember.isAuthorized('manageSessionMembers') &&
    session.state === 'unstarted' &&
    !member.isAuthorized('completeVisibility') &&
    currentMember.isAuthorized('completeVisibility') &&
    session.config.mode !== 'single-player' &&
    !member.banned
  )
}

/**
 * Props for `SessionMemberForceCell`.
 */
export type TSessionMemberForceCell_P = {
  /**
   * The member whose force to display.
   */
  member: ClientSessionMember
  /**
   * The session that the member belongs to.
   */
  session: SessionClient
}
