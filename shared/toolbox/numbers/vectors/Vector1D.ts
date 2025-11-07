import type { TCommonVectorOptions } from '.'

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
   * @returns `this`.
   */
  public translate(x: number): Vector1D {
    this._x += x
    this.onChange()
    return this
  }

  /**
   * Clamps the vector to the given range.
   * @returns `this`.
   */
  public clamp(min: number | Vector1D, max: number | Vector1D): Vector1D {
    // Convert any vectors passed to numbers.
    if (min instanceof Vector1D) min = min.x
    if (max instanceof Vector1D) max = max.x

    // Grab previous x.
    const prevX = this._x

    // Clamp the vector.
    this._x = Math.max(min, Math.min(max, this._x))

    // If the vector changed, call the change handler.
    if (this._x !== prevX) this.onChange()

    // Return `this`.
    return this
  }

  // Overridden
  public toString(): string {
    return `[${this.x}]`
  }

  /**
   * Clones the vector.
   * @param options Options passed to the constructor of the clone.
   * @returns The cloned vector.
   */
  public clone(options: TVector1DOptions = {}): Vector1D {
    return new Vector1D(this.x, options)
  }
}

/**
 * Options for creating a 1D vector.
 */
export type TVector1DOptions = TCommonVectorOptions
