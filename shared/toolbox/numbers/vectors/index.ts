/**
 * Common options for creating any type of vector.
 */
export type TCommonVectorOptions = {
  /**
   * Listener for changes to the vector.
   * @default () => {}
   */
  onChange?: () => void
}
