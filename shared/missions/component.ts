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
   * Whether the component has some issue that needs to
   * be resolved by the designer of the mission. Added
   * context for the defect of the component can be found
   * by checking the `defectiveMessage` field.
   */
  public abstract get defective(): boolean
  /**
   * Provides additional context for why the component
   * is defective, assuming `defective` is true.
   */
  public abstract get defectiveMessage(): string
}
