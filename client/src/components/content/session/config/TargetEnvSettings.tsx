import type { ClientMission } from '@client/missions/ClientMission'
import type { ClientTargetEnvironment } from '@client/target-environments/ClientTargetEnvironment'
import { compute } from '@client/toolbox'
import { useMountHandler } from '@client/toolbox/hooks'
import type { TSessionConfig } from '@shared/sessions/MissionSession'
import type { TTargetEnvConfig } from '@shared/target-environments/types'
import { useEffect, useState } from 'react'
import { DetailToggle } from '../../form/DetailToggle'
import { DetailDropdown } from '../../form/dropdown'
import If from '../../util/If'
import './TargetEnvSettings.scss'

/**
 * Allows the modification of target environment settings
 * within a session config.
 */
export default function TargetEnvSettings({
  sessionConfig,
  mission,
  onChange = () => {},
}: TTargetEnvSettings_P): TReactElement | null {
  /* -- STATE -- */
  const [disabledTargetEnvs, setDisabledTargetEnvs] = useState<string[]>(
    sessionConfig.disabledTargetEnvs,
  )
  const [targetEnvConfigs, setTargetEnvConfigs] = useState(
    sessionConfig.targetEnvConfigs,
  )

  /* -- EFFECTS -- */

  const [mounted] = useMountHandler((done) => {
    // Initialize with first config for each target environment if not already set
    const configs = { ...targetEnvConfigs }
    for (const targetEnv of mission.targetEnvironments) {
      if (targetEnv.configs.length && !configs[targetEnv._id]) {
        configs[targetEnv._id] = targetEnv.configs[0]._id
      }
    }
    setTargetEnvConfigs(configs)
    done()
  })

  // componentDidUpdate
  useEffect(() => {
    sessionConfig.disabledTargetEnvs = disabledTargetEnvs
    sessionConfig.targetEnvConfigs = targetEnvConfigs
    onChange()
  }, [disabledTargetEnvs, targetEnvConfigs])

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
    if (isEnabled) {
      setDisabledTargetEnvs([...disabledTargetEnvs, targetEnv._id])
    } else {
      setDisabledTargetEnvs(
        disabledTargetEnvs.filter((id) => id !== targetEnv._id),
      )
    }
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
    setTargetEnvConfigs({
      ...targetEnvConfigs,
      [targetEnv._id]: config._id,
    })
  }

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * JSX for target environment configuration settings.
   */
  const envConfigContent = compute<TReactElement[]>(() => {
    return mission.targetEnvironments.map((targetEnv) => {
      // Determine if the target environment is enabled.
      const isEnabled = !disabledTargetEnvs.includes(targetEnv._id)
      // Determine the selected configuration for the target environment.
      const configId = targetEnvConfigs[targetEnv._id]
      const selectedConfig =
        targetEnv.configs.find((cfg) => cfg._id === configId) ??
        targetEnv.configs[0]

      // Render
      return (
        <div key={targetEnv._id} className='EnvConfig'>
          <DetailToggle
            label={`${targetEnv.name}`}
            value={isEnabled}
            setValue={() => toggleEnabled(targetEnv)}
          />

          <If condition={targetEnv.configs.length}>
            <DetailDropdown<TTargetEnvConfig>
              label='Configuration'
              options={targetEnv.configs}
              disabled={!isEnabled}
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
          </If>
        </div>
      )
    })
  })

  /* -- RENDER -- */

  return (
    <If condition={mounted && mission.targetEnvironments.length}>
      <div className='TargetEnvSettings'>
        <div className='EnvTitle'>Target Environments</div>
        <div className='EnvDescription'>
          Enable or disable effects for each target environment. When enabled,
          select which configuration to use.
        </div>
        <div className='EnvActions'>
          <button
            type='button'
            className='ActionButton'
            disabled={allTargetEnvsEnabled}
            onClick={enableAll}
          >
            Enable All
          </button>
          <button
            type='button'
            className='ActionButton'
            disabled={allTargetEnvsDisabled}
            onClick={disableAll}
          >
            Disable All
          </button>
        </div>
        {envConfigContent}
      </div>
    </If>
  )
}

/* -- types -- */

/**
 * Props for the `TargetEnvSettings` component.
 */
type TTargetEnvSettings_P = {
  /**
   * The session config to modify.
   */
  sessionConfig: TSessionConfig
  /**
   * The mission to which the target environments belong.
   */
  mission: ClientMission
  /**
   * Callback for when the session config is changed.
   * @default () => {}
   */
  onChange?: () => void
}
