import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import type { ClientMission } from '@client/missions/ClientMission'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { ButtonText } from '../../user-controls/buttons/ButtonText'
import './SessionConfig.scss'
import SessionGeneralConfig from './SessionGeneralConfig'
import TargetEnvSettings from './TargetEnvConfig'

/**
 * Allows the modification of the given session config.
 */
export default function SessionConfig({
  sessionConfig,
  mission,
  sessionId = null,
  saveButtonText = 'Save',
  disabled = false,
  onChange = () => {},
  onSave,
  onCancel,
}: TSessionConfig_P): TReactElement | null {
  /* -- RENDER -- */

  return (
    <div className='SessionConfig'>
      <div className='Title'>Session Configuration</div>
      <Panel>
        <PanelView title='Session'>
          <div className='PanelContent'>
            <SessionGeneralConfig
              sessionConfig={sessionConfig}
              mission={mission}
              sessionId={sessionId}
              onChange={onChange}
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
   * The ID of the session being configured, or null if creating a new session.
   */
  sessionId?: string | null
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
