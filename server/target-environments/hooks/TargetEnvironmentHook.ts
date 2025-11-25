import type { TTargetEnvMethods } from '@shared/target-environments/EnvScriptResults'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TEnvHookExposedContext } from '../context/EnvHookContext'
import type { TargetEnvSchema } from '../schema/TargetEnvSchema'
import { ServerTargetEnvironment } from '../ServerTargetEnvironment'

/**
 * Houses a callback which can be invoked during the
 * lifecycle of a {@link SessionServer}.
 */
export class TargetEnvironmentHook {
  /**
   * Unique identifier for the hook.
   */
  public readonly _id: string

  /**
   * The target-environment instance associated with this hook.
   * @throws If the ID of the target-environment schema for
   * this hook does not correspond to a target-environment
   * registered in {@link ServerTargetEnvironment.REGISTRY}.
   */
  public get environment(): ServerTargetEnvironment {
    let value = ServerTargetEnvironment.REGISTRY.get(this.envSchema._id)

    if (!value) {
      throw new Error(
        `Cannot access "TargetEnvironmentHook.environment" field. No corresponding target-environment is registered for the schema stored in the hook.`,
      )
    }

    return value
  }

  /**
   * @param method @see {@link TargetEnvironmentHook.method}
   * @param callback @see {@link TargetEnvironmentHook.callback}
   */
  public constructor(
    /**
     * The method which defines when the hook
     * will be invoked.
     */
    public readonly method: TTargetEnvMethods,
    /**
     * The target-environment schema that created this hook.
     */
    public readonly envSchema: TargetEnvSchema,
    /**
     * The function to call when the hook is invoked.
     */
    private readonly callback: (
      context: TEnvHookExposedContext,
    ) => Promise<void>,
  ) {
    this._id = StringToolbox.generateRandomId()
  }

  /**
   * Calls the hook's callback function.
   */
  public invoke(context: TEnvHookExposedContext): Promise<void> {
    return this.callback(context)
  }
}
