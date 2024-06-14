import { TCommonTargetEnvJson } from 'metis/target-environments'
import { TCommonTargetJson } from 'metis/target-environments/targets'

/**
 * Represents a target environment.
 */
export type TTargetEnv = Omit<TCommonTargetEnvJson, 'targets'>

/**
 * Represents a target.
 */
export type TTarget = TCommonTargetJson
