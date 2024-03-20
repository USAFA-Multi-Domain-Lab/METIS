import { useState } from 'react'
import { TGameConfig } from '../../../../../shared/games'
import { DetailDropDown, DetailToggle } from '../form/Form'
import { ButtonText } from '../user-controls/ButtonText'
import './GameConfig.scss'

/**
 * Allows the modification of the given game config.
 */
export default function GameConfig({
  gameConfig,
  saveButtonText = 'Save',
  onSave,
}: TGameConfig_P): JSX.Element | null {
  // Use forced updates.
  const [, setForcedUpdateCounter] = useState<number>(0)
  const forceUpdate = () => setForcedUpdateCounter((c) => c + 1)

  return (
    <div className='GameConfig'>
      <DetailDropDown<NonNullable<TGameConfig['accessibility']>>
        label='Accessibility'
        options={['public', 'id-required']}
        currentValue={gameConfig.accessibility}
        deliverValue={(value) => {
          gameConfig.accessibility = value
          forceUpdate()
        }}
        isExpanded={false}
        renderDisplayName={(value) => {
          switch (value) {
            case 'public':
              return 'Public'
            case 'id-required':
              return 'ID Required'
            case 'invite-only':
              return 'Invite Only'
            default:
              return 'Unknown Option'
          }
        }}
      />
      <DetailToggle
        label='Auto-Assign:'
        currentValue={gameConfig.autoAssign}
        deliverValue={(value) => (gameConfig.autoAssign = value)}
        lockState={'locked-activation'}
      />
      <DetailToggle
        label='Enable Resources:'
        currentValue={gameConfig.resourcesEnabled}
        deliverValue={(value) => (gameConfig.resourcesEnabled = value)}
      />
      <DetailToggle
        label='Enable Effects:'
        currentValue={gameConfig.effectsEnabled}
        deliverValue={(value) => (gameConfig.effectsEnabled = value)}
      />
      <div className='Buttons'>
        <ButtonText text={saveButtonText} onClick={onSave} />
      </div>
    </div>
  )
}

/* -- types -- */

/**
 * Props for `GameConfig` component.
 */
export type TGameConfig_P = {
  /**
   * The game config to modify.
   */
  gameConfig: Required<TGameConfig>
  /**
   * The text for the save button.
   * @default 'Save'
   */
  saveButtonText?: string
  /**
   * Callback for when the game config is saved.
   */
  onSave: () => void
}
