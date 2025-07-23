import { ReactNode, useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context/global'
import ClientMissionForce from 'src/missions/forces'
import SessionClient from 'src/sessions'
import ClientSessionMember from 'src/sessions/members'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import MemberRole, {
  TMemberRoleId,
} from '../../../../../../shared/sessions/members/roles'
import Prompt from '../../communication/Prompt'
import { DetailDropdown } from '../../form/dropdown/'
import ButtonSvgPanel from '../../user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '../../user-controls/buttons/panels/hooks'
import './SessionMemberRow.scss'

export default function SessionMemberRow({
  member,
  session,
  session: { member: currentMember },
}: TSessionMember_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { handleError, prompt, beginLoading, finishLoading } =
    globalContext.actions
  const [assignedForce, setAssignedForce] = useState<ClientMissionForce | null>(
    member.force,
  )
  const [forceLock, setForceLock] = useState<boolean>(false)
  const [assignedRole, setAssignedRole] = useState<MemberRole>(member.role)
  const [roleLock, setRoleLock] = useState<boolean>(false)
  const controlsCellButtonEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'kick',
        type: 'button',
        icon: 'kick',
        description:
          'Kick member from the session (Can still choose to rejoin).',
        onClick: () => onClickKick(),
      },
      {
        key: 'ban',
        type: 'button',
        icon: 'ban',
        description: 'Ban member from the session (Cannot rejoin).',
        onClick: () => onClickBan(),
      },
    ],
  })

  /* -- COMPUTED -- */

  /**
   * The ID of the assigned force.
   */
  const assignedForceId = compute<string | null>(
    () => assignedForce?._id ?? null,
  )

  /**
   * The ID of the assigned role.
   */
  const assignedRoleId: TMemberRoleId = assignedRole._id

  /**
   * Whether the target member can be assigned a force.
   */
  const targetIsForceAssignable: boolean =
    member.isAuthorized('forceAssignable')
  /**
   * Whether the target member can be assigned a new role.
   */
  const targetIsRoleAssignable: boolean = member.isAuthorized('roleAssignable')
  /**
   * Whether the current member can manage session members.
   */
  const currentManagesMembers: boolean = currentMember.isAuthorized(
    'manageSessionMembers',
  )
  /**
   * Whether the session has not yet started.
   */
  const sessionUnstarted: boolean = session.state === 'unstarted'
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
  const showForceDropdown: boolean = compute<boolean>(
    () =>
      targetIsForceAssignable &&
      currentManagesMembers &&
      sessionUnstarted &&
      !targetCompleteVisibility &&
      currentCompleteVisibility,
  )
  /**
   * Whether the dropdown to assign a role to the member should
   * be shown.
   */
  const showRoleDropdown: boolean = compute<boolean>(
    () =>
      targetIsRoleAssignable &&
      currentManagesMembers &&
      sessionUnstarted &&
      !targetCompleteVisibility &&
      currentCompleteVisibility,
  )

  /* -- FUNCTIONS -- */

  /**
   * Callback for button click to kick a member.
   */
  const onClickKick = async (): Promise<void> => {
    // Confirm the user wants to perform the operation.
    let { choice } = await prompt(
      `Are you sure you want to kick "${member.username}"?`,
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, return.
    if (choice === 'Cancel') {
      return
    }

    try {
      // Begin loading.
      beginLoading(`Kicking "${member.username}"...`)
      // Kick the member.
      await session.$kick(member._id)
    } catch (error) {
      handleError({
        message: `Failed to kick "${member.username}".`,
        notifyMethod: 'bubble',
      })
    }

    // Finish loading.
    finishLoading()
  }

  /**
   * Callback for button click to ban a member.
   */
  const onClickBan = async (): Promise<void> => {
    // Confirm the user wants to perform the operation.
    let { choice } = await prompt(
      `Are you sure you want to ban "${member.username}"?`,
      Prompt.ConfirmationChoices,
    )

    // If the user cancels, return.
    if (choice === 'Cancel') {
      return
    }

    try {
      // Begin loading.
      beginLoading(`Banning "${member.username}"...`)
      // Ban the member.
      await session.$ban(member._id)
    } catch (error) {
      handleError({
        message: `Failed to ban "${member.username}".`,
        notifyMethod: 'bubble',
      })
    }

    // Finish loading.
    finishLoading()
  }

  /* -- HOOKS -- */

  usePostInitEffect(() => {
    // If the current member can't manage session members,
    // return.
    if (!currentMember.isAuthorized('manageSessionMembers')) return

    // Gather details.
    let prevForce = member.force
    let prevForceId = member.forceId

    // Request to assign the force if the state changes.
    if (assignedForceId !== prevForceId) {
      // Lock changes to the dropdown.
      setForceLock(true)
      // Assign the force.
      session
        .$assignForce(member._id, assignedForceId)
        .catch(() => {
          setAssignedForce(prevForce)
          handleError({
            message: 'Failed to assign force.',
            notifyMethod: 'bubble',
          })
        })
        .finally(() => setForceLock(false))
    }
  }, [assignedForce])

  usePostInitEffect(() => {
    // If the current member can't manage session members,
    // return.
    if (!currentMember.isAuthorized('manageSessionMembers')) return

    // Gather details.
    let prevRole = member.role
    let prevRoleId = member.roleId

    // Request to assign the role if the state changes.
    if (assignedRoleId !== prevRoleId) {
      // Lock changes to the dropdown.
      setRoleLock(true)
      // Assign the role.
      session
        .$assignRole(member._id, assignedRoleId)
        .catch(() => {
          setAssignedRole(prevRole)
          handleError({
            message: 'Failed to assign role.',
            notifyMethod: 'bubble',
          })
        })
        .finally(() => setRoleLock(false))
    }
  }, [assignedRole])

  // Check if the force, or role, is updated on a member
  // list update.
  useEffect(() => {
    // If the assigned force is not the same as the
    // force assigned to the member, update the assigned
    // force.
    if (assignedForceId !== member.forceId) setAssignedForce(member.force)
    // If the assigned role is not the same as the
    // role assigned to the member, update the assigned
    // role.
    if (assignedRoleId !== member.roleId) {
      setAssignedRole(member.role)
    }
  }, [member])

  /* -- RENDER -- */

  /**
   * The JSX for the text to display when the
   * dropdown is not shown.
   */
  const forceTextJsx = compute<JSX.Element>(() => {
    let style: React.CSSProperties = { color: 'gray', fontStyle: 'italic' }
    let text: string = ''

    if (targetCompleteVisibility) {
      text = targetManipulatesNodes ? 'Complete control' : 'Complete visibility'
    } else if (!currentCompleteVisibility && !currentLimitedVisibility) {
      text = member.forceId ? 'Assigned' : 'Not assigned'
    } else if (!currentCompleteVisibility && currentLimitedVisibility) {
      text = member.forceId ? 'Assigned (view only)' : 'Not assigned'
    } else if (assignedForce) {
      delete style.fontStyle
      style.color = assignedForce.color
      text = assignedForce.name
    } else {
      text = 'Not assigned'
    }

    return <span style={style}>{text}</span>
  })

  /**
   * JSX for the force cell.
   */
  const forceCell = compute<JSX.Element>(() => {
    let innerJsx: ReactNode = null

    // If the current member can manage session members
    // and the target member can be assigned a force, render
    // the dropdown.
    if (showForceDropdown) {
      innerJsx = (
        <DetailDropdown<ClientMissionForce>
          label='Force'
          options={session.mission.forces}
          value={assignedForce}
          setValue={setAssignedForce}
          isExpanded={false}
          getKey={(value) => value?._id}
          render={(value) => {
            return <span style={{ color: value?.color }}>{value?.name}</span>
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
    // Else, render the text JSX.
    else {
      innerJsx = forceTextJsx
    }

    // Render the cell.
    return <div className='Cell CellForce'>{innerJsx}</div>
  })

  /**
   * JSX for the role cell.
   */
  const roleCell = compute<JSX.Element>(() => {
    let innerJsx: ReactNode = null

    // If the current member can manage session members
    // and the target member can be assigned a role, render
    // the dropdown.
    if (showRoleDropdown) {
      innerJsx = (
        <DetailDropdown<ClientSessionMember['role']>
          label='Role'
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
    else {
      innerJsx = <span>{member.role.name}</span>
    }

    // Render the cell.
    return <div className='Cell CellRole'>{innerJsx}</div>
  })

  /**
   * JSX for the controls cell.
   */
  const controlsCell = compute<JSX.Element>(() => {
    let buttonPanel: ReactNode = null

    // If the current member can manage session members,
    // and the target member can't, render the SVG panel.
    if (
      currentMember?.isAuthorized('manageSessionMembers') &&
      !member.isAuthorized('manageSessionMembers')
    ) {
      buttonPanel = <ButtonSvgPanel engine={controlsCellButtonEngine} />
    }
    // Else, render 'N/A'.
    else {
      buttonPanel = (
        <span
          style={{ color: 'gray', fontStyle: 'italic', paddingLeft: '0.75em' }}
        >
          N/A
        </span>
      )
    }

    // Render result.
    return <div className='Cell CellControls'>{buttonPanel}</div>
  })

  // Render main component.
  return (
    <div key={member.username} className='SessionMemberRow'>
      <div className='Cell CellName'>{member.username}</div>
      {roleCell}
      {forceCell}
      {controlsCell}
    </div>
  )
}

/* -- TYPES -- */

export type TSessionMember_P = {
  /**
   * The member to render.
   */
  member: ClientSessionMember
  /**
   * The session that the member belongs to.
   */
  session: SessionClient
}
