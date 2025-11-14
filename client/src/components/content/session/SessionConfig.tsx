import type { ClientMission } from '@client/missions/ClientMission'
import type {
  TSessionAccessibility,
  TSessionConfig,
} from '@shared/sessions/MissionSession'
import { useEffect, useState } from 'react'
import { DetailString } from '../form/DetailString'
import { DetailToggle } from '../form/DetailToggle'
import { DetailDropdown } from '../form/dropdown/'
import { ButtonText } from '../user-controls/buttons/ButtonText'
import './SessionConfig.scss'

/**
 * Allows the modification of the given session config.
 */
export default function SessionConfig({
  sessionConfig,
  mission,
  saveButtonText = 'Save',
  onChange = () => {},
  onSave,
  onCancel,
}: TSessionConfig_P): TReactElement | null {
  /* -- STATE -- */
  const [accessibility, setAccessibility] = useState<TSessionAccessibility>(
    sessionConfig.accessibility,
  )
  const [infiniteResources, setInfiniteResources] = useState(
    sessionConfig.infiniteResources,
  )
  const [effectsEnabled, setEffectsEnabled] = useState(
    sessionConfig.effectsEnabled,
  )
  const [name, setName] = useState(sessionConfig.name ?? mission.name)

  /* -- EFFECTS -- */

  // componentDidUpdate
  useEffect(() => {
    sessionConfig.accessibility = accessibility
    sessionConfig.infiniteResources = infiniteResources
    sessionConfig.effectsEnabled = effectsEnabled
    sessionConfig.name = name
    onChange()
  }, [accessibility, infiniteResources, effectsEnabled, name])

  /* -- RENDER -- */

  return (
    <div className='SessionConfig'>
      <DetailString
        label='Name'
        value={name}
        setValue={setName}
        fieldType='required'
        handleOnBlur='repopulateValue'
        defaultValue={mission.name}
      />
      <DetailDropdown<TSessionConfig['accessibility']>
        label='Accessibility'
        options={['public', 'id-required']}
        value={accessibility}
        setValue={setAccessibility}
        isExpanded={false}
        getKey={(value) => value}
        render={(value) => {
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
        label='Infinite Resources:'
        value={infiniteResources}
        setValue={setInfiniteResources}
      />
      <DetailToggle
        label='Enable Effects:'
        value={effectsEnabled}
        setValue={setEffectsEnabled}
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
   * The mission to which the session belongs.
   */
  mission: ClientMission
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
