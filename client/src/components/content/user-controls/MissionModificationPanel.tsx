import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { useRequireSession } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import ButtonSvgPanel, { TValidPanelButton } from './ButtonSvgPanel'
import './MissionModificationPanel.scss'

export default function MissionModificationPanel({
  mission,
  onSuccessfulCopy,
  onSuccessfulDeletion,
}: TMissionModificationPanel) {
  /* -- GLOBAL CONTEXT -- */

  // Require session for panel.
  const [session] = useRequireSession()
  const globalContext = useGlobalContext()
  const {
    navigateTo,
    notify,
    confirm,
    beginLoading,
    finishLoading,
    handleError,
  } = globalContext.actions
  const [server] = globalContext.server

  /* -- COMPONENT VARIABLES -- */

  let currentButtons: TValidPanelButton[] = []

  // Grab the current user from the session.
  let { user: currentUser } = session

  /* -- COMPONENT FUNCTIONS -- */

  // This is called when a user requests
  // to edit the mission.
  const onEditRequest = () => {
    navigateTo('MissionPage', {
      missionID: mission.missionID,
    })
  }

  // This is called when a user requests
  // to delete the mission.
  const onDeleteRequest = () => {
    confirm(
      'Are you sure you want to delete this mission?',
      async (concludeAction: () => void) => {
        try {
          beginLoading('Deleting mission...')
          concludeAction()
          await ClientMission.$delete(mission.missionID)
          finishLoading()
          notify(`Successfully deleted "${mission.name}".`)
          onSuccessfulDeletion()
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
  const onCopyRequest = () => {
    confirm(
      'Enter the name of the new mission.',
      async (concludeAction: () => void, entry: string) => {
        try {
          beginLoading('Copying mission...')
          concludeAction()
          let resultingMission = await ClientMission.$copy(
            mission.missionID,
            entry,
          )
          finishLoading()
          notify(`Successfully copied "${mission.name}".`)
          onSuccessfulCopy(resultingMission)
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
   * Handles a request to launch a new game from a mission.
   */
  const onLaunchRequest = () => {
    navigateTo('LaunchPage', { missionID: mission.missionID })
  }

  // -- RENDER --

  let availableButtons: SingleTypeObject<TValidPanelButton> = {
    launch: {
      icon: 'launch',
      key: 'launch',
      onClick: onLaunchRequest,
      tooltipDescription: 'Launch game.',
    },
    edit: {
      icon: 'edit',
      key: 'edit',
      onClick: onEditRequest,
      tooltipDescription: 'Edit mission.',
    },
    remove: {
      icon: 'remove',
      key: 'remove',
      onClick: onDeleteRequest,
      tooltipDescription: 'Remove mission.',
    },
    copy: {
      icon: 'copy',
      key: 'copy',
      onClick: onCopyRequest,
      tooltipDescription: 'Copy mission.',
    },
    download: {
      icon: 'download',
      key: 'download',
      onClick: () => {
        window.open(
          `/api/v1/missions/export/${mission.name}.metis?missionID=${mission.missionID}`,
          '_blank',
        )
      },
      tooltipDescription:
        'Export this mission as a .metis file to your local system.',
    },
  }

  let containerClassName: string = 'Hidden'

  if (currentUser.isAuthorized(['READ', 'WRITE', 'DELETE'])) {
    containerClassName = 'MissionModificationPanel'
  }

  currentButtons.push(
    availableButtons.launch,
    availableButtons.remove,
    availableButtons.copy,
    availableButtons.download,
  )

  return (
    <div className={containerClassName}>
      <ButtonSvgPanel buttons={currentButtons} size={'small'} />
    </div>
  )
}

/* -- types -- */

/**
 * Props for `MissionModificationPanel` component.
 */
export type TMissionModificationPanel = {
  /**
   * The mission to modify.
   */
  mission: ClientMission
  /**
   * Callback for a successful copy event.
   * @param resultingMission The resulting mission from the copy event.
   */
  onSuccessfulCopy: (resultingMission: ClientMission) => void
  /**
   * Callback for a successful deletion event.
   */
  onSuccessfulDeletion: () => void
}
