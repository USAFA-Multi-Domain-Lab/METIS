import type { TCommonVectorOptions } from '.'
import { Vector1D } from './Vector1D'
import type { Vector3D } from './Vector3D'

/**
 * Represents a vector in 2D space.
 */
export class Vector2D {
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
   * Handler for when the vector changes.
   */
  private onChange: () => void

  /**
   * @param x The x coordinate of the vector.
   * @param y The y coordinate of the vector.
   * @param options Options for creating the vector.
   */
  public constructor(x: number, y: number, options: TVector2DOptions = {}) {
    // Parse options
    const { onChange = () => {} } = options

    // Initialize fields.
    this._x = x
    this._y = y
    this.onChange = onChange
  }

  /**
   * Sets the coordinates of the vector.
   * @param x The new x coordinate.
   * @param y The new y coordinate.
   * @returns `this`.
   */
  public set(x: number, y: number): Vector2D {
    this._x = x
    this._y = y
    this.onChange()
    return this
  }

  /**
   * Translates the vector by the given coordinates.
   * @param x The x coordinate by which to translate.
   * @param y The y coordinate by which to translate.
   * @returns `this`.
   */
  public translate(x: number, y: number): Vector2D {
    this._x += x
    this._y += y
    this.onChange()
    return this
  }

  /**
   * Translates the x coordinate of the vector by the given amount.
   * @param x The amount by which to translate.
   * @returns `this`.
   */
  public translateX(x: number): Vector2D {
    this._x += x
    this.onChange()
    return this
  }

  /**
   * Translates the y coordinate of the vector by the given amount.
   * @param y The amount by which to translate.
   * @returns `this`.
   */
  public translateY(y: number): Vector2D {
    this._y += y
    this.onChange()
    return this
  }

  /**
   * Translates the vector by a given vector.
   * @param vector The vector by which to translate (If 1D, translates evenly).
   * @returns `this`.
   */
  public translateBy(vector: Vector1D | Vector2D): Vector2D {
    if (vector instanceof Vector1D) {
      this.x += vector.x
      this.y += vector.x
    } else {
      this.x += vector.x
      this.y += vector.y
    }
    this.onChange()
    return this
  }

  /**
   * Scales the vector by the given coordinates.
   * @param x The x coordinate by which to scale.
   * @param y The y coordinate by which to scale.
   * @returns `this`.
   */
  public scale(x: number, y: number): Vector2D {
    this._x *= x
    this._y *= y
    this.onChange()
    return this
  }

  /**
   * Scales the x coordinate of the vector by the given amount.
   * @param x The amount by which to scale.
   * @returns `this`.
   */
  public scaleX(x: number): Vector2D {
    this._x *= x
    this.onChange()
    return this
  }

  /**
   * Scales the y coordinate of the vector by the given amount.
   * @param y The amount by which to scale.
   * @returns `this`.
   */
  public scaleY(y: number): Vector2D {
    this._y *= y
    this.onChange()
    return this
  }

  /**
   * Scales the vector evenly by a given factor.
   * @param factor The factor by which to scale.
   * @returns `this`.
   */
  public scaleByFactor(factor: number): Vector2D {
    this._x *= factor
    this._y *= factor
    this.onChange()
    return this
  }

  /**
   * Scales the vector by a given vector.
   * @param vector The vector by which to scale (If 1D, scales evenly).
   * @returns `this`.
   */
  public scaleBy(vector: Vector1D | Vector3D): Vector2D {
    if (vector instanceof Vector1D) {
      this.x *= vector.x
      this.y *= vector.x
    } else {
      this._x *= vector.x
      this._y *= vector.y
      this.onChange()
    }
    return this
  }

  // Overridden
  public toString(): string {
    return `[${this.x}, ${this.y}]`
  }

  /**
   * Clones the vector.
   * @param options Options passed to the constructor of the clone.
   * @returns The cloned vector.
   */
  public clone(options: TVector2DOptions = {}): Vector2D {
    return new Vector2D(this.x, this.y, options)
  }

  /**
   * @returns Whether the vector is located where the vector passed is located (Checks for equality in position).
   * @note If `Vector3D` is passed, the `z` coordinate is ignored.
   */
  public locatedAt(vector: Vector2D | Vector3D): boolean {
    return this.x === vector.x && this.y === vector.y
  }

  /**
   * Gets the sum of two vectors.
   * @param vectorA The first vector to add.
   * @param vectorB The second vector to add.
   * @returns The sum of the two vectors.
   */
  public static sum(vectorA: Vector2D, vectorB: Vector2D): Vector2D {
    return new Vector2D(vectorA.x + vectorB.x, vectorA.y + vectorB.y)
  }

  /**
   * Gets the difference between two vectors.
   * @param vectorA The vector from which to subtract.
   * @param vectorB The vector with which to subtract.
   * @returns The difference between the two vectors.
   */
  public static difference(vectorA: Vector2D, vectorB: Vector2D): Vector2D {
    return new Vector2D(vectorA.x - vectorB.x, vectorA.y - vectorB.y)
  }
}

/**
 * Options for creating a 2D vector.
 */
export type TVector2DOptions = TCommonVectorOptions
