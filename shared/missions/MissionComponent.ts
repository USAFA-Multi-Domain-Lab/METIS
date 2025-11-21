import { MetisComponent } from '../MetisComponent'
import type { Mission } from './Mission'

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
  /**
   * The mission associated with the component.
   */
  public abstract get mission(): Self extends Mission<any> ? Self : T['mission']

  /**
   * The path to the component within the mission.
   */
  public abstract get path(): [...MissionComponent<any, any>[], Self]

  /**
   * The issues associated with the component that
   * need to be resolved by the designer of the mission.
   */
  public abstract get issues(): TMissionComponentIssue[]

  /**
   * Whether the component has some issue that needs to
   * be resolved by the designer of the mission. Added
   * context for the issue of the component can be found
   * by checking the `issues` field.
   */
  public get hasIssues(): boolean {
    return this.issues.length > 0
  }

  /**
   * Consolidates the issues from all components passed
   * into a single array.
   * @param components The components with potential issues.
   * @returns The issues.
   */
  public static consolidateIssues(
    ...components: MissionComponent<any, any>[]
  ): TMissionComponentIssue[] {
    return components.flatMap((component) => component.issues)
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
