import { MetisComponent } from '../MetisComponent'
import type { Mission } from './Mission'
import type { MissionComponentIssue } from './MissionComponentIssue'
import type { MissionComponentIssueRegistry } from './MissionComponentIssueRegistry'

/**
 * An object that makes up a part of a mission, including
 * a mission itself. Examples are nodes, actions, effects,
 * and so on.
 * @note Implement this to make a class compatible.
 */
export abstract class MissionComponent<
  T extends TMetisBaseComponents = TMetisBaseComponents,
  Self extends MissionComponent<T, Self> = MissionComponent<T, any>,
> extends MetisComponent {
  // Overridden
  public set deleted(value: boolean) {
    super.deleted = value
    this.mission.issueRegistry.trigger('deleted-is-set', this)
  }

  /**
   * The mission associated with the component.
   */
  public abstract get mission(): Self extends Mission<any> ? Self : T['mission']

  /**
   * The path to the component within the mission.
   */
  public abstract get path(): [...MissionComponent<any, any>[], Self]

  /**
   * The component from which this component descends in the
   * mission hierarchy.
   * @note This will be `null` for the mission root.
   */
  public abstract get superComponent(): MissionComponent<any, any> | null

  /**
   * The components that directly descend from this component
   * in the mission hierarchy.
   */
  public abstract get subComponents(): MissionComponent<any, any>[]

  /**
   * Issues associated with the component that need to be resolved.
   */
  public get issues(): MissionComponentIssue<this>[] {
    return this.mission.issueRegistry.getFor(this)
  }

  /**
   * Whether the component has some issue that needs to
   * be resolved by the designer of the mission.
   */
  public get hasIssues(): boolean {
    return this.issues.length > 0
  }

  public constructor(id: string, name: string, deleted: boolean) {
    super(id, name, deleted)
    // Defer initial issue check to ensure all
    // components are constructed and registered.
    queueMicrotask(() =>
      this.mission.issueRegistry.trigger('initialization', this),
    )
  }

  /**
   * Registers issue checkers common to all {@link MissionComponent} instances
   * with the provided registry.
   * @param registry The registry to register checkers with.
   */
  public static registerIssueCheckers(
    registry: MissionComponentIssueRegistry,
  ): void {
    registry.check({
      key: 'deleted',
      message: (component) => `"${component.name}" has been marked as deleted.`,
      what: [MissionComponent],
      when: ['initialization', 'deleted-is-set'],
      if: (component) => component.deleted,
    })
  }
}

/* -- TYPES -- */

/**
 * Defines the type for the `path` property
 * of a mission component.
 */
export type TMissionComponentPath<
  T extends TMetisBaseComponents,
  Self extends MissionComponent<T, Self>,
> = [...MissionComponent<any, any>[], Self]
