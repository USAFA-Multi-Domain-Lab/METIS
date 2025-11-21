import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import type { ClientMission } from '@client/missions/ClientMission'
import { compute } from '@client/toolbox'
import type {
  TSessionAccessibility,
  TSessionConfig,
} from '@shared/sessions/MissionSession'
import { useEffect, useState } from 'react'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
import { DetailDropdown } from '../../form/dropdown'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import './SessionConfig.scss'
import TargetEnvSettings from './TargetEnvSettings'

/**
 * Allows the modification of the given session config.
 */
export default function SessionConfig({
  sessionConfig,
  mission,
  saveButtonText = 'Save',
  disabled = false,
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
  const [name, setName] = useState(sessionConfig.name ?? mission.name)

  /* -- EFFECTS -- */

  // componentDidUpdate
  useEffect(() => {
    sessionConfig.accessibility = accessibility
    sessionConfig.infiniteResources = infiniteResources
    sessionConfig.name = name
    onChange()
  }, [accessibility, infiniteResources, name])

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * JSX for accessibility selection.
   */
  const accessibilityJsx = compute<TReactElement>(() => {
    if (accessibility === 'testing') {
      return <DetailLocked label='Accessibility' stateValue='Testing' />
    } else {
      return (
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
      )
    }
  })

  /* -- RENDER -- */

  return (
    <div className='SessionConfig'>
      <Panel>
        <PanelView title='Settings'>
          <div className='PanelContent'>
            <DetailString
              label='Name'
              value={name}
              setValue={setName}
              fieldType='required'
              handleOnBlur='repopulateValue'
              defaultValue={mission.name}
            />
            {accessibilityJsx}
            <DetailToggle
              label='Infinite Resources'
              value={infiniteResources}
              setValue={setInfiniteResources}
            />
          </div>
        </PanelView>
        <PanelView title='Target Environments'>
          <div className='PanelContent'>
            <TargetEnvSettings
              sessionConfig={sessionConfig}
              mission={mission}
              onChange={onChange}
            />
          </div>
        </PanelView>
      </Panel>
      <div className='Buttons'>
        <ButtonText
          text={saveButtonText}
          onClick={onSave}
          disabled={disabled ? 'full' : 'none'}
        />
        <ButtonText
          text={'Cancel'}
          onClick={onCancel}
          disabled={disabled ? 'full' : 'none'}
        />
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
   * Whether the save/cancel buttons are disabled.
   * @default false
   */
  disabled?: boolean
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
