import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import SessionGeneralConfig from '@client/components/content/session/config/SessionGeneralConfig'
import TargetEnviromentConfig from '@client/components/content/session/config/TargetEnvironmentConfig'
import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import type { ClientMission } from '@client/missions/ClientMission'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import './SessionLaunchConfig.scss'

/**
 * Allows the modification of the given session config before
 * launching a session.
 */
export default function SessionConfig({
  sessionConfig,
  mission,
  disabled = false,
  onChange = () => {},
  onRequestLaunch,
  onRequestCancel,
}: TSessionConfig_P): TReactElement | null {
  /* -- RENDER -- */

  return (
    <div className='SessionLaunchConfig'>
      <div className='Title'>Session Configuration</div>
      <Panel>
        <PanelView title='Session'>
          <div className='PanelContent'>
            <SessionGeneralConfig
              sessionConfig={sessionConfig}
              mission={mission}
              onChange={onChange}
            />
          </div>
        </PanelView>
        <PanelView title='Target Environments'>
          <div className='PanelContent'>
            <TargetEnviromentConfig
              sessionConfig={sessionConfig}
              mission={mission}
              onChange={onChange}
            />
          </div>
        </PanelView>
      </Panel>
      <div className='Buttons'>
        <ButtonText
          text={'Launch'}
          onClick={onRequestLaunch}
          disabled={disabled ? 'full' : 'none'}
        />
        <ButtonText
          text={'Cancel'}
          onClick={onRequestCancel}
          disabled={disabled ? 'full' : 'none'}
        />
      </div>
    </div>
  )
}

/* -- types -- */

/**
 * Props for {@link SessionLaunchConfig} component.
 */
export type TSessionConfig_P = {
  /**
   * The session config to modify.
   */
  sessionConfig: TSessionConfig
  /**
   * The mission from which the session will be launched
   */
  mission: ClientMission
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
   * Callback for when the user clicks the launch button.
   */
  onRequestLaunch: () => void
  /**
   * Callback for when the user clicks the cancel button.
   */
  onRequestCancel: () => void
}
