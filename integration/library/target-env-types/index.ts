import { TCommonTargetEnvJson } from 'metis/target-environments'
import { TCommonTargetJson } from 'metis/target-environments/targets'

/**
 * Represents a target environment.
 */
export type TTargetEnv = Omit<TCommonTargetEnvJson, 'targets' | '_id'>

/**
 * Represents a target.
 */
export type TTarget = Omit<TCommonTargetJson, '_id' | 'targetEnvId'>
