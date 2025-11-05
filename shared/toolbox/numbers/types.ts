export { TVector1DOptions } from './Vector1D'
export { TVector2DOptions } from './Vector2D'
export { TVector3DOptions } from './Vector3D'

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
