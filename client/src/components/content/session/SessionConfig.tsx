import { useEffect, useState } from 'react'
import {
  TSessionAccessibility,
  TSessionConfig,
} from '../../../../../shared/sessions'
import { DetailDropdown } from '../form/DetailDropdown'
import { DetailToggle } from '../form/DetailToggle'
import { ButtonText } from '../user-controls/ButtonText'
import './SessionConfig.scss'

/**
 * Allows the modification of the given session config.
 */
export default function SessionConfig({
  sessionConfig,
  saveButtonText = 'Save',
  onChange = () => {},
  onSave,
  onCancel,
}: TSessionConfig_P): JSX.Element | null {
  const [accessibility, setAccessibility] = useState<TSessionAccessibility>(
    sessionConfig.accessibility,
  )
  const [autoAssign, setAutoAssign] = useState(sessionConfig.autoAssign)
  const [infiniteResources, setInfiniteResources] = useState(
    sessionConfig.infiniteResources,
  )
  const [effectsEnabled, setEffectsEnabled] = useState(
    sessionConfig.effectsEnabled,
  )

  useEffect(() => {
    sessionConfig.accessibility = accessibility
    sessionConfig.autoAssign = autoAssign
    sessionConfig.infiniteResources = infiniteResources
    sessionConfig.effectsEnabled = effectsEnabled
    onChange()
  }, [accessibility, autoAssign, infiniteResources, effectsEnabled])

  return (
    <div className='SessionConfig'>
      <DetailDropdown<TSessionConfig['accessibility']>
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
        handleInvalidOption={{
          method: 'setToDefault',
          defaultValue: 'public',
        }}
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
 * Props for `SessionConfig` component.
 */
export type TSessionConfig_P = {
  /**
   * The session config to modify.
   */
  sessionConfig: TSessionConfig
  /**
   * The text for the save button.
   * @default 'Save'
   */
  saveButtonText?: string
  /**
   * Callback for when the session config is changed.
   * @default () => {}
   */
  onChange?: () => void
  /**
   * Callback for when the session config is saved.
   */
  onSave: () => void
  /**
   * Callback for when the session configuration is cancelled.
   */
  onCancel: () => void
}
