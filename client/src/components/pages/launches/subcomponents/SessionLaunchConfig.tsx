import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import SessionGeneralConfig from '@client/components/content/session/config/SessionGeneralConfig'
import TargetEnvironmentConfig from '@client/components/content/session/config/TargetEnvironmentConfig'
import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import type { ClientMission } from '@client/missions/ClientMission'
import { useForcedUpdates } from '@client/toolbox/hooks/states'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import './SessionLaunchConfig.scss'

/**
 * Allows the modification of the given session config before
 * launching a session.
 */
export default function SessionLaunchConfig({
  sessionConfig,
  mission,
  disabled = false,
  onChange = () => {},
  onRequestLaunch,
  onRequestCancel,
}: TSessionConfig_P): TReactElement | null {
  const forceUpdate = useForcedUpdates()
  const onChangeWrapper = () => {
    forceUpdate()
    onChange()
  }

  /* -- RENDER -- */

  return (
    <div className='SessionLaunchConfig'>
      <Panel>
        <PanelView title='General'>
          <div className='PanelContent'>
            <SessionGeneralConfig
              sessionConfig={sessionConfig}
              mission={mission}
              onChange={onChangeWrapper}
            />
          </div>
        </PanelView>
        <PanelView title='Target Environments'>
          <div className='PanelContent'>
            <TargetEnvironmentConfig
              sessionConfig={sessionConfig}
              mission={mission}
              onChange={onChangeWrapper}
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
