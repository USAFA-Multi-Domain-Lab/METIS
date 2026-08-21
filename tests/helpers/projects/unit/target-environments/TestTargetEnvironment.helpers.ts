import { TargetEnvironment } from '@shared/target-environments/TargetEnvironment'
import { TargetEnvRegistry } from '@shared/target-environments/TargetEnvRegistry'
import type { TestTarget } from './targets/TestTarget.helpers'

/**
 * The registry the test classes are currently working against. Each test
 * starts its own through {@link TestTargetEnvironment.createRegistry}, so
 * no environment registered by one test is visible to the next.
 *
 * @note The registry is kept here in the file, outside the classes, rather
 * than passed to each one, because a test effect has nowhere to keep it.
 * `Effect` sets its target inside its own constructor, by calling
 * `determineTarget`, and a subclass only gets to assign its own properties
 * once that constructor has finished. A registry passed to `TestEffect`
 * would therefore still be unset at the moment the target is looked up, so
 * `determineTarget` reads the registry from this file instead of from the
 * effect.
 */
let activeRegistry = new TargetEnvRegistry()

/**
 * Minimal test `TargetEnvironment` that holds targets in-memory and
 * registers itself with the active registry.
 */
export class TestTargetEnvironment extends TargetEnvironment {
  public constructor(
    _id: TargetEnvironment['_id'],
    name: TargetEnvironment['name'],
    description: TargetEnvironment['description'],
    version: TargetEnvironment['version'],
    targets: TestTarget[] = [],
    multiRealmSupport: TargetEnvironment['multiRealmSupport'] = false,
  ) {
    super(_id, name, description, version, targets, multiRealmSupport)

    this.register()
  }

  public register(): this {
    activeRegistry.register(this)
    return this
  }

  /**
   * The registry every test environment registers itself with, and the one
   * a test effect resolves its target through. It stands in for the
   * registries the client and server each own.
   */
  public static get registry(): TargetEnvRegistry {
    return activeRegistry
  }

  /**
   * Starts a registry of its own for the test that calls it, leaving
   * behind everything an earlier test registered.
   * @note Call this from `beforeEach`, before building any environment.
   * @returns The new registry.
   */
  public static createRegistry(): TargetEnvRegistry {
    activeRegistry = new TargetEnvRegistry()
    return activeRegistry
  }
}
