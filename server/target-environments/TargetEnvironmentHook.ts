import { ServerTargetEnvironment } from './ServerTargetEnvironment'
import type { TEnvHookExposedContext } from './context/EnvHookContext'

export class TargetEnvironmentHook {
  /**
   * The method which defines when the hook
   * will be invoked.
   */
  public readonly method: TTargetEnvMethods

  /**
   * The function to call when the hook is invoked.
   */
  private readonly callback: (
    context: TEnvHookExposedContext,
  ) => void | Promise<void>

  /**
   * @param method @see {@link TargetEnvironmentHook.method}
   * @param callback @see {@link TargetEnvironmentHook.callback}
   */
  public constructor(
    method: TTargetEnvMethods,
    callback: (context: TEnvHookExposedContext) => void | Promise<void>,
  ) {
    this.method = method
    this.callback = callback
  }

  /**
   * Calls the hook's callback function.
   */
  public invoke(context: TEnvHookExposedContext): void | Promise<void> {
    return this.callback(context)
  }
}

/**
 * Valid methods for {@link ServerTargetEnvironment} event
 * listeners.
 */
export type TTargetEnvMethods =
  | 'environment-setup'
  | 'environment-teardown'
  | 'target-setup'
  | 'target-teardown'
