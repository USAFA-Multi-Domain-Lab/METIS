import { ReactNode, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionForce from 'src/missions/forces'
import SessionClient from 'src/sessions'
import ClientSessionMember from 'src/sessions/members'
import { compute } from 'src/toolbox'
import {
  useEventListener,
  usePostInitEffect,
  useRequireLogin,
} from 'src/toolbox/hooks'
import { DetailDropdown } from '../../form/DetailDropdown'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/ButtonSvgPanel'
import './SessionMemberRow.scss'

// todo: Force management code is very messy.
// todo: This should be cleaned up in the future.
export default function SessionMemberRow({
  member,
  session,
}: TSessionMember_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { handleError } = globalContext.actions
  const [assignedForce, setAssignedForce] = useState<ClientMissionForce | null>(
    session.mission.getForce(member.forceId ?? undefined) ?? null,
  )
  const [forceLock, setForceLock] = useState<boolean>(false)
  const [login] = useRequireLogin()

  /* -- COMPUTED -- */

  /**
   * The ID of the assigned force.
   */
  const assignedForceId = compute<string | null>(
    () => assignedForce?._id ?? null,
  )

  /**
   * The member that is currently logged in
   * on this client.
   */
  const currentMember = compute(() => session.getMemberByUserId(login.user._id))

  /**
   * Buttons for SVG panel.
   */
  const buttons = compute((): TValidPanelButton[] => {
    // If the current member can manage session members
    // and given participant cannot, return kick and ban
    // buttons.
    // todo: Uncomment and fix this.
    // if (
    //   currentMember?.isAuthorized('manageSessionMembers') &&
    //   !participant.isAuthorized('manageSessionMembers')
    // ) {
    return [
      {
        icon: 'kick',
        key: 'kick',
        // todo: Uncomment and fix this.
        //   onClick: () => onClickKick(participant.username),
        onClick: () => console.log('kick'),
        tooltipDescription:
          'Kick member from the session (Can still choose to rejoin).',
      },
      {
        icon: 'ban',
        key: 'ban',
        // todo: Uncomment and fix this.
        //   onClick: () => onClickBan(participant.username),
        onClick: () => console.log('ban'),
        tooltipDescription: 'Ban member from the session (Cannot rejoin).',
      },
    ]
    // } else {
    //   return []
    // }
  })

  /* -- effects -- */

  usePostInitEffect(() => {
    // If the current member can't manage session members,
    // return.
    if (!currentMember?.isAuthorized('manageSessionMembers')) return

    // Gather details.
    let prevForce =
      session.mission.getForce(member.forceId ?? undefined) ?? null
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

  useEventListener(server, 'force-assigned', () => {
    // If the force changed, update the state.
    if (assignedForceId !== member.forceId) {
      setAssignedForce(
        session.mission.getForce(member.forceId ?? undefined) ?? null,
      )
    }
  })

  /* -- render -- */

  /**
   * JSX for the force cell.
   */
  const forceCell = compute<JSX.Element>(() => {
    let innerJsx: ReactNode = null
    let sessionUnstarted: boolean = session.state === 'unstarted'
    let isAssignable: boolean = member.isAuthorized('forceAssignable')
    let managesMembers: boolean =
      currentMember?.isAuthorized('manageSessionMembers') ?? false
    let completeVisibility: boolean = member.isAuthorized('completeVisibility')
    let manipulatesNodes: boolean = member.isAuthorized('manipulateNodes')

    // todo: Account for if the session is started.
    // If the current member can manage session members
    // and the target member can be assigned a force, render
    // the dropdown.
    if (managesMembers && isAssignable) {
      innerJsx = (
        <DetailDropdown<ClientMissionForce | null>
          label='Force'
          options={session.mission.forces}
          stateValue={assignedForce}
          setState={setAssignedForce}
          isExpanded={false}
          getKey={(value) => value._id}
          render={(value) => {
            return <span style={{ color: value.color }}>{value.name}</span>
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
    // If the current member can't manage session members,
    // but the target member can be assigned a force, and a
    // force is assigned and available, render the force name.
    else if (!managesMembers && isAssignable && assignedForce) {
      innerJsx = (
        <span style={{ color: assignedForce.color }}>{assignedForce.name}</span>
      )
    }
    // If the current member can't manage session members,
    // the target member can be assigned a force, and the force
    // is assigned, render 'Assigned'.
    else if (!managesMembers && isAssignable && member.forceId) {
      innerJsx = (
        <span style={{ color: 'gray', fontStyle: 'italic' }}>Assigned</span>
      )
    }
    // If the current member can't manage session members,
    // the target member can be assigned a force, and the force
    // is not assigned, render 'Not assigned'.
    else if (!managesMembers && isAssignable && !assignedForceId) {
      innerJsx = (
        <span style={{ color: 'gray', fontStyle: 'italic' }}>Not assigned</span>
      )
    }
    // Else, if the target member has complete visibility,
    // and node manipulation permissions, render 'Complete control'.
    else if (completeVisibility && manipulatesNodes) {
      innerJsx = (
        <span style={{ color: 'gray', fontStyle: 'italic' }}>
          Complete control
        </span>
      )
    }
    // Else, if the target member has complete visibility
    // and no node manipulation permissions, render
    // 'Complete visibility'.
    else if (completeVisibility && !manipulatesNodes) {
      innerJsx = (
        <span style={{ color: 'gray', fontStyle: 'italic' }}>
          Complete visibility
        </span>
      )
    }
    // Else, render 'N/A'.
    else {
      innerJsx = <span style={{ color: 'gray', fontStyle: 'italic' }}>N/A</span>
    }

    // Render the cell.
    return <div className='Cell CellForce'>{innerJsx}</div>
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
      buttonPanel = <ButtonSvgPanel buttons={buttons} size={'small'} />
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
      <div className='Cell CellRole'>{member.role.name}</div>
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
