import type { ClientMission } from '@client/missions/ClientMission'
import type { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { compute } from '@client/toolbox'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import { useState } from 'react'
import { DetailToggle } from '../../form/DetailToggle'
import { DetailDropdown } from '../../form/dropdowns/standard/DetailDropdown'
import './TargetEnvironmentConfig.scss'
import { useConfigUpdater } from './useConfigUpdater'

/**
 * Allows the modification of target environment settings
 * within a session config.
 */
export default function TargetEnviromentConfig({
  sessionConfig,
  mission,
  disabled = false,
  approveChange = () => true,
  onChange = () => {},
}: TTargetEnvConfig_P): TReactElement | null {
  /* -- STATE -- */

  const [disabledTargetEnvs, setDisabledTargetEnvs] = useState<string[]>(
    sessionConfig.disabledTargetEnvs,
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
    'disabledTargetEnvs',
    disabledTargetEnvs,
    setDisabledTargetEnvs,
  )
  useProcessUpdater('targetEnvConfigs', targetEnvConfigs, setTargetEnvConfigs)

  /* -- COMPUTED -- */

  /**
   * Whether all target environments are enabled.
   */
  const allTargetEnvsEnabled = compute<boolean>(
    () => disabledTargetEnvs.length === 0,
  )

  /**
   * Whether all target environments are disabled.
   */
  const allTargetEnvsDisabled = compute<boolean>(
    () => disabledTargetEnvs.length === mission.targetEnvironments.length,
  )

  /* -- FUNCTIONS -- */

  /**
   * Toggles whether the given target environment is enabled.
   * @param targetEnv The target environment to toggle.
   */
  const toggleEnabled = (targetEnv: ClientTargetEnvironment) => {
    const isEnabled = !disabledTargetEnvs.includes(targetEnv._id)
    const next = isEnabled
      ? [...disabledTargetEnvs, targetEnv._id]
      : disabledTargetEnvs.filter((id) => id !== targetEnv._id)
    setDisabledTargetEnvs(next)
  }

  /**
   * Disables all target environments for this session.
   */
  const disableAll = () => {
    if (allTargetEnvsDisabled) return
    const allIds = mission.targetEnvironments.map((env) => env._id)
    setDisabledTargetEnvs(allIds)
  }

  /**
   * Enables all target environments for this session.
   */
  const enableAll = () => {
    if (allTargetEnvsEnabled) return
    setDisabledTargetEnvs([])
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
      const targetEnvironmentDisabled = disabledTargetEnvs.includes(
        targetEnv._id,
      )
      // Determine the selected configuration for the target environment.
      const configId = targetEnvConfigs[targetEnv._id]
      const selectedConfig =
        targetEnv.configs.find((config) => config._id === configId) ??
        targetEnv.configs[0]

      // Render
      return (
        <div key={targetEnv._id} className='EnvironmentConfigContent'>
          <DetailToggle
            label={`${targetEnv.name}`}
            value={!targetEnvironmentDisabled}
            setValue={() => toggleEnabled(targetEnv)}
            disabled={disabled}
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
              disabled={disabled || allTargetEnvsEnabled}
              onClick={enableAll}
            >
              Enable All
            </button>
            <button
              type='button'
              className='ActionButton'
              disabled={disabled || allTargetEnvsDisabled}
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
