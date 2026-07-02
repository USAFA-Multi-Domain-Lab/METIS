import type { TEffectTrigger } from '../missions/effects/Effect'
import type { TargetEnvironment } from './TargetEnvironment'
import type { TargetEnvRegistry } from './TargetEnvRegistry'

/**
 * Information pertaining to the results of a
 * target-environment-related script being executed.
 */
export class EnvScriptResults<
  TStatus extends TEnvHookResultStatus = TEnvHookResultStatus,
> {
  private constructor(
    /**
     * The environment to which these results pertain.
     */
    public readonly environment: TargetEnvironment,
    /**
     * The status which indicates the results
     * of the script call.
     */
    public readonly status: TselectEnvResultData[TStatus]['status'],
    /**
     * The error which caused the script to fail.
     * @note This will be null if the status is
     * not 'failure'.
     */
    public readonly error: TselectEnvResultData[TStatus]['error'],
    /**
     * Describes what produced these results (a lifecycle hook or an
     * effect), including the context needed to present them.
     */
    public readonly source: TEnvScriptSource,
  ) {}

  /**
   * @returns The JSON-serializable representation of the
   * script results.
   */
  public toJson(): TEnvScriptResultJson {
    let json: TEnvScriptResultJson = {
      status: this.status,
      environmentId: this.environment._id,
      error: null,
      source: this.source,
    }

    // Include error details if present.
    if (this.error) {
      json.error = {
        name: this.error.name,
        message: this.error.message,
        stack: this.error.stack,
        code: this.error?.code,
      }
    }

    return json
  }

  /**
   * Creates an instance of {@link EnvScriptResults} from
   * its JSON-serializable representation.
   * @param json The JSON-serializable representation.
   * @param registry The target environment registry
   * from which to retrieve the environment instances.
   */
  public static fromJson(
    json: TEnvScriptResultJson,
    registry: TargetEnvRegistry,
  ): EnvScriptResults {
    // Gather information.
    let { source, status, error: errorData } = json
    let environment = registry.get(json.environmentId)
    let error: TEnvScriptError | null = null

    // If error data was provided, reconstruct the error.
    if (errorData) {
      error = new Error(errorData.message)
      error.name = errorData.name
      error.stack = errorData.stack
      error.code = errorData.code
    }

    // Ensure the environment was found.
    if (!environment) {
      throw new Error(
        `Environment with ID "${json.environmentId}" not found within registry provided.`,
      )
    }

    return new EnvScriptResults(environment, status, error, source)
  }

  /**
   * Creates a successful instance of {@link EnvScriptResults}.
   * @param environment The environment to which these results pertain.
   * @param source The source that produced the results.
   */
  public static success(
    environment: TargetEnvironment,
    source: TEnvScriptSource,
  ): EnvScriptResults<'success'> {
    return new EnvScriptResults<'success'>(environment, 'success', null, source)
  }

  /**
   * Creates a failed instance of {@link EnvScriptResults}.
   * @param environment The environment to which these results pertain.
   * @param error The error which caused the script to fail.
   * @param source The source that produced the results.
   */
  public static failure(
    environment: TargetEnvironment,
    error: TEnvScriptError,
    source: TEnvScriptSource,
  ): EnvScriptResults<'failure'> {
    return new EnvScriptResults<'failure'>(
      environment,
      'failure',
      error,
      source,
    )
  }

  /**
   * Creates a skipped instance of {@link EnvScriptResults}.
   * @param environment The environment to which these results pertain.
   * @param source The source that produced the results.
   */
  public static skipped(
    environment: TargetEnvironment,
    source: TEnvScriptSource,
  ): EnvScriptResults<'skipped'> {
    return new EnvScriptResults<'skipped'>(environment, 'skipped', null, source)
  }
}

/* -- TYPES -- */

/**
 * Valid statuses for {@link EnvScriptResults}.
 */
export type TEnvHookResultStatus = 'success' | 'failure' | 'skipped'

/**
 * Data needed when status is 'success'.
 */
export type TEnvHookSuccessData = {
  /**
   * The status which indicates the results
   * of the script invocation.
   */
  status: 'success'
  /**
   * The error which caused the script to fail.
   */
  error: null
}

/**
 * Data needed when status is 'failure'.
 */
export type TEnvHookFailureData = {
  /**
   * The status which indicates the results
   * of the script invocation.
   */
  status: 'failure'
  /**
   * The error which caused the script to fail.
   */
  error: TEnvScriptError
}

/**
 * Data needed when status is 'skipped'.
 */
export type TEnvHookSkippedData = {
  /**
   * The status which indicates the results
   * of the script call.
   */
  status: 'skipped'
  /**
   * The error which caused the script to fail.
   */
  error: null
}

/**
 * Mapping of statuses to data types, allowing the
 * selection of the data type based on the status.
 */
export type TselectEnvResultData = {
  success: TEnvHookSuccessData
  failure: TEnvHookFailureData
  skipped: TEnvHookSkippedData
}

/**
 * Serializable representation of {@link EnvScriptResults}.
 */
export type TEnvScriptResultJson = {
  /**
   * Indicates the status of the result such as
   * if it was successful, failed, or skipped.
   * @see {@link TEnvHookResultStatus}
   */
  status: TEnvHookResultStatus
  /**
   * The ID of the environment to which these results pertain.
   */
  environmentId: string
  /**
   * The error which caused the script to fail, if any.
   */
  error: TEnvScriptError | null
  /**
   * Describes what produced these results, if known.
   * @see {@link TEnvScriptSource}
   */
  source: TEnvScriptSource
}

/**
 * Describes the origin of an {@link EnvScriptResults}, carrying the
 * contextual details needed to present the result to authorized users.
 * @options
 * - `'hook'` for lifecycle hooks (setup/teardown)
 * - `'effect'` for effects.
 */
export type TEnvScriptSource =
  | {
      /**
       * Indicates the result came from a target-environment lifecycle hook.
       */
      kind: 'hook'
      /**
       * The lifecycle method the hook belongs to.
       */
      method: TTargetEnvMethods
    }
  | {
      /**
       * Indicates the result that came from an effect.
       */
      kind: 'effect'
      /**
       * The name of the effect that was applied.
       */
      effectName: string
      /**
       * The name of the target the effect was applied to.
       */
      targetName: string
      /**
       * The trigger that caused the effect to be applied.
       */
      trigger: TEffectTrigger
    }

/**
 * Valid methods for target-environment hooks.
 */
export type TTargetEnvMethods = 'environment-setup' | 'environment-teardown'

/**
 * Represents an error that occurred during the execution of a target script.
 */
export type TEnvScriptError = Error & {
  /**
   * The error code associated with the failure, if available.
   */
  code?: string
}
