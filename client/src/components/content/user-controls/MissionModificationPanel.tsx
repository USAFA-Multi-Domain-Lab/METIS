import ClientMission from 'src/missions'
import { EAjaxStatus } from '../../../../../shared/toolbox/ajax'
import Toggle, { EToggleLockState } from '../user-controls/Toggle'
import Tooltip from '../communication/Tooltip'
import './MissionModificationPanel.scss'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { useState } from 'react'
import { useGlobalContext } from 'src/context'

export default function MissionModificationPanel(props: {
  mission: ClientMission
  handleSuccessfulCopy: (resultingMission: ClientMission) => void
  handleSuccessfulDeletion: () => void
  handleSuccessfulToggleLive: () => void
}) {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const [session] = globalContext.session
  const { goToPage, notify, confirm, beginLoading, finishLoading } =
    globalContext.actions

  /* -- COMPONENT VARIABLES -- */

  let mission: ClientMission = props.mission
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
      async (concludeAction: () => void) => {
        try {
          beginLoading('Deleting mission...')
          concludeAction()
          await ClientMission.delete(mission.missionID)
          finishLoading()
          notify(`Successfully deleted "${mission.name}".`)
          handleSuccessfulDeletion()
        } catch (error) {
          finishLoading()
          notify(`Failed to delete "${mission.name}".`)
        }
      },
      {
        pendingMessageUponConfirm: 'Deleting mission...',
      },
    )
  }

  // This is called when a user requests
  // to copy the mission.
  const handleCopyRequest = () => {
    confirm(
      'Enter the name of the new mission.',
      async (concludeAction: () => void, entry: string) => {
        try {
          beginLoading('Copying mission...')
          concludeAction()
          let resultingMission = await ClientMission.copy(
            mission.missionID,
            entry,
          )
          finishLoading()
          notify(`Successfully copied "${mission.name}".`)
          handleSuccessfulCopy(resultingMission)
        } catch (error) {
          finishLoading()
          notify(`Failed to copy "${mission.name}".`)
        }
      },
      {
        requireEntry: true,
        entryLabel: 'Name',
        buttonConfirmText: 'Copy',
        pendingMessageUponConfirm: 'Copying mission...',
      },
    )
  }

  // This is called when a user requests
  // to toggle a mission between being live
  // and not being live.
  const handleToggleLiveRequest = async (live: boolean, revert: () => void) => {
    // Track previous live state in case of error.
    let previousLiveState: boolean = mission.live

    try {
      // Update state.
      mission.live = live
      setLiveAjaxStatus(EAjaxStatus.Loading)

      // Make the request to the server.
      await ClientMission.setLive(mission.missionID, live)

      // Notify the user of success.
      if (live) {
        notify(`"${mission.name}" is now live.`)
        setLiveAjaxStatus(EAjaxStatus.Loaded)
      } else {
        notify(`"${mission.name}" is now no longer live.`)
        setLiveAjaxStatus(EAjaxStatus.Loaded)
      }
    } catch (error) {
      // Notify user of error.
      if (live) {
        notify(`Failed to make \"${mission.name}\"  go live.`)
        setLiveAjaxStatus(EAjaxStatus.Error)
      } else {
        notify(`Failed to make \"${mission.name}\" no longer live.`)
        setLiveAjaxStatus(EAjaxStatus.Error)
      }
      // Revert mission.live to the previous state.
      mission.live = previousLiveState
      revert()
    }
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
