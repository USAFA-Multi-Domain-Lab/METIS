import Prompt from '@client/components/content/communication/Prompt'
import Panel from '@client/components/content/general-layout/panels/Panel'
import PanelView from '@client/components/content/general-layout/panels/PanelView'
import SessionGeneralConfig from '@client/components/content/session/config/SessionGeneralConfig'
import TargetEnviromentConfig from '@client/components/content/session/config/TargetEnvironmentConfig'
import { useGlobalContext } from '@client/context/global'
import type { SessionClient } from '@client/sessions/SessionClient'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import { s } from '@shared/toolbox/strings/StringToolbox'
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
  const { handleError, prompt } = globalContext.actions

  /* -- FUNCTIONS -- */

  /**
   * Approves a pending config change before it is committed. Switching
   * to owner-only kicks every non-owner member (performed server-side),
   * so confirm with the actor first.
   * @param updates The pending config updates.
   * @resolves to `true` if approved, `false` if rejected.
   * @rejects Never.
   */
  const approveChange = async (
    updates: Partial<TSessionConfig>,
  ): Promise<boolean> => {
    if (
      updates.accessibility === 'owner-only' &&
      session.config.accessibility !== 'owner-only'
    ) {
      let membersToKick = session.joinedMembers.filter(
        (member) => member.userId !== session.ownerId,
      )

      if (membersToKick.length) {
        let isActorOwner = session.member.userId === session.ownerId
        let memberCount = `${membersToKick.length} ${
          membersToKick.length === 1 ? 'member' : 'members'
        }`
        let confirmation = isActorOwner
          ? `Switching to \`Owner Only\` will kick ${memberCount} from the lobby. Continue?`
          : `Switching to \`Owner Only\` will kick ${memberCount} from the lobby, including you. Continue?`

        let { choice } = await prompt(confirmation, Prompt.ConfirmationChoices)
        if (choice === 'Cancel') return false
      }
    }

    // Switching to standalone converts any limited observers into
    // participants (standalone has no place for them), performed
    // server-side; confirm with the actor first.
    if (updates.mode === 'standalone' && session.config.mode !== 'standalone') {
      let { limitedObservers } = session

      if (limitedObservers.length) {
        let observerCount = `${limitedObservers.length} limited observer${s(limitedObservers.length)}`
        let confirmation = `Switching to \`Standalone\` will change ${observerCount} to participants. Continue?`

        let { choice } = await prompt(confirmation, Prompt.ConfirmationChoices)
        if (choice === 'Cancel') return false
      }
    }

    return true
  }

  /**
   * Persists a config change to the server.
   * @param updates The partial config to apply.
   * @param revert Undoes the change in the editor.
   */
  const commit = async (
    updates: Partial<TSessionConfig>,
    revert: () => void,
  ): Promise<void> => {
    try {
      await session.$updateConfig(updates)
    } catch (error) {
      handleError({
        message: 'Failed to save session configuration.',
        notifyMethod: 'bubble',
      })
      revert()
    }
  }

  /* -- RENDER -- */

  return (
    <div className='SessionLobbyConfig'>
      <Panel>
        <PanelView title='General'>
          <div className='PanelContent'>
            <SessionGeneralConfig
              sessionConfig={session.config}
              mission={mission}
              sessionId={session._id}
              disabled={disabled}
              approveChange={approveChange}
              onChange={commit}
            />
          </div>
        </PanelView>
        <PanelView title='Target Environments'>
          <div className='PanelContent'>
            <TargetEnviromentConfig
              sessionConfig={session.config}
              mission={mission}
              disabled={disabled}
              approveChange={approveChange}
              onChange={commit}
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
