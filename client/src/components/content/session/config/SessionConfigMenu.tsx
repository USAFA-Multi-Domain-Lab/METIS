import { useGlobalContext } from '@client/context/global'
import type { SessionClient } from '@client/sessions/SessionClient'
import { compute } from '@client/toolbox'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useState } from 'react'
import './SessionConfigMenu.scss'
import SessionGeneralConfig from './SessionGeneralConfig'
import TargetEnvConfig from './TargetEnvConfig'

/**
 * Auto-saving session configuration with an inner side menu
 * for switching between configuration sections. Intended for
 * embedding within the lobby's configuration view.
 */
export default function SessionConfigMenu({
  session,
}: TSessionConfigMenu_P): TReactElement | null {
  /* -- STATE -- */

  const { mission } = session
  const globalContext = useGlobalContext()
  const { handleError } = globalContext.actions
  const [section, setSection] = useState<TConfigSectionKey>('general')

  /* -- COMPUTED -- */

  /**
   * The sections available in the side menu. Target environments
   * are only configurable when the mission defines them.
   */
  const sections = compute<TConfigSection[]>(() => {
    const result: TConfigSection[] = [{ key: 'general', label: 'General' }]
    if (mission.targetEnvironments.length) {
      result.push({ key: 'target-environments', label: 'Target Environments' })
    }
    return result
  })

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
    <div className='SessionConfigMenu'>
      <div className='MenuOptions'>
        {sections.map(({ key, label }) => {
          let classes = new ClassList('MenuOption').set(
            'Selected',
            section === key,
          )
          return (
            <div
              key={key}
              className={classes.value}
              onClick={() => setSection(key)}
            >
              {label}
            </div>
          )
        })}
      </div>
      <div className='MenuContent'>
        {section === 'general' && (
          <SessionGeneralConfig
            sessionConfig={session.config}
            mission={mission}
            sessionId={session._id}
            onCommit={commit}
          />
        )}
        {section === 'target-environments' && (
          <TargetEnvConfig
            sessionConfig={session.config}
            mission={mission}
            onCommit={commit}
          />
        )}
      </div>
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
}
