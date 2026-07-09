import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import SessionGeneralConfig from '@client/components/content/session/config/SessionGeneralConfig'
import TargetEnviromentConfig from '@client/components/content/session/config/TargetEnvironmentConfig'
import { useGlobalContext } from '@client/context/global'
import type { SessionClient } from '@client/sessions/SessionClient'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import './SessionLobbyConfig.scss'

/**
 * Auto-saving session configuration with an inner side menu
 * for switching between configuration sections. Intended for
 * embedding within the lobby's configuration view.
 */
export default function SessionConfigMenu({
  session,
  disabled = false,
}: TSessionConfigMenu_P): TReactElement | null {
  /* -- STATE -- */

  const { mission } = session
  const globalContext = useGlobalContext()
  const { handleError } = globalContext.actions

  /* -- FUNCTIONS -- */

  /**
   * Persists a config change to the server.
   * @param updates The partial config to apply.
   */
  const commit = async (updates: Partial<TSessionConfig>): Promise<void> => {
    try {
      await session.$updateConfig(updates)
    } catch (error) {
      handleError({
        message: 'Failed to save session configuration.',
        notifyMethod: 'bubble',
      })
    }
  }

  /* -- RENDER -- */

  return (
    <div className='SessionLobbyConfig'>
      <Panel>
        <PanelView title='Session'>
          <div className='PanelContent'>
            <SessionGeneralConfig
              sessionConfig={session.config}
              mission={mission}
              sessionId={session._id}
              disabled={disabled}
              onCommit={commit}
            />
          </div>
        </PanelView>
        <PanelView title='Target Environments'>
          <div className='PanelContent'>
            <TargetEnviromentConfig
              sessionConfig={session.config}
              mission={mission}
              disabled={disabled}
              onCommit={commit}
            />
          </div>
        </PanelView>
      </Panel>
    </div>
  )
}

/* -- types -- */

/**
 * The configuration section currently shown in the side menu.
 */
type TConfigSectionKey = 'general' | 'target-environments'

/**
 * A configuration section available in the side menu.
 */
type TConfigSection = {
  /**
   * The unique identifier for the section.
   */
  key: TConfigSectionKey
  /**
   * A human-readable title to display in the side menu.
   */
  label: string
}

/**
 * Props for `SessionConfigMenu` component.
 */
export type TSessionConfigMenu_P = {
  /**
   * The session whose configuration is being modified.
   */
  session: SessionClient
  /**
   * Whether all configuration options are locked from editing.
   * @default false
   */
  disabled?: boolean
}
