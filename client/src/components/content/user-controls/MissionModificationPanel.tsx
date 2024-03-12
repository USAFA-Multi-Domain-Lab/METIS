import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import ClientUser from 'src/users'
import { TMetisSession } from '../../../../../shared/sessions'
import { TAjaxStatus } from '../../../../../shared/toolbox/ajax'
import Tooltip from '../communication/Tooltip'
import Toggle, { TToggleLockState } from '../user-controls/Toggle'
import { EMiniButtonSVGPurpose, MiniButtonSVG } from './MiniButtonSVG'
import { MiniButtonSVGPanel } from './MiniButtonSVGPanel'
import './MissionModificationPanel.scss'

export default function MissionModificationPanel(props: {
  mission: ClientMission
  session: NonNullable<TMetisSession<ClientUser>>
  handleSuccessfulCopy: (resultingMission: ClientMission) => void
  handleSuccessfulDeletion: () => void
}) {
  /* -- GLOBAL CONTEXT -- */

  const globalContext = useGlobalContext()

  const { navigateTo, notify, confirm, beginLoading, finishLoading } =
    globalContext.actions

  /* -- COMPONENT VARIABLES -- */

  let mission: ClientMission = props.mission
  let session: NonNullable<TMetisSession<ClientUser>> = props.session
  let currentActions: MiniButtonSVG[] = []
  let handleSuccessfulDeletion = props.handleSuccessfulDeletion
  let handleSuccessfulCopy = props.handleSuccessfulCopy

  // Grab the current user from the session.
  let { user: currentUser } = session

  /* -- COMPONENT STATE -- */

  const [liveAjaxStatus, setLiveAjaxStatus] = useState<TAjaxStatus>('NotLoaded')

  /* -- COMPONENT FUNCTIONS -- */

  // This is called when a user requests
  // to edit the mission.
  const handleEditRequest = () => {
    navigateTo('MissionFormPage', {
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

  /**
   * This is called when a user requests to toggle a mission between being live
   * and not being live.
   */
  const handleToggleLiveRequest = async (live: boolean) => {
    // Update state.
    mission.live = live
    setLiveAjaxStatus('Loading')

    try {
      // Make the request to the server.
      await ClientMission.setLive(mission.missionID, live)

      // Notify the user of success.
      if (live) {
        notify(`"${mission.name}" is now live.`)
        setLiveAjaxStatus('Loaded')
      } else {
        notify(`"${mission.name}" is no longer live.`)
        setLiveAjaxStatus('Loaded')
      }
    } catch (error) {
      // Notify user of error.
      if (live) {
        notify(`Failed to make \"${mission.name}\" go live.`)
        setLiveAjaxStatus('Error')
      } else {
        notify(`Failed to make \"${mission.name}\" no longer live.`)
        setLiveAjaxStatus('Error')
      }
      // Revert mission.live to the previous state.
      mission.live = !mission.live
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

  let containerClassName: string = 'Hidden'

  if (currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
    containerClassName = 'MissionModificationPanel'
  }

  // Logic that will lock the mission toggle while a request is being sent
  // to set the mission.live paramter
  let lockLiveToggle: TToggleLockState = 'unlocked'
  if (liveAjaxStatus === 'Loading' && mission.live) {
    lockLiveToggle = 'locked-activation'
  } else if (liveAjaxStatus === 'Loading' && !mission.live) {
    lockLiveToggle = 'locked-deactivation'
  } else {
    lockLiveToggle = 'unlocked'
  }

  currentActions.push(
    availableMiniActions.edit,
    availableMiniActions.remove,
    availableMiniActions.copy,
    availableMiniActions.download,
  )

  return (
    <div className={containerClassName}>
      <MiniButtonSVGPanel buttons={currentActions} />
      <div className='ToggleContainer'>
        <Toggle
          currentValue={mission.live}
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
