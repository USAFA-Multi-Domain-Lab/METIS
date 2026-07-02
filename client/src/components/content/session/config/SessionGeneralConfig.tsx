import type { ClientMission } from '@client/missions/ClientMission'
import { compute } from '@client/toolbox'
import type {
  TSessionAccessibility,
  TSessionConfig,
  TSessionMode,
} from '@shared/sessions/MissionSession'
import { useEffect, useState } from 'react'
import { DetailLocked } from '../../form/DetailLocked'
import { DetailString } from '../../form/DetailString'
import { DetailToggle } from '../../form/DetailToggle'
import { DetailDropdown } from '../../form/dropdowns/standard/DetailDropdown'
import './SessionGeneralConfig.scss'

/**
 * Renders the general session settings (name, accessibility,
 * resources, mode, and force) for a session config.
 */
export default function SessionGeneralConfig({
  sessionConfig,
  mission,
  sessionId = null,
  disabled = false,
  onChange = () => {},
  onCommit = () => {},
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
  const [singlePlayerForceId, setSinglePlayerForceId] = useState<string>(
    sessionConfig.singlePlayerForceId ?? mission.forces[0]?._id ?? '',
  )

  /* -- EFFECTS -- */

  // componentDidUpdate
  useEffect(() => {
    sessionConfig.accessibility = accessibility
    sessionConfig.infiniteResources = infiniteResources
    sessionConfig.name = name
    sessionConfig.mode = mode
    sessionConfig.singlePlayerForceId = singlePlayerForceId || undefined
    onChange()
  }, [accessibility, infiniteResources, name, mode, singlePlayerForceId])

  /* -- FUNCTIONS -- */

  /**
   * Resolves a React setter argument, which may be a value or
   * an updater function, into a concrete value.
   * @param next The value or updater function.
   * @param previous The current value to apply an updater against.
   */
  const resolveValue = <Type,>(
    next: TReactSetterArg<Type>,
    previous: Type,
  ): Type =>
    typeof next === 'function'
      ? (next as (value: Type) => Type)(previous)
      : next

  /**
   * Updates the accessibility and commits the change.
   * @param next The new accessibility value or updater.
   */
  const changeAccessibility = (
    next: TReactSetterArg<TSessionAccessibility>,
  ) => {
    const value = resolveValue(next, accessibility)
    setAccessibility(value)
    onCommit({ accessibility: value })
  }

  /**
   * Updates the infinite-resources setting and commits the change.
   * @param next The new value or updater.
   */
  const changeInfiniteResources = (next: TReactSetterArg<boolean>) => {
    const value = resolveValue(next, infiniteResources)
    setInfiniteResources(value)
    onCommit({ infiniteResources: value })
  }

  /**
   * Updates the session mode and commits the change.
   * @param next The new mode value or updater.
   */
  const changeMode = (next: TReactSetterArg<TSessionMode>) => {
    const value = resolveValue(next, mode)
    setMode(value)
    onCommit({ mode: value })
  }

  /**
   * Updates the single-player force and commits the change.
   * @param next The new force ID value or updater.
   */
  const changeSinglePlayerForceId = (next: TReactSetterArg<string>) => {
    const value = resolveValue(next, singlePlayerForceId)
    setSinglePlayerForceId(value)
    onCommit({ singlePlayerForceId: value || undefined })
  }

  /**
   * Commits the session name on blur, falling back to the
   * mission name when left blank.
   */
  const commitName = () => {
    onCommit({ name: name.trim() || mission.name })
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * JSX for accessibility selection.
   */
  const accessibilityJsx = compute<TReactElement>(() => {
    if (accessibility === 'testing') {
      return <DetailLocked label='Accessibility' value='Testing' />
    } else {
      return (
        <DetailDropdown<TSessionConfig['accessibility']>
          label='Accessibility'
          options={['public', 'id-required']}
          value={accessibility}
          setValue={changeAccessibility}
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
        onBlur={commitName}
      />
      {accessibilityJsx}
      <DetailToggle
        label='Infinite Resources'
        value={infiniteResources}
        setValue={changeInfiniteResources}
        disabled={disabled}
      />
      <DetailDropdown<TSessionMode>
        label='Mode'
        options={['multiplayer', 'single-player']}
        value={mode}
        setValue={changeMode}
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
      {mode === 'single-player' && (
        <DetailDropdown<string>
          label='Force'
          options={mission.forces.map((force) => force._id)}
          value={singlePlayerForceId || (mission.forces[0]?._id ?? '')}
          setValue={changeSinglePlayerForceId}
          disabled={disabled}
          isExpanded={false}
          getKey={(forceId) => forceId}
          render={(forceId) =>
            mission.getForceById(forceId)?.name ?? 'Unknown Force'
          }
          fieldType='required'
          handleInvalidOption={{
            method: 'setToDefault',
            defaultValue: mission.forces[0]?._id ?? '',
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
   * Callback for when the session config is changed.
   * @default () => {}
   */
  onChange?: () => void
  /**
   * Callback to persist a config change. Non-text fields commit on
   * change; the session name commits on blur. Can be used for auto-save.
   * @default () => {}
   */
  onCommit?: (updates: Partial<TSessionConfig>) => void
}
