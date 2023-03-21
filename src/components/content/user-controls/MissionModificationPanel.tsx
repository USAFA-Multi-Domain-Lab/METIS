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
import { IUser } from '../../../modules/users'
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
  const [currentUser] = useStore<IUser | null>('currentUser')

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
        concludeAction()
        appActions.beginLoading('Copying mission...')

        copyMission(
          mission.missionID,
          entry,
          (resultingMission: Mission) => {
            appActions.finishLoading()
            appActions.notify(`Successfully copied ${mission.name}.`)
            handleSuccessfulCopy(resultingMission)
          },
          () => {
            appActions.finishLoading()
            appActions.notify(`Failed to copy ${mission.name}.`)
          },
        )
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
  const handleToggleLiveRequest = (live: boolean) => {
    let previousLiveState: boolean = mission.live

    mission.live = live

    setLive(
      mission.missionID,
      live,
      () => {
        if (live) {
          appActions.notify(`${mission.name} was successfully turned on.`)
          setLiveAjaxStatus(EAjaxStatus.Loaded)
          handleSuccessfulToggleLive()
        } else {
          appActions.notify(`${mission.name} was successfully turned off.`)
          setLiveAjaxStatus(EAjaxStatus.Loaded)
          handleSuccessfulToggleLive()
        }
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
          `/api/v1/missions/export/${mission.name}.cesar?missionID=${mission.missionID}`,
          '_blank',
        )
      },
      tooltipDescription:
        'Export this mission as a .cesar file to your local system.',
    }),
  }

  let containerClassName: string = 'MissionModificationPanel'

  if (currentUser === null) {
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
