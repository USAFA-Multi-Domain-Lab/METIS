import {
  copyMission,
  deleteMission,
  Mission,
  setLive,
} from '../../../modules/missions'
import { EAjaxStatus } from '../../../modules/toolbox/ajax'
import Toggle, { EToggleLockState } from '../user-controls/Toggle'
import Tooltip from '../communication/Tooltip'
import './MissionModificationPanel.scss'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { useStore } from 'react-context-hook'
import { User, restrictedAccessRoles } from '../../../modules/users'
import { useState } from 'react'
import { AppActions } from '../../AppState'

export default function MissionModificationPanel(props: {
  mission: Mission
  appActions: AppActions
  handleSuccessfulCopy: (resultingMission: Mission) => void
  handleSuccessfulDeletion: () => void
  handleSuccessfulToggleLive: () => void
}) {
  /* -- GLOBAL STATE -- */
  const [currentUser] = useStore<User | null>('currentUser')

  /* -- COMPONENT VARIABLES -- */
  let mission: Mission = props.mission
  let appActions: AppActions = props.appActions
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
    appActions.goToPage('MissionFormPage', {
      missionID: mission.missionID,
    })
  }

  // This is called when a user requests
  // to delete the mission.
  const handleDeleteRequest = () => {
    appActions.confirm(
      'Are you sure you want to delete this mission?',
      (concludeAction: () => void) => {
        concludeAction()
        appActions.beginLoading('Deleting mission...')

        deleteMission(
          mission.missionID,
          () => {
            appActions.finishLoading()
            appActions.notify(`Successfully deleted ${mission.name}.`)
            handleSuccessfulDeletion()
          },
          () => {
            appActions.finishLoading()
            appActions.notify(`Failed to delete ${mission.name}.`)
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
    appActions.confirm(
      'Enter the name of the new mission.',
      (concludeAction: () => void, entry: string) => {
        appActions.beginLoading('Copying mission...')

        copyMission(
          mission.missionID,
          entry,
          (resultingMission: Mission) => {
            // -----------------------------------------------
            // finishes loading inside this function.
            // This function can be found in GamePage.tsx
            handleSuccessfulCopy(resultingMission)
            // -----------------------------------------------
            appActions.notify(`Successfully copied ${mission.name}.`)
          },
          () => {
            appActions.finishLoading()
            appActions.notify(`Failed to copy ${mission.name}.`)
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
        appActions.notify(
          `${mission.name} was successfully turned ${live ? 'on' : 'off'}.`,
        )
        setLiveAjaxStatus(EAjaxStatus.Loaded)
        handleSuccessfulToggleLive()
      },
      () => {
        if (live) {
          appActions.notify(`${mission.name} failed to turn on.`)
          setLiveAjaxStatus(EAjaxStatus.Error)
        } else {
          appActions.notify(`${mission.name} failed to turn off.`)
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

  let containerClassName: string = 'MissionModificationPanel hidden'

  if (
    currentUser &&
    currentUser.role &&
    restrictedAccessRoles.includes(currentUser.role)
  ) {
    containerClassName = 'MissionModificationPanel'
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
