import Mission from '.'
import { MetisComponent, TMetisBaseComponents } from '..'

/**
 * An object that makes up a part of a mission, including
 * a mission itself. Examples are nodes, actions, effects,
 * and so on.
 * @note Implement this to make a class compatible.
 */
export default abstract class MissionComponent<
  T extends TMetisBaseComponents,
  Self extends MissionComponent<T, Self>,
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
   * The defects associated with the component that
   * need to be resolved by the designer of the mission.
   */
  public abstract get defects(): TMissionComponentDefect[]

  /**
   * Whether the component has some issue that needs to
   * be resolved by the designer of the mission. Added
   * context for the defect of the component can be found
   * by checking the `defects` field.
   */
  public get defective(): boolean {
    return this.defects.length > 0
  }

  /**
   * Consolidates the defects from all components passed
   * into a single array.
   * @param components The components with potential defects.
   * @returns The defects.
   */
  public static consolidateDefects(
    ...components: MissionComponent<any, any>[]
  ): TMissionComponentDefect[] {
    return components.flatMap((component) => component.defects)
  }
}

/**
 * Represents an issue with a mission component
 * that needs to be resolved by the designer in
 * order for the mission to function properly.
 */
export interface TMissionComponentDefect {
  /**
   * The component that is defective.
   */
  component: MissionComponent<any, any>
  /**
   * The type of defect that is present.
   * This affects how the defect is handled.
   */
  type: 'general' | 'outdated'
  /**
   * The message describing the defect.
   */
  message: string
}
