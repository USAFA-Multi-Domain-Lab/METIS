import { TTargetEnvJson } from '.'
import { TMetisBaseComponents } from '..'

/**
 * A registry of all target environments installed in the
 * METIS instance.
 */
export default class TargetEnvRegistry<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> {
  /**
   * All registered environments.
   */
  private environments: Map<string, T['targetEnv']>

  /**
   * Whether the registry is populated with environments.
   * In other words, whether the registry has at least
   * one environment.
   */
  public get populated(): boolean {
    return this.environments.size > 0
  }

  /**
   * All registered targets.
   */
  public constructor() {
    this.environments = new Map()
  }

  /**
   * Registers a new environment in the registry.
   * @param environment The environment to register.
   * @note If the environment is already registered, a
   * warning will be logged and the registration will be
   * skipped.
   */
  public register(environment: T['targetEnv']): void {
    if (!this.has(environment)) {
      this.environments.set(environment._id, environment)
    } else {
      console.warn(
        `Environment with ID "${environment._id}" already exists in the registry. Skipping registration...`,
      )
    }
  }

  /**
   * @param environment The environment to check. This can
   * be the environment's ID or the environment itself.
   * @returns Whether the registry contains the given
   * environment.
   */
  public has(environment: string | T['targetEnv']): boolean {
    let id = typeof environment === 'string' ? environment : environment._id
    return this.environments.has(id)
  }

  /**
   * @param _id The ID of the environment.
   * @returns The environment with the provided ID,
   * or undefined if the environment cannot be found.
   */
  public get(_id: string | null | undefined): T['targetEnv'] | undefined {
    if (!_id) return undefined
    else return this.environments.get(_id)
  }

  /**
   * @returns All the environments in the registry.
   */
  public getAll(): Array<T['targetEnv']> {
    return Array.from(this.environments.values())
  }

  /**
   * @param targetId The ID of the target.
   * @param environmentId The ID of the environment.
   * @returns The target with the provided ID, in the
   * environment with the provided ID, or undefined if
   * the target cannot be found.
   */
  public getTarget(
    targetId: string | null | undefined,
    environmentId: string | null | undefined,
  ): T['target'] | undefined {
    let environment = this.get(environmentId)
    if (!environment) return undefined
    return environment.getTarget(targetId)
  }

  /**
   * Infers the target from the target ID.
   * @param targetId The ID of the target.
   * @returns The target with the provided ID,
   * or undefined if the target cannot be found.
   * @note If multiple targets with the same ID exist
   * in different environments, `undefined` will be
   * returned to be safe.
   */
  public inferTarget(targetId: string): T['target'] | undefined {
    let targetsFound: T['target'][] = []

    for (let environment of this.getAll()) {
      let target = environment.getTarget(targetId)
      if (target) targetsFound.push(target)
    }

    // Return a target, only if there is exactly one target
    // with the provided ID.
    if (targetsFound.length === 1) return targetsFound[0]
    else return undefined
  }

  /**
   * @param environmentId The ID of the environment.
   * @returns All the targets in the environment with the
   * provided ID, this will be an empty array if the
   * environment cannot be found, or if the environment
   * has no targets.
   */
  public getTargets(environmentId: string): Array<T['target']> {
    let environment = this.get(environmentId)
    if (!environment) return []
    else return [...environment.targets]
  }

  /**
   * Clears the registry of all environments.
   */
  public clear(): void {
    this.environments.clear()
  }

  /**
   * @returns All the environments in the registry as JSON.
   */
  public toJson(): TTargetEnvJson[] {
    return this.getAll().map((environment) => environment.toJson())
  }
}
