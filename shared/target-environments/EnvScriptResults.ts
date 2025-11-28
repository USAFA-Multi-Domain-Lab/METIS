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
    }

    // Include error details if present.
    if (this.error) {
      json.error = {
        name: this.error.name,
        message: this.error.message,
        stack: this.error.stack,
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
    let { status, error: errorData } = json
    let environment = registry.get(json.environmentId)
    let error: Error | null = null

    // If error data was provided, reconstruct the error.
    if (errorData) {
      error = new Error(errorData.message)
      error.name = errorData.name
      error.stack = errorData.stack
    }

    // Ensure the environment was found.
    if (!environment) {
      throw new Error(
        `Environment with ID "${json.environmentId}" not found within registry provided.`,
      )
    }

    return new EnvScriptResults(environment, status, error)
  }

  /**
   * Creates a successful instance of {@link EnvScriptResults}.
   * @param environment The environment to which these results pertain.
   */
  public static success(
    environment: TargetEnvironment,
  ): EnvScriptResults<'success'> {
    return new EnvScriptResults<'success'>(environment, 'success', null)
  }

  /**
   * Creates a failed instance of {@link EnvScriptResults}.
   * @param environment The environment to which these results pertain.
   * @param error The error which caused the script to fail.
   */
  public static failure(
    environment: TargetEnvironment,
    error: Error,
  ): EnvScriptResults<'failure'> {
    return new EnvScriptResults<'failure'>(environment, 'failure', error)
  }

  /**
   * Creates a skipped instance of {@link EnvScriptResults}.
   * @param environment The environment to which these results pertain.
   */
  public static skipped(
    environment: TargetEnvironment,
  ): EnvScriptResults<'skipped'> {
    return new EnvScriptResults<'skipped'>(environment, 'skipped', null)
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
  error: Error
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
  status: TEnvHookResultStatus
  environmentId: string
  error: {
    name: string
    message: string
    stack?: string
  } | null
}

/**
 * Valid methods for target-environment hooks.
 */
export type TTargetEnvMethods = 'environment-setup' | 'environment-teardown'
