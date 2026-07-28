import type { ClientMission } from '@client/missions/ClientMission'
import type { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { compute } from '@client/toolbox'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useState } from 'react'
import { DetailToggle } from '../../form/DetailToggle'
import { DetailDropdown } from '../../form/dropdowns/standard/DetailDropdown'
import type { TToggleLockState } from '../../user-controls/Toggle'
import './TargetEnvironmentConfig.scss'
import { useConfigUpdater } from './useConfigUpdater'

/**
 * Allows the modification of target environment settings
 * within a session config.
 */
export default function TargetEnvironmentConfig({
  sessionConfig,
  mission,
  disabled = false,
  approveChange = () => true,
  onChange = () => {},
}: TTargetEnvConfig_P): TReactElement | null {
  /* -- STATE -- */

  const [explicitlyDisabled, setExplicitlyDisabled] = useState<string[]>(
    sessionConfig.explicitlyDisabledEnvironments,
  )
  const [targetEnvConfigs, setTargetEnvConfigs] = useState(() => {
    // Default each target environment to its first configuration
    // when the session config does not already specify one.
    const configs = { ...sessionConfig.targetEnvConfigs }
    for (const targetEnv of mission.targetEnvironments) {
      if (targetEnv.configs.length && !configs[targetEnv._id]) {
        configs[targetEnv._id] = targetEnv.configs[0]._id
      }
    }
    return configs
  })

  const { useProcessUpdater } = useConfigUpdater(
    sessionConfig,
    approveChange,
    onChange,
  )

  /* -- EFFECTS -- */

  useProcessUpdater(
    'explicitlyDisabledEnvironments',
    explicitlyDisabled,
    setExplicitlyDisabled,
  )
  useProcessUpdater('targetEnvConfigs', targetEnvConfigs, setTargetEnvConfigs)

  /* -- COMPUTED -- */

  /**
   * The effective set of disabled environments: the manager's explicit
   * choices unioned with any the current mode disables implicitly (in
   * standalone, environments without multi-realm support). Derived from
   * the live explicit selection, so it never goes stale and needs no
   * config broadcast to stay correct.
   */
  const disabledTargetEnvs = compute<string[]>(() =>
    mission.getDisabledEnvironments({
      ...sessionConfig,
      explicitlyDisabledEnvironments: explicitlyDisabled,
    }),
  )

  /**
   * Whether no target environment is explicitly disabled. Environments
   * the session mode has disabled do not count, since enabling all
   * cannot lift those.
   */
  const allTargetEnvsExplicitlyEnabled = compute<boolean>(
    () => explicitlyDisabled.length === 0,
  )

  /**
   * Whether every target environment is explicitly disabled, which is
   * the state disabling all produces.
   */
  const allTargetEnvsExplicitlyDisabled = compute<boolean>(
    () => explicitlyDisabled.length === mission.targetEnvironments.length,
  )

  /* -- FUNCTIONS -- */

  /**
   * Whether the session mode has disabled the given target environment,
   * which the manager cannot lift.
   * @param targetEnv The target environment to check.
   * @returns Whether the mode has disabled it.
   */
  const isLockedByMode = (targetEnv: ClientTargetEnvironment): boolean =>
    sessionConfig.mode === 'standalone' && !targetEnv.multiRealmSupport

  /**
   * Toggles whether the given target environment is enabled.
   * @param targetEnv The target environment to toggle.
   */
  const toggleEnabled = (targetEnv: ClientTargetEnvironment) => {
    if (isLockedByMode(targetEnv)) return
    let isEnabled = !disabledTargetEnvs.includes(targetEnv._id)
    let next = isEnabled
      ? [...explicitlyDisabled, targetEnv._id]
      : explicitlyDisabled.filter((id) => id !== targetEnv._id)
    setExplicitlyDisabled(next)
  }

  /**
   * Disables all target environments for this session.
   */
  const disableAll = () => {
    if (allTargetEnvsExplicitlyDisabled) return
    let allIds = mission.targetEnvironments.map((env) => env._id)
    setExplicitlyDisabled(allIds)
  }

  /**
   * Enables all target environments for this session.
   */
  const enableAll = () => {
    if (allTargetEnvsExplicitlyEnabled) return
    setExplicitlyDisabled([])
  }

  /**
   * Selects the configuration for the given target environment.
   * @param newValue The new configuration value or updater function.
   * @param selectedConfig The currently selected configuration.
   * @param targetEnv The target environment for which the configuration is selected.
   */
  const selectEnvConfig = (
    newValue: TReactSetterArg<TTargetEnvConfig>,
    selectedConfig: TTargetEnvConfig,
    targetEnv: ClientTargetEnvironment,
  ): void => {
    // Determine the new configuration.
    const config =
      typeof newValue === 'function' ? newValue(selectedConfig) : newValue

    // Update the list of target environment configs
    // in the session config.
    const next = {
      ...targetEnvConfigs,
      [targetEnv._id]: config._id,
    }
    setTargetEnvConfigs(next)
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * JSX for target environment configuration settings.
   */
  const envConfigContent = compute<TReactElement[]>(() => {
    return mission.targetEnvironments.map((targetEnv) => {
      // Determine if the target environment is enabled.
      let targetEnvironmentDisabled = disabledTargetEnvs.includes(targetEnv._id)
      // Determine the selected configuration for the target environment.
      let configId = targetEnvConfigs[targetEnv._id]
      let selectedConfig =
        targetEnv.configs.find((config) => config._id === configId) ??
        targetEnv.configs[0]
      let lockedByMode = isLockedByMode(targetEnv)
      let toggleLockState: TToggleLockState = lockedByMode
        ? 'locked-deactivation'
        : 'unlocked'
      let classes = new ClassList('EnvironmentConfigContent').set(
        'LockedWithNoRealmSupport',
        lockedByMode,
      )

      // Render
      return (
        <div key={targetEnv._id} className={classes.value}>
          <DetailToggle
            label={`${targetEnv.name}`}
            value={!targetEnvironmentDisabled}
            setValue={() => toggleEnabled(targetEnv)}
            disabled={disabled}
            lockState={toggleLockState}
          />
          {targetEnv.configs.length > 0 && (
            <DetailDropdown<TTargetEnvConfig>
              label='Configuration'
              options={targetEnv.configs}
              disabled={disabled || targetEnvironmentDisabled}
              value={selectedConfig}
              setValue={(newValue) =>
                selectEnvConfig(newValue, selectedConfig, targetEnv)
              }
              getKey={({ _id }) => _id}
              render={({ name }) => name}
              fieldType='required'
              handleInvalidOption={{
                method: 'setToFirst',
              }}
            />
          )}
        </div>
      )
    })
  })

  /* -- RENDER -- */

  return (
    <>
      {mission.targetEnvironments.length > 0 && (
        <div className='TargetEnvironmentConfig'>
          <div className='EnvTitle'>Target Environments</div>
          <div className='EnvDescription'>
            Enable or disable effects for each target environment. When enabled,
            select which configuration to use.
          </div>
          <div className='EnvActions'>
            <button
              type='button'
              className='ActionButton'
              disabled={disabled || allTargetEnvsExplicitlyEnabled}
              onClick={enableAll}
            >
              Enable All
            </button>
            <button
              type='button'
              className='ActionButton'
              disabled={disabled || allTargetEnvsExplicitlyDisabled}
              onClick={disableAll}
            >
              Disable All
            </button>
          </div>
          {envConfigContent}
        </div>
      )}
    </>
  )
}

/* -- types -- */

/**
 * Props for the `TargetEnvConfig` component.
 */
type TTargetEnvConfig_P = {
  /**
   * The session config to modify.
   */
  sessionConfig: TSessionConfig
  /**
   * The mission to which the target environments belong.
   */
  mission: ClientMission
  /**
   * Whether all configuration options are locked from editing.
   * @default false
   */
  disabled?: boolean
  /**
   * Callback to approve or veto a pending config change before it is
   * committed.
   * @param updates The pending config updates.
   * @returns `true` or a promise resolving to `true` if the change is
   * approved, `false` or a promise resolving to `false` otherwise.
   * @default () => true
   */
  approveChange?: (
    updates: Partial<TSessionConfig>,
  ) => boolean | Promise<boolean>
  /**
   * Callback invoked after an approved change has been committed to the
   * session config, with the applied updates. Can be used for auto-save.
   * @param updates The applied config updates.
   * @param revert Undoes the applied updates, restoring the field and
   * the config to what they held before.
   * @default () => {}
   */
  onChange?: (updates: Partial<TSessionConfig>, revert: () => void) => void
}
