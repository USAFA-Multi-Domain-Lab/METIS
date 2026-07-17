import type { ClientMission } from '@client/missions/ClientMission'
import { compute } from '@client/toolbox'
import { usePostInitEffect } from '@client/toolbox/hooks'
import type {
  TSessionAccessibility,
  TSessionConfig,
  TSessionMode,
} from '@shared/sessions/MissionSession'
import { useState } from 'react'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
import { DetailDropdown } from '../../form/dropdowns/standard/DetailDropdown'
import './SessionGeneralConfig.scss'
import { useConfigUpdater } from './useConfigUpdater'

/**
 * Renders the general session settings (name, accessibility,
 * resources, mode, and force) for a session config.
 */
export default function SessionGeneralConfig({
  sessionConfig,
  mission,
  sessionId = null,
  disabled = false,
  approveChange = () => true,
  onChange = () => {},
}: TSessionGeneralConfig_P): TReactElement | null {
  /* -- STATE -- */
  const [accessibility, setAccessibility] = useState<TSessionAccessibility>(
    sessionConfig.accessibility,
  )
  const [infiniteResources, setInfiniteResources] = useState(
    sessionConfig.infiniteResources,
  )
  const [name, setName] = useState(sessionConfig.name ?? mission.name)
  const [mode, setMode] = useState<TSessionMode>(sessionConfig.mode)
  const [singlePlayerForceId, setSinglePlayerForceId] = useState<
    string | undefined
  >(sessionConfig.singlePlayerForceId)
  const { processUpdate, useProcessUpdater } = useConfigUpdater(
    sessionConfig,
    approveChange,
    onChange,
  )

  /* -- COMPUTED -- */

  let defaultForceId = mission.forces[0]._id

  /* -- EFFECTS -- */

  // Register a process updater for all fields that
  // immediately commit their changes, to keep config
  // in sync with the internal state.
  useProcessUpdater('accessibility', accessibility, setAccessibility)
  useProcessUpdater(
    'infiniteResources',
    infiniteResources,
    setInfiniteResources,
  )
  useProcessUpdater('mode', mode, setMode)
  useProcessUpdater(
    'singlePlayerForceId',
    singlePlayerForceId,
    setSinglePlayerForceId,
  )

  // When the mode switches, the single-player
  // force ID needs to be updated accordingly.
  usePostInitEffect(() => {
    setSinglePlayerForceId(
      mode === 'single-player' ? defaultForceId : undefined,
    )
  }, [mode])

  // An owner-only session admits no participants (only the owner, a
  // manager), so single-player would have no realms to mint. Force the
  // mode back to multiplayer whenever the session becomes owner-only
  // and the config is set to single-player mode.
  usePostInitEffect(() => {
    if (accessibility === 'owner-only' && mode !== 'single-player') {
      setMode('multiplayer')
    }
  }, [accessibility])

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * JSX for accessibility selection.
   */
  const accessibilityJsx = compute<TReactElement>(() => {
    if (sessionConfig.isTest) {
      return <DetailLocked label='Accessibility' value='Owner Only' />
    } else {
      return (
        <DetailDropdown<TSessionConfig['accessibility']>
          label='Accessibility'
          options={['public', 'id-required', 'owner-only']}
          value={accessibility}
          setValue={setAccessibility}
          disabled={disabled}
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
              case 'owner-only':
                return 'Owner Only'
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

  /**
   * JSX for mode selection. Owner-only sessions are locked to
   * multiplayer, since single-player requires participants and an
   * owner-only session admits none.
   */
  const modeJsx = compute<TReactElement>(() => {
    if (accessibility === 'owner-only') {
      return <DetailLocked label='Mode' value='Multiplayer' />
    } else {
      return (
        <DetailDropdown<TSessionMode>
          label='Mode'
          options={['multiplayer', 'single-player']}
          value={mode}
          setValue={setMode}
          disabled={disabled}
          isExpanded={false}
          getKey={(value) => value}
          render={(value) =>
            value === 'single-player' ? 'Single-player' : 'Multiplayer'
          }
          fieldType='required'
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: 'multiplayer',
          }}
        />
      )
    }
  })

  /* -- RENDER -- */

  return (
    <div className='SessionGeneralConfig'>
      <DetailLocked
        label='Mission Name'
        value={mission.name}
        disabled={disabled}
      />
      {sessionId !== null && (
        <DetailLocked
          label='Session ID'
          value={sessionId!}
          disabled={disabled}
        />
      )}
      <DetailString
        label='Session Name'
        value={name}
        setValue={setName}
        fieldType='required'
        defaultValue={mission.name}
        disabled={disabled}
        onBlur={() =>
          processUpdate('name', name.trim() || mission.name, (revert) =>
            setName(typeof revert === 'string' ? revert : mission.name),
          )
        }
      />
      {accessibilityJsx}
      <DetailToggle
        label='Infinite Resources'
        value={infiniteResources}
        setValue={setInfiniteResources}
        disabled={disabled}
      />
      {modeJsx}
      {mode === 'single-player' && singlePlayerForceId && (
        <DetailDropdown<string>
          label='Force'
          options={mission.forces.map((force) => force._id)}
          value={singlePlayerForceId}
          setValue={setSinglePlayerForceId as TReactSetter<string>}
          disabled={disabled}
          isExpanded={false}
          getKey={(forceId) => forceId}
          render={(forceId) =>
            mission.getForceById(forceId)?.name ?? 'Unknown Force'
          }
          fieldType='required'
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: defaultForceId,
          }}
        />
      )}
    </div>
  )
}

/* -- types -- */

/**
 * Props for `SessionGeneralConfig` component.
 */
export type TSessionGeneralConfig_P = {
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
   * Whether all fields are locked from editing.
   * @default false
   */
  disabled?: boolean
  /**
   * Callback to approve or veto a pending config change before it is
   * committed. Return `false` (or a promise resolving to `false`) to
   * reject the change and revert the field to its committed value.
   * Non-text fields are processed as they change; the session name is
   * processed on blur.
   * @default () => true
   */
  approveChange?: (
    updates: Partial<TSessionConfig>,
  ) => boolean | Promise<boolean>
  /**
   * Callback invoked after an approved change has been committed to the
   * session config, with the applied updates. Can be used for auto-save.
   * @default () => {}
   */
  onChange?: (updates: Partial<TSessionConfig>) => void
}
