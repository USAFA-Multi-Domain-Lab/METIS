import { TargetEnvironmentHook } from '@server/target-environments/hooks/TargetEnvironmentHook'
import { ServerFileToolbox } from '@server/toolbox/files/ServerFileToolbox'
import type { TTargetEnvJson } from '@shared/target-environments/TargetEnvironment'
import type { TTargetEnvironmentMethods } from '@shared/target-environments/TargetEnvironmentTask'
import type { TEnvHookExposedContext } from '../context/EnvHookContext'

/**
 * Defines a target environment.
 */
export class TargetEnvSchema {
  /**
   * A registry of hooks associated with the target environment.
   */
  private _hooks: TargetEnvironmentHook[]

  /**
   * @see {@link TargetEnvSchema._hooks}
   * @note Returns the copy, not the original array.
   */
  public get hooks(): TargetEnvironmentHook[] {
    return [...this._hooks]
  }

  /**
   * The ID of the target environment.
   */
  public readonly _id: TTargetEnvJson['_id']

  /**
   * The name of the target environment.
   */
  private _name: TTargetEnvJson['name']
  public get name(): TTargetEnvJson['name'] {
    return this._name
  }

  /**
   * Describes what the target environment is.
   */
  private _description: TTargetEnvJson['description']
  public get description(): TTargetEnvJson['description'] {
    return this._description
  }

  /**
   * The current version of the target environment.
   */
  private _version: TTargetEnvJson['version']
  public get version(): TTargetEnvJson['version'] {
    return this._version
  }

  /**
   * The JSON representation of the targets in the environment.
   */
  private _targets: TTargetEnvJson['targets']
  public get targets(): TTargetEnvJson['targets'] {
    return this._targets
  }

  /**
   * Whether the environment supports a session running multiple
   * realms (standalone) against it simultaneously.
   * @note Absent in the manifest means `false`.
   */
  private _multiRealmSupport: boolean
  public get multiRealmSupport(): boolean {
    return this._multiRealmSupport
  }

  /**
   * @param options The data used to define the target environment.
   */
  private constructor(options: TTargetEnvSchemaOptions) {
    this._id = options._id
    this._name = options.name
    this._description = options.description
    this._version = options.version
    this._multiRealmSupport = options.multiRealmSupport ?? false
    this._targets = []
    this._hooks = []
  }

  /**
   * Creates a new {@link TargetEnvSchema} based on the options passed.
   * The environment's ID is the name of the folder holding the file
   * that made the call.
   *
   * @example
   * ```typescript
   * const AlertSystem = TargetEnvSchema.create({
   *   name: 'Alert System',
   *   description: 'Sends alerts to an external notification service.',
   *   version: '1.0.0',
   * })
   * ```
   */
  public static create(
    options: TTargetEnvSchemaCreateOptions,
  ): TargetEnvSchema {
    return new TargetEnvSchema({
      ...options,
      _id: ServerFileToolbox.getCallerFolder(),
    })
  }

  /**
   * Adds a hook to the target environment which will call
   * the provided callback when the specified method is invoked.
   * @param method The method for which the callback should be called.
   * @param callback The handler function to call when the method is invoked.
   */
  public on(
    method: TTargetEnvironmentMethods,
    callback: (context: TEnvHookExposedContext) => Promise<void>,
  ) {
    this._hooks.push(new TargetEnvironmentHook(method, this, callback))
  }

  /**
   * IDs that cannot be used as target environment IDs.
   */
  public static readonly RESERVED_IDS = ['INFER']
}

/* -- TYPES -- */

/**
 * Defines the target environment data.
 */
export interface TTargetEnvSchemaOptions extends Omit<
  TTargetEnvJson,
  'targets' | 'configs'
> {}

/**
 * Options for {@link TargetEnvSchema.create}.
 *
 * Like {@link TTargetEnvSchemaOptions} except that `_id` is left out,
 * because `create` fills it in with the folder the calling file sits in.
 */
export interface TTargetEnvSchemaCreateOptions extends Omit<
  TTargetEnvSchemaOptions,
  '_id'
> {}
