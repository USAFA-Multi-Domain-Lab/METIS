import Prompt from '@client/components/content/communication/Prompt'
import { useGlobalContext } from '@client/context/global'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { ClientMissionNode } from '@client/missions/nodes/ClientMissionNode'
import { useMissionPageContext } from '../../context'

/**
 * Yields action-related callback functions which can be used for
 * the {@link ButtonSvg.onClick} callback for a button.
 */
export default function useActionItemButtonCallbacks(
  node: ClientMissionNode,
  options: TActionButtonCallbackOptions = {},
): TActionItemButtonCallbacks {
  const { onSuccessfulDuplicate = () => {}, onSuccessfulDeletion = () => {} } =
    options
  const globalContext = useGlobalContext()
  const { notify, prompt } = globalContext.actions
  const missionPageContext = useMissionPageContext()
  const { onChange } = missionPageContext

  return {
    onDuplicateRequest: async (
      action: ClientMissionAction,
      selectNewAction: boolean = false,
    ) => {
      // Prompt the user to enter the name of the new action.
      let { choice, text } = await prompt(
        'Enter the name of the new action:',
        ['Cancel', 'Submit'],
        {
          textField: { boundChoices: ['Submit'], label: 'Name' },
          defaultChoice: 'Submit',
        },
      )

      // If the user confirms the duplication, proceed.
      if (choice === 'Submit') {
        try {
          const { node } = action
          // Duplicate the action.
          let newAction = action.duplicate({
            name: text,
            localKey: node.generateActionKey(),
          })
          // Add the new action to the node.
          node.actions.set(newAction._id, newAction)
          // Select the new action if necessary.
          if (selectNewAction) node.mission.select(newAction)
          // Notify the user that the force was duplicated.
          notify(`Successfully duplicated "${newAction.name}".`)
          // Allow the user to save the changes.
          onChange(newAction)
          // Run the post-hook.
          onSuccessfulDuplicate(newAction)
        } catch (error: any) {
          notify(`Failed to duplicate "${action.name}".`)
        }
      }
    },
    onDeleteRequest: async (
      action: ClientMissionAction,
      navigateBack: boolean = false,
    ) => {
      // Extract the node from the action.
      let { actions } = action.node

      // Delete the action if the node has more than 2 actions.
      if (actions.size > 1) {
        // Prompt the user to confirm the deletion.
        let { choice } = await prompt(
          `Please confirm the deletion of this action.`,
          Prompt.ConfirmationChoices,
        )
        // If the user cancels, abort.
        if (choice === 'Cancel') return

        // Go back to the previous selection.
        if (navigateBack) node.mission.selectBack()

        // Remove the action from the node.
        actions.delete(action._id)

        // Notify the user that the action was deleted.
        notify(`Successfully deleted "${action.name}".`)
        // Allow the user to save the changes.
        onChange(action, action.node)
        // Run the post-hook.
        onSuccessfulDeletion(action)
      }
    },
  }
}

/**
 * Options for when using the {@link useActionItemButtonCallbacks}
 * hook.
 */
export type TActionButtonCallbackOptions = {
  /**
   * Optional post-hook for handling when an action
   * has been successfully duplicated.
   * @param resultingAction The action that was duplicated.
   */
  onSuccessfulDuplicate?: (resultingAction: ClientMissionAction) => void
  /**
   * Optional post-hook for handling when a action
   * has been successfully deleted.
   * @param deletedAction The action that was deleted.
   */
  onSuccessfulDeletion?: (deletedAction: ClientMissionAction) => void
}

/**
 * The yielded value from the {@link useActionItemButtonCallbacks}
 * hook, containing the callback functions.
 */
export type TActionItemButtonCallbacks = {
  /**
   * Callback for when the user requests to duplicate an action.
   * @param action The action to duplicate.
   * @param selectNewAction Whether to select the new action after duplicating, defaults to false.
   */
  onDuplicateRequest: (
    action: ClientMissionAction,
    selectNewAction?: boolean,
  ) => Promise<void>
  /**
   * Callback for when the user requests to delete an action.
   * @param action The action to delete.
   * @param navigateBack Whether to navigate back to the previous selection after deleting, defaults to false.
   */
  onDeleteRequest: (
    action: ClientMissionAction,
    navigateBack?: boolean,
  ) => Promise<void>
}
