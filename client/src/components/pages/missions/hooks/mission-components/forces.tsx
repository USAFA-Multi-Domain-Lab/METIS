import Prompt from 'metis/client/components/content/communication/Prompt'
import { useGlobalContext } from 'metis/client/context/global'
import ClientMissionForce from 'metis/client/missions/forces'
import { useMissionPageContext } from '../../context'

/**
 * Yields force-related callback functions which can be used for
 * the {@link ButtonSvg.onClick} callback for a button.
 */
export default function useForceItemButtonCallbacks(
  options: TForceButtonCallbackOptions = {},
): TForceItemButtonCallbacks {
  const { onSuccessfulDuplicate = () => {}, onSuccessfulDeletion = () => {} } =
    options
  const globalContext = useGlobalContext()
  const { notify, prompt } = globalContext.actions
  const missionPageContext = useMissionPageContext()
  const { onChange, state: missionPageState } = missionPageContext
  const [mission] = missionPageState.mission

  return {
    onDuplicateRequest: async (force: ClientMissionForce) => {
      // Prompt the user to enter the name of the new force.
      let { choice, text } = await prompt(
        'Enter the name of the new force:',
        ['Cancel', 'Submit'],
        {
          textField: { boundChoices: ['Submit'], label: 'Name' },
          defaultChoice: 'Submit',
        },
      )

      // If the user confirms the duplication, proceed.
      if (choice === 'Submit') {
        try {
          // Duplicate the force.
          let newForces = mission.duplicateForces({
            originalId: force._id,
            duplicateName: text,
          })
          // Notify the user that the force was duplicated.
          notify(`Successfully duplicated "${force.name}".`)
          // Allow the user to save the changes.
          onChange(...newForces)
          // Run the post-hook.
          onSuccessfulDuplicate(newForces[0])
        } catch (error: any) {
          notify(`Failed to duplicate "${force.name}".`)
        }
      }
    },
    onDeleteRequest: async (force: ClientMissionForce) => {
      // Prompt the user to confirm the deletion.
      let { choice } = await prompt(
        `Please confirm the deletion of this force.`,
        Prompt.ConfirmationChoices,
      )
      // If the user cancels, abort.
      if (choice === 'Cancel') return
      // Delete the force.
      let deletedForces = mission.deleteForces(force._id)

      // Notify the user that the force was deleted.
      notify(`Successfully deleted "${force.name}".`)
      // Allow the user to save the changes.
      onChange(force, ...deletedForces.filter((f) => f._id !== force._id))
      // Run the post-hook.
      onSuccessfulDeletion(force)
    },
  }
}

/**
 * Options for when using the {@link useForceItemButtonCallbacks}
 * hook.
 */
export type TForceButtonCallbackOptions = {
  /**
   * Optional post-hook for handling when an force
   * has been successfully duplicated.
   * @param resultingForce The force that was duplicated.
   */
  onSuccessfulDuplicate?: (resultingForce: ClientMissionForce) => void
  /**
   * Optional post-hook for handling when a force
   * has been successfully deleted.
   * @param deletedForce The force that was deleted.
   */
  onSuccessfulDeletion?: (deletedForce: ClientMissionForce) => void
}

/**
 * The yielded value from the {@link useForceItemButtonCallbacks}
 * hook, containing the callback functions.
 */
export type TForceItemButtonCallbacks = {
  /**
   * Callback for when the user requests to duplicate an force.
   * @param force The force to duplicate.
   */
  onDuplicateRequest: (force: ClientMissionForce) => Promise<void>
  /**
   * Callback for when the user requests to delete an force.
   * @param force The force to delete.
   */
  onDeleteRequest: (force: ClientMissionForce) => Promise<void>
}
