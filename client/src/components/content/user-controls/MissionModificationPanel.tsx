import Mission, { copyMission, deleteMission, setLive } from 'metis/missions'
import { EAjaxStatus } from 'metis/toolbox/ajax'
import Toggle, { EToggleLockState } from '../user-controls/Toggle'
import Tooltip from '../communication/Tooltip'
import './MissionModificationPanel.scss'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { TMetisSession } from 'metis/sessions'
import { useState } from 'react'
import { useGlobalContext } from 'metis/client/context'

export default function MissionModificationPanel(props: {
  mission: Mission
  handleSuccessfulCopy: (resultingMission: Mission) => void
  handleSuccessfulDeletion: () => void
  handleSuccessfulToggleLive: () => void
}) {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const [session] = globalContext.session
  const { goToPage, notify, confirm, beginLoading, finishLoading } =
    globalContext.actions

  /* -- COMPONENT VARIABLES -- */

  let mission: Mission = props.mission
  let currentActions: MiniButtonSVG[] = []
  let handleSuccessfulDeletion = props.handleSuccessfulDeletion
  let handleSuccessfulCopy = props.handleSuccessfulCopy
  let handleSuccessfulToggleLive = props.handleSuccessfulToggleLive

  /* -- COMPONENT STATE -- */

  const [liveAjaxStatus, setLiveAjaxStatus] = useState<EAjaxStatus>(
    EAjaxStatus.NotLoaded,
  )

  /* -- COMPONENT FUNCTIONS -- */

  // This is called when a user requests
  // to edit the mission.
  const handleEditRequest = () => {
    goToPage('MissionFormPage', {
      missionID: mission.missionID,
    })
  }

  // This is called when a user requests
  // to delete the mission.
  const handleDeleteRequest = () => {
    confirm(
      'Are you sure you want to delete this mission?',
      (concludeAction: () => void) => {
        concludeAction()
        beginLoading('Deleting mission...')

        deleteMission(
          mission.missionID,
          () => {
            finishLoading()
            notify(`Successfully deleted ${mission.name}.`)
            handleSuccessfulDeletion()
          },
          () => {
            finishLoading()
            notify(`Failed to delete ${mission.name}.`)
          },
        )
      },
      {
        pendingMessageUponConfirm: 'Deleting...',
      },
    )
  }

  // This is called when a user requests
  // to copy the mission.
  const handleCopyRequest = () => {
    confirm(
      'Enter the name of the new mission.',
      (concludeAction: () => void, entry: string) => {
        beginLoading('Copying mission...')

        copyMission(
          mission.missionID,
          entry,
          (resultingMission: Mission) => {
            // -----------------------------------------------
            // finishes loading inside this function.
            // This function can be found in GamePage.tsx
            handleSuccessfulCopy(resultingMission)
            // -----------------------------------------------
            notify(`Successfully copied ${mission.name}.`)
          },
          () => {
            finishLoading()
            notify(`Failed to copy ${mission.name}.`)
          },
        )
        concludeAction()
      },
      {
        requireEntry: true,
        entryLabel: 'Name',
        buttonConfirmText: 'Copy',
        pendingMessageUponConfirm: 'Copying...',
      },
    )
  }

  // This is called when a user requests
  // to toggle a mission between being live
  // and not being live.
  const handleToggleLiveRequest = (live: boolean, revert: () => void) => {
    let previousLiveState: boolean = mission.live

    mission.live = live

    setLive(
      mission.missionID,
      live,
      () => {
        notify(
          `${mission.name} was successfully turned ${live ? 'on' : 'off'}.`,
        )
        setLiveAjaxStatus(EAjaxStatus.Loaded)
        handleSuccessfulToggleLive()
      },
      () => {
        if (live) {
          notify(`${mission.name} failed to turn on.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        } else {
          notify(`${mission.name} failed to turn off.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        }
        mission.live = previousLiveState
        revert()
      },
    )
    setLiveAjaxStatus(EAjaxStatus.Loading)
  }

  // -- RENDER --

  let availableMiniActions = {
    edit: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Edit,
      handleClick: handleEditRequest,
      tooltipDescription: 'Edit mission.',
    }),
    remove: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Remove,
      handleClick: handleDeleteRequest,
      tooltipDescription: 'Remove mission.',
    }),
    copy: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Copy,
      handleClick: handleCopyRequest,
      tooltipDescription: 'Copy mission.',
    }),
    download: new MiniButtonSVG({
      ...MiniButtonSVG.defaultProps,
      purpose: EMiniButtonSVGPurpose.Download,
      handleClick: () => {
        window.open(
          `/api/v1/missions/export/${mission.name}.metis?missionID=${mission.missionID}`,
          '_blank',
        )
      },
      tooltipDescription:
        'Export this mission as a .metis file to your local system.',
    }),
  }

  let containerClassName: string = 'MissionModificationPanel'

  if (session?.user.role === 'student') {
    containerClassName += ' hidden'
  }

  // Logic that will lock the mission toggle while a request is being sent
  // to set the mission.live paramter
  let lockLiveToggle: EToggleLockState = EToggleLockState.Unlocked
  if (liveAjaxStatus === EAjaxStatus.Loading && mission.live) {
    lockLiveToggle = EToggleLockState.LockedActivation
  } else if (liveAjaxStatus === EAjaxStatus.Loading && !mission.live) {
    lockLiveToggle = EToggleLockState.LockedDeactivation
  } else {
    lockLiveToggle = EToggleLockState.Unlocked
  }

  currentActions.push(
    availableMiniActions.edit,
    availableMiniActions.remove,
    availableMiniActions.copy,
    availableMiniActions.download,
  )

  return (
    <div className={containerClassName}>
      <MiniButtonSVGPanel buttons={currentActions} linkBack={null} />
      <div className='ToggleContainer'>
        <Toggle
          initiallyActivated={mission.live}
          lockState={lockLiveToggle}
          deliverValue={handleToggleLiveRequest}
        />
        <Tooltip
          description={
            !mission.live
              ? 'Sets mission as live thus allowing students to access it.'
              : 'Disables mission thus preventing students from accessing it.'
          }
        />
      </div>
    </div>
  )
}
