/**
 * The action argument type for a target.
 */
export default class ActionArg {
  /**
   * The key used in the effect's arguments to reference the action's local key.
   */
  public static readonly ACTION_KEY = 'actionKey'

  /**
   * The key used in the effect's arguments to reference the action's name.
   */
  public static readonly ACTION_NAME = 'actionName'
}

/* ------------------------------ ACTION ARGUMENT TYPES ------------------------------ */

/**
 * The possible metadata schema for an action target-argument
 * that is present in an effect's arguments.
 */
export type TActionMetadata = Partial<{
  /**
   * A force's local key.
   */
  forceKey: string
  /**
   * A force's name.
   */
  forceName: string
  /**
   * A node's local key.
   */
  nodeKey: string
  /**
   * A node's name.
   */
  nodeName: string
  /**
   * An action's local key.
   */
  actionKey: string
  /**
   * An action's name.
   */
  actionName: string
}>
