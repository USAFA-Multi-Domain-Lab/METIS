import Prompt from '@client/components/content/communication/Prompt'
import ButtonSvg from '@client/components/content/user-controls/buttons/panels/elements/ButtonSvg'
import { useGlobalContext } from '@client/context/global'
import { ClientMission } from '@client/missions/ClientMission'
import { SessionClient } from '@client/sessions/SessionClient'
import { useRequireLogin } from '@client/toolbox/hooks'

/**
 * Yields mission-related callback functions which can be used for
 * the {@link ButtonSvg.onClick} callback for a button.
 */
export function useMissionItemButtonCallbacks(
  options: TMissionButtonCallbackOptions = {},
): TMissionItemButtonCallbacks {
  const { onSuccessfulCopy = () => {}, onSuccessfulDeletion = () => {} } =
    options
  const globalContext = useGlobalContext()
  const { login } = useRequireLogin()
  const [server] = globalContext.server
  const {
    notify,
    beginLoading,
    finishLoading,
    navigateTo,
    prompt,
    handleError,
  } = globalContext.actions

  // Track if a play-test launch is in progress
  let isLaunchingPlayTest = false

  return {
    onOpenRequest: (mission): void => {
      if (
        login.user.isAuthorized('missions_write') ||
        login.user.isAuthorized('missions_read')
      ) {
        navigateTo('MissionPage', { missionId: mission._id })
      }
    },
    onPlayTestRequest: async (mission, cancelPage) => {
      // Prevent multiple simultaneous play-test launches
      if (isLaunchingPlayTest) {
        console.warn(
          'Play-test launch already in progress, ignoring duplicate request.',
        )
        return
      }

      try {
        // If the server connection is not available, abort.
        if (!server) {
          throw new Error('Server connection is not available.')
        }

        // Set launching flag
        isLaunchingPlayTest = true

        // Launch the session with testing accessibility
        beginLoading('Launching play-test session...')
        const sessionId = await SessionClient.$launch(mission._id, {
          accessibility: 'testing',
        })

        // Join the session
        const session = await server.$joinSession(sessionId)
        if (!session) throw new Error('Failed to join test session.')

        // Navigate to session config page to let user configure before starting
        navigateTo('SessionConfigPage', { session, cancelPage: cancelPage })
        finishLoading()
      } catch (error) {
        console.error('Failed to launch play-test session.')
        console.error(error)
        handleError({
          message: 'Failed to launch play-test session.',
          notifyMethod: 'bubble',
        })
      } finally {
        isLaunchingPlayTest = false
      }
    },
    onLaunchRequest: (mission, returnPage) => {
      navigateTo('LaunchPage', {
        missionId: mission._id,
        returnPage,
      })
    },
    onExportRequest: (mission: ClientMission) => {
      window.open(
        `/api/v1/missions/${mission._id}/export/${mission.fileName}`,
        '_blank',
      )
    },
    onCopyRequest: async (mission: ClientMission) => {
      let { choice, text } = await prompt(
        'Enter the name of the new mission',
        ['Cancel', 'Submit'],
        {
          textField: { boundChoices: ['Submit'], label: 'Name' },
          defaultChoice: 'Submit',
        },
      )

      // If the user confirms the copy, proceed.
      if (choice === 'Submit') {
        try {
          beginLoading('Copying mission...')
          let resultingMission = await ClientMission.$copy(mission._id, text)
          notify(`Successfully copied "${mission.name}".`)
          finishLoading()
          onSuccessfulCopy(resultingMission)
        } catch (error) {
          finishLoading()
          notify(`Failed to copy "${mission.name}".`)
        }
      }
    },
    onDeleteRequest: async (mission: ClientMission) => {
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
          onSuccessfulDeletion(mission)
        } catch (error) {
          finishLoading()
          notify(`Failed to delete "${mission.name}".`)
        }
      }
    },
  }
}

/**
 * Options for when using the {@link useMissionItemButtonCallbacks}
 * hook.
 */
export type TMissionButtonCallbackOptions = {
  /**
   * Optional post-hook for handling when a mission
   * has been successfully copied.
   * @param resultingMission The mission that was copied.
   */
  onSuccessfulCopy?: (resultingMission: ClientMission) => void
  /**
   * Optional post-hook for handling when a mission
   * has been successfully deleted.
   * @param deletedMission The mission that was deleted.
   */
  onSuccessfulDeletion?: (deletedMission: ClientMission) => void
}

/**
 * The yielded value from the {@link useMissionItemButtonCallbacks}
 * hook, containing the callback functions.
 */
export type TMissionItemButtonCallbacks = {
  /**
   * Callback for when the user requests to open a mission.
   * @param mission The mission to open.
   */
  onOpenRequest: (mission: ClientMission) => void
  /**
   * Callback for when the user requests to play-test a mission.
   * @param mission The mission to play-test.
   * @param cancelPage The page to return to once the user quits
   * from their play-test session.
   */
  onPlayTestRequest: (
    mission: ClientMission,
    cancelPage: 'HomePage' | 'MissionPage',
  ) => Promise<void>
  /**
   * Callback for when the user requests to launch a mission.
   * @param mission The mission to launch.
   * @param returnPage The page to return to if launching is
   * canceled.
   */
  onLaunchRequest: (
    mission: ClientMission,
    returnPage: 'HomePage' | 'MissionPage',
  ) => void
  /**
   * Callback for when the user requests to export a mission.
   * @param mission The mission to export.
   */
  onExportRequest: (mission: ClientMission) => void
  /**
   * Callback for when the user requests to copy a mission.
   * @param mission The mission to copy.
   */
  onCopyRequest: (mission: ClientMission) => Promise<void>
  /**
   * Callback for when the user requests to delete a mission.
   * @param mission The mission to delete.
   */
  onDeleteRequest: (mission: ClientMission) => Promise<void>
}
