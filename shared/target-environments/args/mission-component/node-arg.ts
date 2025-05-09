/**
 * The node argument type for a target.
 */
export default class NodeArg {
  /**
   * The key used in the effect's arguments to reference the node's local key.
   */
  public static readonly NODE_KEY = 'nodeKey'

  /**
   * The key used in the effect's arguments to reference the node's name.
   */
  public static readonly NODE_NAME = 'nodeName'
}

/* ------------------------------ NODE ARGUMENT TYPES ------------------------------ */

/**
 * The possible metadata schema for a node target-argument
 * that is present in an effect's arguments.
 */
export type TNodeMetadata = Partial<{
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
}>
