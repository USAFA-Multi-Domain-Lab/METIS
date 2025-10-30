export default class TargetEnvironmentHook {
  /**
   * The method which defines when the hook
   * will be invoked.
   */
  public readonly method: TTargetEnvMethods

  /**
   * The function to call when the hook is invoked.
   */
  private readonly callback: () => void | Promise<void>

  /**
   * @param method @see {@link TargetEnvironmentHook.method}
   * @param callback @see {@link TargetEnvironmentHook.callback}
   */
  public constructor(
    method: TTargetEnvMethods,
    callback: () => void | Promise<void>,
  ) {
    this.method = method
    this.callback = callback
  }

  /**
   * Calls the hook's callback function.
   */
  public invoke(): void | Promise<void> {
    return this.callback()
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
