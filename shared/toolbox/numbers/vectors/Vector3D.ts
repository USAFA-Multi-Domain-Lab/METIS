import type { TCommonVectorOptions } from '.'
import { Vector1D } from './Vector1D'

/**
 * Represents a vector in 3D space.
 */
export class Vector3D {
  /**
   * The x coordinate of the vector.
   */
  private _x: number
  /**
   * The x coordinate of the vector.
   */
  public get x(): number {
    return this._x
  }
  public set x(value: number) {
    this._x = value
    this.onChange()
  }

  /**
   * The y coordinate of the vector.
   */
  private _y: number
  /**
   * The y coordinate of the vector.
   */
  public get y(): number {
    return this._y
  }
  public set y(value: number) {
    this._y = value
    this.onChange()
  }

  /**
   * The z coordinate of the vector.
   */
  private _z: number
  /**
   * The z coordinate of the vector.
   */
  public get z(): number {
    return this._z
  }
  public set z(value: number) {
    this._z = value
    this.onChange()
  }

  /**
   * Handler for when the vector changes.
   */
  private onChange: () => void

  /**
   * @param x The x coordinate of the vector.
   * @param y The y coordinate of the vector.
   * @param options Options for creating the vector.
   */
  public constructor(
    x: number,
    y: number,
    z: number,
    options: TVector3DOptions = {},
  ) {
    // Parse options
    const { onChange = () => {} } = options

    // Initialize fields.
    this._x = x
    this._y = y
    this._z = z
    this.onChange = onChange
  }

  /**
   * Sets the coordinates of the vector.
   * @param x The new x coordinate.
   * @param y The new y coordinate.
   * @param z The new z coordinate.
   * @returns `this`.
   */
  public set(x: number, y: number, z: number): Vector3D {
    this._x = x
    this._y = y
    this._z = z
    this.onChange()
    return this
  }

  /**
   * Translates the vector by the given coordinates.
   * @param x The x coordinate by which to translate.
   * @param y The y coordinate by which to translate.
   * @param z The z coordinate by which to translate.
   * @returns `this`.
   */
  public translate(x: number, y: number, z: number): Vector3D {
    this._x += x
    this._y += y
    this._z += z
    this.onChange()
    return this
  }

  /**
   * Translates the x coordinate of the vector by the given amount.
   * @param x The amount by which to translate.
   * @returns `this`.
   */
  public translateX(x: number): Vector3D {
    this._x += x
    this.onChange()
    return this
  }

  /**
   * Translates the y coordinate of the vector by the given amount.
   * @param y The amount by which to translate.
   * @returns `this`.
   */
  public translateY(y: number): Vector3D {
    this._y += y
    this.onChange()
    return this
  }

  /**
   * Translates the z coordinate of the vector by the given amount.
   * @param z The amount by which to translate.
   * @returns `this`.
   */
  public translateZ(z: number): Vector3D {
    this._z += z
    this.onChange()
    return this
  }

  /**
   * Translates the vector by a given vector.
   * @param vector The vector by which to translate (If 1D, translates evenly).
   * @returns `this`.
   */
  public translateBy(vector: Vector1D | Vector3D): Vector3D {
    if (vector instanceof Vector1D) {
      this.x += vector.x
      this.y += vector.x
      this.z += vector.x
    } else {
      this.x += vector.x
      this.y += vector.y
      this.z += vector.z
    }
    this.onChange()
    return this
  }

  /**
   * Scales the vector by the given coordinates.
   * @param x The x coordinate by which to scale.
   * @param y The y coordinate by which to scale.
   * @param z The z coordinate by which to scale.
   * @returns `this`.
   */
  public scale(x: number, y: number, z: number): Vector3D {
    this._x *= x
    this._y *= y
    this._z *= z
    this.onChange()
    return this
  }

  /**
   * Scales the x coordinate of the vector by the given amount.
   * @param x The amount by which to scale.
   * @returns `this`.
   */
  public scaleX(x: number): Vector3D {
    this._x *= x
    this.onChange()
    return this
  }

  /**
   * Scales the y coordinate of the vector by the given amount.
   * @param y The amount by which to scale.
   * @returns `this`.
   */
  public scaleY(y: number): Vector3D {
    this._y *= y
    this.onChange()
    return this
  }

  /**
   * Scales the z coordinate of the vector by the given amount.
   * @param z The amount by which to scale.
   * @returns `this`.
   */
  public scaleZ(z: number): Vector3D {
    this._z *= z
    this.onChange()
    return this
  }

  /**
   * Scales the vector evenly by a given factor.
   * @param factor The factor by which to scale.
   * @returns `this`.
   */
  public scaleByFactor(factor: number): Vector3D {
    this._x *= factor
    this._y *= factor
    this._z *= factor
    this.onChange()
    return this
  }

  /**
   * Scales the vector by a given vector.
   * @param vector The vector by which to scale (If 1D, scales evenly).
   * @returns `this`.
   */
  public scaleBy(vector: Vector1D | Vector3D): Vector3D {
    if (vector instanceof Vector1D) {
      this.x *= vector.x
      this.y *= vector.x
      this.z *= vector.x
    } else {
      this._x *= vector.x
      this._y *= vector.y
      this._z *= vector.z
      this.onChange()
    }
    return this
  }

  // Overridden
  public toString(): string {
    return `[${this.x}, ${this.y}, ${this.z}]`
  }

  /**
   * Clones the vector.
   * @param options Options passed to the constructor of the clone.
   * @returns The cloned vector.
   */
  public clone(options: TVector3DOptions = {}): Vector3D {
    return new Vector3D(this.x, this.y, this.z, options)
  }
}

/**
 * Options for creating a 3D vector.
 */
export type TVector3DOptions = TCommonVectorOptions
