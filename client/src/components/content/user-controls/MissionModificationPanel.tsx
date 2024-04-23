import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { useRequireSession } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import Prompt from '../communication/Prompt'
import ButtonSvgPanel, { TValidPanelButton } from './ButtonSvgPanel'
import './MissionModificationPanel.scss'

/**
 * Renders a panel of svg buttons used for modifying a mission.
 */
export default function MissionModificationPanel({
  mission,
  onSuccessfulCopy,
  onSuccessfulDeletion,
}: TMissionModificationPanel) {
  /* -- GLOBAL CONTEXT -- */

  // Require session for panel.
  const [session] = useRequireSession()
  const globalContext = useGlobalContext()
  const { navigateTo, notify, prompt, beginLoading, finishLoading } =
    globalContext.actions

  /* -- SESSION-SPECIFIC LOGIC -- */

  // Grab the current user from the session.
  let { user: currentUser } = session

  /* -- FUNCTIONS -- */

  /**
   * Handles a request to edit a mission.
   */
  const onEditRequest = () => {
    navigateTo('MissionPage', {
      missionId: mission._id,
    })
  }
  /**
   * Handles a request to delete a mission.
   */
  const onDeleteRequest = async () => {
    // Prompt the user for confirmation.
    let { choice } = await prompt(
      'Please confirm the deletion of this mission.',
      Prompt.ConfirmationChoices,
    )

    // If the user confirms the deletion, proceed.
    if (choice === 'Confirm') {
      try {
        beginLoading('Deleting mission...')
        await ClientMission.$delete(mission._id)
        finishLoading()
        notify(`Successfully deleted "${mission.name}".`)
        onSuccessfulDeletion()
      } catch (error) {
        finishLoading()
        notify(`Failed to delete "${mission.name}".`)
      }
    }
  }
  /**
   * Handles a request to copy a mission.
   */
  const onCopyRequest = async () => {
    let { choice, text } = await prompt(
      'Enter the name of the new mission:',
      ['Cancel', 'Submit'],
      { textField: { boundChoices: ['Submit'], label: 'Name' } },
    )

    // If the user confirms the copy, proceed.
    if (choice === 'Submit') {
      try {
        beginLoading('Copying mission...')
        let resultingMission = await ClientMission.$copy(mission._id, text)
        finishLoading()
        notify(`Successfully copied "${mission.name}".`)
        onSuccessfulCopy(resultingMission)
      } catch (error) {
        finishLoading()
        notify(`Failed to copy "${mission.name}".`)
      }
    }
  }
  /**
   * Handles a request to launch a new game from a mission.
   */
  const onLaunchRequest = () => {
    navigateTo('LaunchPage', { missionId: mission._id })
  }

  /* -- COMPUTED -- */
  /**
   * A list of available buttons for the mission modification panel.
   */
  const availableButtons: SingleTypeObject<TValidPanelButton> = compute(() => {
    return {
      launch: {
        icon: 'launch',
        key: 'launch',
        onClick: onLaunchRequest,
        tooltipDescription: 'Launch game.',
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
            `/api/v1/missions/export/${mission.name}.metis?_id=${mission._id}`,
            '_blank',
          )
        },
        tooltipDescription:
          'Export this mission as a .metis file to your local system.',
      },
    }
  })
  /**
   * The current buttons being displayed.
   */
  const currentButtons: TValidPanelButton[] = compute(() => {
    // Initialize the buttons.
    let buttons: TValidPanelButton[] = []

    // If the user has the proper authorization, add
    // the launch button.
    if (currentUser.isAuthorized('games_write')) {
      buttons.push(availableButtons.launch)
    }

    // If the user has the proper authorization, add
    // the edit, remove, copy, and download buttons.
    if (currentUser.isAuthorized('missions_write')) {
      buttons.push(
        availableButtons.remove,
        availableButtons.copy,
        availableButtons.download,
      )
    }

    // Return the buttons.
    return buttons
  })

  /* -- RENDER -- */

  // If the user is authorized to modify missions or games,
  // then display the mission modification panel.
  if (
    currentUser.isAuthorized('missions_write') ||
    currentUser.isAuthorized('games_write')
  ) {
    return (
      <div className='MissionModificationPanel'>
        <ButtonSvgPanel buttons={currentButtons} size={'small'} />
      </div>
    )
  } else {
    return null
  }
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
