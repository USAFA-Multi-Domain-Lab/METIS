import { MetisComponent } from '../MetisComponent'
import { StringToolbox } from '../toolbox/strings/StringToolbox'
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
    return this.mission.issueRegistry.getComponentIssues(this)
  }

  /**
   * Whether the component has some issue that needs to
   * be resolved by the designer of the mission.
   */
  public get hasIssues(): boolean {
    return this.issues.length > 0
  }

  /**
   * Whether this component is rendered within a subentry of its
   * super component in the inspector, rather than as its own entry.
   * When `true`, selecting this component will redirect to its super
   * component.
   * @note Override this in a subclass to specify that the component
   * uses a subentry.
   */
  public get usesSubentry(): boolean {
    return false
  }

  // Overridden
  public override get warningText(): string {
    let superText = super.warningText
    if (superText) return superText

    let issues = this.issues
    if (!issues.length) return ''
    let result = issues[0].message
    if (issues.length > 1) {
      let remaining = issues.length - 1
      result += `\n**(+${remaining} other issue${StringToolbox.s(remaining)})**`
    }
    return result
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

  /**
   * @param issueKey The identifier for the issue.
   * @returns Whether the component has the issue associated with the key.
   */
  public hasIssue(issueKey: string): boolean {
    return this.mission.issueRegistry.componentHasIssue(this, issueKey)
  }

  /**
   * @param triggerName The trigger to fire within the registry of the mission
   * associated with this component.
   */
  public triggerIssueCheck(triggerName: string): void {
    this.mission.issueRegistry.trigger(triggerName, this)
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
