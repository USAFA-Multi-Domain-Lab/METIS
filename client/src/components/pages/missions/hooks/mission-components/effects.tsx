import { TMetisClientComponents } from 'src'
import Prompt from 'src/components/content/communication/Prompt'
import { useGlobalContext } from 'src/context/global'
import { ClientEffect } from 'src/missions/effects'
import { TEffectHost } from '../../../../../../../shared/missions/effects'
import { useMissionPageContext } from '../../context'

/**
 * Yields effect-related callback functions which can be used for
 * the {@link ButtonSvg.onClick} callback for a button.
 */
export default function useEffectItemButtonCallbacks<
  THost extends TEffectHost<TMetisClientComponents, any>,
>(
  host: THost,
  options: TEffectButtonCallbackOptions<ClientEffect<THost['effectType']>> = {},
): TEffectItemButtonCallbacks<ClientEffect<THost['effectType']>> {
  const { onSuccessfulDuplicate = () => {}, onSuccessfulDeletion = () => {} } =
    options
  const globalContext = useGlobalContext()
  const { notify, prompt } = globalContext.actions
  const missionPageContext = useMissionPageContext()
  const { onChange } = missionPageContext

  return {
    onDuplicateRequest: async (
      effect: ClientEffect<THost['effectType']>,
      selectNewEffect: boolean = false,
    ) => {
      // Prompt the user to enter the name of the new effect.
      let { choice, text } = await prompt(
        'Enter the name of the new effect:',
        ['Cancel', 'Submit'],
        {
          textField: { boundChoices: ['Submit'], label: 'Name' },
          defaultChoice: 'Submit',
        },
      )

      // If the user confirms the duplication, proceed.
      if (choice === 'Submit') {
        try {
          // Duplicate the effect.
          let newEffect = effect.duplicate({
            name: text,
            localKey: host.generateEffectKey(),
          })
          // Add the new effect to the host.
          host.effects.push(newEffect)
          // Select the new effect if necessary.
          if (selectNewEffect) host.mission.select(newEffect)
          // Notify the user that the force was duplicated.
          notify(`Successfully duplicated "${newEffect.name}".`)
          // Allow the user to save the changes.
          onChange(newEffect)
          // Run the post-hook.
          onSuccessfulDuplicate(newEffect)
        } catch (error: any) {
          notify(`Failed to duplicate "${effect.name}".`)
        }
      }
    },
    onDeleteRequest: async (
      effect: ClientEffect<THost['effectType']>,
      navigateBack: boolean = false,
    ) => {
      // Prompt the user to confirm the deletion.
      let { choice } = await prompt(
        `Please confirm the deletion of this effect.`,
        Prompt.ConfirmationChoices,
      )

      // If the user cancels, abort.
      if (choice === 'Cancel') return

      // Go back to the previous selection.
      if (navigateBack) {
        host.mission.selectBack()
      }

      // Filter out the effect from the action.
      host.effects = host.effects.filter(
        (actionEffect: ClientEffect<THost['effectType']>) =>
          actionEffect._id !== effect._id,
      )

      // Notify the user.
      notify(`Successfully deleted "${effect.name}".`)
      // Allow the user to save the changes.
      onChange(effect)
      // Run the post-hook.
      onSuccessfulDeletion(effect)
    },
  }
}

/**
 * Options for when using the {@link useEffectItemButtonCallbacks}
 * hook.
 */
export type TEffectButtonCallbackOptions<TEffect extends ClientEffect> = {
  /**
   * Optional post-hook for handling when an effect
   * has been successfully duplicated.
   * @param resultingEffect The effect that was duplicated.
   */
  onSuccessfulDuplicate?: (resultingEffect: TEffect) => void
  /**
   * Optional post-hook for handling when a effect
   * has been successfully deleted.
   * @param deletedEffect The effect that was deleted.
   */
  onSuccessfulDeletion?: (deletedEffect: TEffect) => void
}

/**
 * The yielded value from the {@link useEffectItemButtonCallbacks}
 * hook, containing the callback functions.
 */
export type TEffectItemButtonCallbacks<TEffect extends ClientEffect> = {
  /**
   * Callback for when the user requests to duplicate an effect.
   * @param effect The effect to duplicate.
   * @param selectNewEffect Whether to select the new effect after duplicating, defaults to false.
   */
  onDuplicateRequest: (
    effect: TEffect,
    selectNewEffect?: boolean,
  ) => Promise<void>
  /**
   * Callback for when the user requests to delete an effect.
   * @param effect The effect to delete.
   * @param navigateBack Whether to navigate back to the previous selection after deleting, defaults to false.
   */
  onDeleteRequest: (effect: TEffect, navigateBack?: boolean) => Promise<void>
}
