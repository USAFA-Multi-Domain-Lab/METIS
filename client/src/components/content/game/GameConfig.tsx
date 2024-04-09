import { useEffect, useState } from 'react'
import { TGameAccessibility, TGameConfig } from '../../../../../shared/games'
import { DetailDropDown, DetailToggle } from '../form/Form'
import { ButtonText } from '../user-controls/ButtonText'
import './GameConfig.scss'

/**
 * Allows the modification of the given game config.
 */
export default function GameConfig({
  gameConfig,
  saveButtonText = 'Save',
  onChange = () => {},
  onSave,
  onCancel,
}: TGameConfig_P): JSX.Element | null {
  const [accessibility, setAccessibility] = useState<TGameAccessibility>(
    gameConfig.accessibility,
  )
  const [autoAssign, setAutoAssign] = useState(gameConfig.autoAssign)
  const [infiniteResources, setInfiniteResources] = useState(
    gameConfig.infiniteResources,
  )
  const [effectsEnabled, setEffectsEnabled] = useState(
    gameConfig.effectsEnabled,
  )

  useEffect(() => {
    gameConfig.accessibility = accessibility
    gameConfig.autoAssign = autoAssign
    gameConfig.infiniteResources = infiniteResources
    gameConfig.effectsEnabled = effectsEnabled
    onChange()
  }, [accessibility, autoAssign, infiniteResources, effectsEnabled])

  return (
    <div className='GameConfig'>
      <DetailDropDown<TGameConfig['accessibility']>
        label='Accessibility'
        options={['public', 'id-required']}
        stateValue={accessibility}
        setState={setAccessibility}
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
        fieldType='required'
      />
      <DetailToggle
        label='Auto-Assign:'
        stateValue={autoAssign}
        setState={setAutoAssign}
        lockState={'locked-activation'}
      />
      <DetailToggle
        label='Infinite Resources:'
        stateValue={infiniteResources}
        setState={setInfiniteResources}
      />
      <DetailToggle
        label='Enable Effects:'
        stateValue={effectsEnabled}
        setState={setEffectsEnabled}
      />
      <div className='Buttons'>
        <ButtonText text={saveButtonText} onClick={onSave} />
        <ButtonText text={'Cancel'} onClick={onCancel} />
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
  gameConfig: TGameConfig
  /**
   * The text for the save button.
   * @default 'Save'
   */
  saveButtonText?: string
  /**
   * Callback for when the game config is changed.
   * @default () => {}
   */
  onChange?: () => void
  /**
   * Callback for when the game config is saved.
   */
  onSave: () => void
  /**
   * Callback for when the game configuration is cancelled.
   */
  onCancel: () => void
}
