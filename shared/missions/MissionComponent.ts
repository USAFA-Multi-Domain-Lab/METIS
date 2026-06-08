import { MetisComponent } from '../MetisComponent'
import type { Mission } from './Mission'
import type { MissionComponentIssue } from './MissionComponentIssue'

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
    if (value === true) {
      for (let component of this.subComponents) {
        if (!component.deleted) component.delete()
      }
      this.sourceList.splice(this.sourceList.indexOf(this), 1)
    }
    super.deleted = value
    this.mission.issueRegistry.onDelete(this)
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
   * The exact list where this component is stored within
   * the mission. This list must be the actual list, not a
   * copy. Otherwise, operations such as {@link delete} won't
   * work correctly.
   */
  public abstract get sourceList(): MissionComponent<any, any>[]

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
   * Deletes the component by recursively deleting all sub-components,
   * removing it from {@link sourceList}, and marking {@link deleted} as `true`.
   */
  public delete(): void {
    this.deleted = true
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
