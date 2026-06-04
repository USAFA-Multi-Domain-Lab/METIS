import { MetisComponent } from '../MetisComponent'
import type { Mission } from './Mission'
import { MissionComponentIssueList } from './MissionComponentIssueList'

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
    this.issues.handle('deleted-is-set')
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
  public readonly issues: MissionComponentIssueList<typeof this>

  /**
   * Whether the component has some issue that needs to
   * be resolved by the designer of the mission.
   */
  public get hasIssues(): boolean {
    return !this.issues.isEmpty
  }

  public constructor(id: string, name: string, deleted: boolean) {
    super(id, name, deleted)
    this.issues = new MissionComponentIssueList(this)
    this.issues
      .when('deleted-is-set')
      .if(() => this.deleted)
      .include({
        key: 'deleted',
        message: `"${this.name}" has been marked as deleted.`,
      })
  }

  /**
   * @param message The message describing the issue.
   * @returns A new general issue object with the given message and the component as context.
   */
  public createIssue(
    message: string,
    options: TCreateIssueOptions = {},
  ): TMissionComponentIssue {
    let { type = 'general' } = options
    return {
      component: this,
      type,
      message,
    }
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

/**
 * Represents an issue with a mission component
 * that needs to be resolved by the designer in
 * order for the mission to function properly.
 */
export interface TMissionComponentIssue {
  /**
   * The component that has the issue.
   */
  component: MissionComponent<any, any>
  /**
   * The type of issue that is present.
   * This affects how the issue is handled.
   */
  type: 'general' | 'outdated'
  /**
   * The message describing the issue.
   */
  message: string
}

/**
 * Options for `createIssue` method.
 */
export interface TCreateIssueOptions {
  /**
   * The type of issue to create.
   * @default 'general'
   */
  type?: TMissionComponentIssue['type']
}
