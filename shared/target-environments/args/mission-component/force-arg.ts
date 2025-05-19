/**
 * The force argument type for a target.
 */
export default class ForceArg {
  /**
   * The key used in the effect's arguments to reference the force's local key.
   */
  public static readonly FORCE_KEY = 'forceKey'

  /**
   * The key used in the effect's arguments to reference the force's name.
   */
  public static readonly FORCE_NAME = 'forceName'
}

/* ------------------------------ FORCE ARGUMENT TYPES ------------------------------ */

/**
 * The possible metadata schema for a force target-argument
 * that is present in an effect's arguments.
 */
export type TForceMetadata = Partial<{
  /**
   * A force's local key.
   */
  forceKey: string
  /**
   * A force's name.
   */
  forceName: string
}>
