import { useGlobalContext } from '@client/context/global'
import type {
  ClientMissionPrototype,
  TPrototypeDeleteMethod,
} from '@client/missions/nodes/ClientMissionPrototype'
import { PrototypeCreation } from '@client/missions/transformations/PrototypeCreation'
import { useMissionPageContext } from '../../context'

/**
 * Yields prototype-related callback functions which can be used for
 * the {@link ButtonSvg.onClick} callback for a button.
 */
export default function usePrototypeItemButtonCallbacks(
  options: TPrototypeButtonCallbackOptions = {},
): TPrototypeItemButtonCallbacks {
  const { onSuccessfulDeletion = () => {} } = options
  const globalContext = useGlobalContext()
  const { notify, prompt } = globalContext.actions
  const missionPageContext = useMissionPageContext()
  const { onChange, state: missionPageState } = missionPageContext
  const [mission] = missionPageState.mission

  return {
    onAddRequest: (destination: ClientMissionPrototype): void => {
      mission.transformation = new PrototypeCreation(destination)
    },
    onDeleteRequest: async (
      prototype: ClientMissionPrototype,
    ): Promise<void> => {
      // Gather details.
      let deleteMethod: TPrototypeDeleteMethod = 'delete-children'
      let message: string
      let choices: ['Cancel', 'Keep Children', 'Delete Children', 'Confirm'] = [
        'Cancel',
        'Keep Children',
        'Delete Children',
        'Confirm',
      ]

      // Set the message and choices based on the prototype's children.
      if (prototype.hasChildren) {
        message = `What would you like to do with the children of "${prototype.name}"?`
        choices.pop()
      } else {
        message = `Please confirm the deletion of "${prototype.name}".`
        choices.splice(1, 2)
      }

      // Prompt the user for confirmation.
      let { choice } = await prompt(message, choices)

      // If the user selects node only, update the delete method.
      if (choice === 'Keep Children') {
        deleteMethod = 'shift-children'
      }
      // Return if the user cancels the deletion.
      else if (choice === 'Cancel') {
        return
      }

      // Notify the user that the node was deleted.
      notify(`Successfully deleted "${prototype.name}".`)
      // Delete the node.
      prototype.delete({
        deleteMethod,
      })
      // Handle the change.
      onChange(prototype)
      mission.deselect()
      // Run the post-hook.
      onSuccessfulDeletion(prototype)
    },
  }
}

/**
 * Options for when using the {@link usePrototypeItemButtonCallbacks}
 * hook.
 */
export type TPrototypeButtonCallbackOptions = {
  /**
   * Optional post-hook for handling when a prototype
   * has been successfully deleted.
   * @param deletedPrototype The prototype that was deleted.
   */
  onSuccessfulDeletion?: (deletedPrototype: ClientMissionPrototype) => void
}

/**
 * The yielded value from the {@link usePrototypeItemButtonCallbacks}
 * hook, containing the callback functions.
 */
export type TPrototypeItemButtonCallbacks = {
  /**
   * Callback for when the user requests to add a prototype.
   * @param destination The prototype relative to which the new
   * prototype will be added.
   */
  onAddRequest: (destination: ClientMissionPrototype) => void
  /**
   * Callback for when the user requests to delete an prototype.
   * @param prototype The prototype to delete.
   */
  onDeleteRequest: (prototype: ClientMissionPrototype) => Promise<void>
}
