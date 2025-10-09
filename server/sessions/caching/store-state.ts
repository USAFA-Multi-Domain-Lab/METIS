/**
 * Represents a piece of data in a store.
 */
export default class StoreState<T = any> {
  /**
   * @see {@link StoreState.value}
   */
  private _value: T

  /**
   * The value stored in this state.
   */
  public get value(): T {
    return this._value
  }
  public set value(newValue: T) {
    this._value = newValue
  }

  /**
   * @param initialValue The initial value for this state.
   */
  public constructor(initialValue: T) {
    this._value = initialValue
  }
}
