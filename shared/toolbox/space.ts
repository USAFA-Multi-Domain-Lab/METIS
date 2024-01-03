/**
 * Represents a vector in 1D space.
 */
export class Vector1D {
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
   * Handler for when the vector changes.
   */
  private onChange: () => void

  /**
   * @param x The x coordinate of the vector.
   */
  public constructor(x: number, options: TVector1DOptions = {}) {
    // Parse options
    const { onChange = () => {} } = options

    // Initialize fields.
    this._x = x
    this.onChange = onChange
  }

  /**
   * Translates the vector by the given coordinates.
   * @param x The x coordinate by which to translate.
   */
  public translate(x: number): void {
    this._x += x
    this.onChange()
  }

  // Overridden
  public toString(): string {
    return `[${this.x}]`
  }

  /**
   * A CSS rule that translates an element with the vector.
   */
  public get cssTranslation(): string {
    return `translate(${this.x}em)`
  }

  /**
   * A CSS rule that scales an element with the vector.
   */
  public get cssScale(): string {
    return `scale(${this.x})`
  }
}

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
   */
  public set(x: number, y: number): void {
    this._x = x
    this._y = y
    this.onChange()
  }

  /**
   * Translates the vector by the given coordinates.
   * @param x The x coordinate by which to translate.
   * @param y The y coordinate by which to translate.
   */
  public translate(x: number, y: number): void {
    this._x += x
    this._y += y
    this.onChange()
  }

  /**
   * Translates the x coordinate of the vector by the given amount.
   * @param x The amount by which to translate.
   */
  public translateX(x: number): void {
    this._x += x
    this.onChange()
  }

  /**
   * Translates the y coordinate of the vector by the given amount.
   * @param y The amount by which to translate.
   */
  public translateY(y: number): void {
    this._y += y
    this.onChange()
  }

  /**
   * Translates the vector by a given vector.
   * @param vector The vector by which to translate (If 1D, translates evenly).
   */
  public translateBy(vector: Vector1D | Vector2D): void {
    if (vector instanceof Vector1D) {
      this.x += vector.x
      this.y += vector.x
    } else {
      this.x += vector.x
      this.y += vector.y
    }
    this.onChange()
  }

  /**
   * Scales the vector by the given coordinates.
   * @param x The x coordinate by which to scale.
   * @param y The y coordinate by which to scale.
   */
  public scale(x: number, y: number): void {
    this._x *= x
    this._y *= y
    this.onChange()
  }

  /**
   * Scales the x coordinate of the vector by the given amount.
   * @param x The amount by which to scale.
   */
  public scaleX(x: number): void {
    this._x *= x
    this.onChange()
  }

  /**
   * Scales the y coordinate of the vector by the given amount.
   * @param y The amount by which to scale.
   */
  public scaleY(y: number): void {
    this._y *= y
    this.onChange()
  }

  /**
   * Scales the vector evenly by a given factor.
   * @param factor The factor by which to scale.
   */
  public scaleByFactor(factor: number): void {
    this._x *= factor
    this._y *= factor
    this.onChange()
  }

  /**
   * Scales the vector by a given vector.
   * @param vector The vector by which to scale (If 1D, scales evenly).
   */
  public scaleBy(vector: Vector1D | Vector3D): void {
    if (vector instanceof Vector1D) {
      this.x *= vector.x
      this.y *= vector.x
    } else {
      this._x *= vector.x
      this._y *= vector.y
      this.onChange()
    }
  }

  // Overridden
  public toString(): string {
    return `[${this.x}, ${this.y}]`
  }
}

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
    options: TVector2DOptions = {},
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
   */
  public set(x: number, y: number, z: number): void {
    this._x = x
    this._y = y
    this._z = z
    this.onChange()
  }

  /**
   * Translates the vector by the given coordinates.
   * @param x The x coordinate by which to translate.
   * @param y The y coordinate by which to translate.
   * @param z The z coordinate by which to translate.
   */
  public translate(x: number, y: number, z: number): void {
    this._x += x
    this._y += y
    this._z += z
    this.onChange()
  }

  /**
   * Translates the x coordinate of the vector by the given amount.
   * @param x The amount by which to translate.
   */
  public translateX(x: number): void {
    this._x += x
    this.onChange()
  }

  /**
   * Translates the y coordinate of the vector by the given amount.
   * @param y The amount by which to translate.
   */
  public translateY(y: number): void {
    this._y += y
    this.onChange()
  }

  /**
   * Translates the z coordinate of the vector by the given amount.
   * @param z The amount by which to translate.
   */
  public translateZ(z: number): void {
    this._z += z
    this.onChange()
  }

  /**
   * Translates the vector by a given vector.
   * @param vector The vector by which to translate (If 1D, translates evenly).
   */
  public translateBy(vector: Vector1D | Vector3D): void {
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
  }

  /**
   * Scales the vector by the given coordinates.
   * @param x The x coordinate by which to scale.
   * @param y The y coordinate by which to scale.
   * @param z The z coordinate by which to scale.
   */
  public scale(x: number, y: number, z: number): void {
    this._x *= x
    this._y *= y
    this._z *= z
    this.onChange()
  }

  /**
   * Scales the x coordinate of the vector by the given amount.
   * @param x The amount by which to scale.
   */
  public scaleX(x: number): void {
    this._x *= x
    this.onChange()
  }

  /**
   * Scales the y coordinate of the vector by the given amount.
   * @param y The amount by which to scale.
   */
  public scaleY(y: number): void {
    this._y *= y
    this.onChange()
  }

  /**
   * Scales the z coordinate of the vector by the given amount.
   * @param z The amount by which to scale.
   */
  public scaleZ(z: number): void {
    this._z *= z
    this.onChange()
  }

  /**
   * Scales the vector evenly by a given factor.
   * @param factor The factor by which to scale.
   */
  public scaleByFactor(factor: number): void {
    this._x *= factor
    this._y *= factor
    this._z *= factor
    this.onChange()
  }

  /**
   * Scales the vector by a given vector.
   * @param vector The vector by which to scale (If 1D, scales evenly).
   */
  public scaleBy(vector: Vector1D | Vector3D): void {
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
  }

  // Overridden
  public toString(): string {
    return `[${this.x}, ${this.y}, ${this.z}]`
  }
}

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

/**
 * Options for creating a 1D vector.
 */
export type TVector1DOptions = TCommonVectorOptions

/**
 * Options for creating a 2D vector.
 */
export type TVector2DOptions = TCommonVectorOptions

/**
 * Options for creating a 3D vector.
 */
export type TVector3DOptions = TCommonVectorOptions
