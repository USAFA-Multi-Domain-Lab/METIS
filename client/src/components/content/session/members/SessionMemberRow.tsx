import { ReactNode, useEffect, useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMissionForce from 'src/missions/forces'
import SessionClient from 'src/sessions'
import ClientSessionMember from 'src/sessions/members'
import { compute } from 'src/toolbox'
import { usePostInitEffect } from 'src/toolbox/hooks'
import Prompt from '../../communication/Prompt'
import { DetailDropdown } from '../../form/DetailDropdown'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/buttons/ButtonSvgPanel'
import './SessionMemberRow.scss'

export default function SessionMemberRow({
  member,
  session,
}: TSessionMember_P): JSX.Element | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { handleError, prompt, beginLoading, finishLoading } =
    globalContext.actions
  const [assignedForce, setAssignedForce] = useState<ClientMissionForce | null>(
    member.force,
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
   * The member that is currently logged in
   * on this client.
   */
  const currentMember = session.member

  /**
   * Buttons for SVG panel.
   */
  const buttons = compute((): TValidPanelButton[] => {
    return [
      {
        type: 'kick',
        key: 'kick',
        onClick: () => onClickKick(),
        description:
          'Kick member from the session (Can still choose to rejoin).',
      },
      {
        type: 'ban',
        key: 'ban',
        onClick: () => onClickBan(),
        description: 'Ban member from the session (Cannot rejoin).',
      },
    ]
  })

  /**
   * Whether the target member can be assigned a force.
   */
  const targetIsAssignable: boolean = member.isAuthorized('forceAssignable')
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
   * Whether the dropdown to assign a force to the member should
   * be shown.
   */
  const showDropdown: boolean = compute<boolean>(
    () =>
      targetIsAssignable &&
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

  // Check if force is updated on a member
  // list update.
  useEffect(() => {
    // If the assigned force is not the same as the
    // force assigned to the member, update the assigned
    // force.
    if (assignedForceId !== member.forceId) setAssignedForce(member.force)
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
    } else if (!currentCompleteVisibility) {
      text = member.forceId ? 'Assigned' : 'Not assigned'
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
    if (showDropdown) {
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
    // Else, render the text JSX.
    else {
      innerJsx = forceTextJsx
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
