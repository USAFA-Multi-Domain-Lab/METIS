/**
 * A list of HTML classes that can be manipulated
 * then joined into one string, which can be used
 * as the `class` attribute of an HTML element.
 */
export default class ClassList {
  /**
   * The list of classes.
   */
  private _classes: Set<string>
  /**
   * The list of classes, as an array.
   */
  public get classes(): string[] {
    return this._classes.values().toArray()
  }

  /**
   * The value to apply to the `class` attribute
   * of an HTML element.
   */
  public get value(): string {
    return this.toString()
  }

  /**
   * @param classes The initial list of classes.
   */
  public constructor(...classes: string[]) {
    this._classes = new Set<string>()
    // Use the `add` method to validate the classes.
    this.add(...classes)
  }

  /**
   * Adds one or more classes to the list
   * @param classes The classes to add.
   * @returns Itself for chaining.
   * @throws If a class is invalid.
   * @note Any duplicate classes will be ignored.
   */
  public add(...classes: string[]): ClassList {
    // Validate the classes before adding them.
    classes.forEach((cls) => {
      if (!ClassList.isValidClass(cls)) {
        throw new Error(`Invalid class: ${cls}`)
      }
    })

    // Add the classes.
    for (let cls of classes) this._classes.add(cls)

    return this
  }

  /**
   * Removes one or more classes from the list.
   * @param classes The classes to remove.
   * @returns Itself for chaining.
   */
  public remove(...classes: string[]): ClassList {
    for (let cls of classes) this._classes.delete(cls)
    return this
  }

  /**
   * Adds or removes classes based on a condition.
   * @param classes The class/classes to add or remove.
   * @param condition The condition to determine
   * @returns Itself for chaining.
   * whether to add or remove the classes. This condition
   * is passed to the `Boolean` constructor and then evaluated.
   * @example
   * ```ts
   * let classList = new ClassList('InitialClass')
   * // Adds 'Class1' and 'Class2' to the list.
   * classList.set(['Class1', 'Class2'], true)
   * console.log(classList.value) // 'InitialClass Class1 Class2'
   * // Removes 'Class1' and 'Class2' from the list.
   * classList.set(['Class1', 'Class2'], false)
   * console.log(classList.value) // 'InitialClass'
   * ```
   * @example
   * ```ts
   * const class1Enabled = true
   * const class1Impeded = false
   * let classList = new ClassList('InitialClass')
   * // Adds 'Class1' to the list if the condition
   * // is met, otherwise removing it.
   * classList.set('Class1', class1Enabled && !class1Impeded)
   * console.log(classList.value) // 'InitialClass Class1'
   */
  public set(classes: string | string[], condition: any): ClassList {
    if (typeof classes === 'string') classes = [classes]
    if (Boolean(condition)) this.add(...classes)
    else this.remove(...classes)
    return this
  }

  /**
   * Binary implementation of the `switch` method.
   * @see {@link ClassList.switch}
   */
  private switchBinary(
    trueClass: string,
    falseClass: string,
    condition: any,
  ): ClassList {
    if (Boolean(condition)) {
      this.add(trueClass)
      this.remove(falseClass)
    } else {
      this.add(falseClass)
      this.remove(trueClass)
    }
    return this
  }

  private switchMany<
    TLiteral extends keyof TMap,
    TMap extends { [key: string]: string },
  >(map: TMap, literal: TLiteral): ClassList {
    Object.keys(map).forEach((key: string) => {
      if (key === literal) this.add(map[key])
      else this.remove(map[key])
    })
    return this
  }

  /**
   *
   * @param trueClass The class to add when the condition is true.
   * @param falseClass The class to add when the condition is false.
   * @param condition
   * @returns Itself for chaining.
   * @example
   * ```ts
   * let classList = new ClassList('InitialClass')
   *
   * // Use 'Class1' if condition is true, otherwise
   * // use 'Class2'.
   * classList.switch('Class1', 'Class2', true)
   * console.log(classList.value)
   * // Output: 'InitialClass Class1'
   *
   * classList.switch('Class1', 'Class2', false)
   * console.log(classList.value)
   * // Output: 'InitialClass Class2'
   */
  public switch(
    trueClass: string,
    falseClass: string,
    condition: any,
  ): ClassList

  /**
   * Switches between various class names based on the
   * value of a union string literal.
   * @param map An object that maps a string literal
   * to a class name.
   * @param literal A string with a literal union type
   * which decides which class in the map to use, all
   * other classes will be removed.
   * @returns Itself for chaining.
   * @example
   * ```ts
   * let classList = new ClassList('InitialClass')
   *
   * // Use 'Class1', 'Class2' or 'Class3' based on the
   * // value of the string literal.
   * classList.switch({
   *  'use-class-1': 'Class1',
   *  'use-class-2': 'Class2',
   *  'use-class-3': 'Class3',
   * }, 'use-class-2')
   * console.log(classList.value)
   * // Output: 'InitialClass Class2'
   *
   * classList.switch({
   *  'use-class-1': 'Class1',
   *  'use-class-2': 'Class2',
   *  'use-class-3': 'Class3',
   * }, 'use-class-1')
   * console.log(classList.value)
   * // Output: 'InitialClass Class1'
   */
  public switch<
    TLiteral extends keyof TMap,
    TMap extends { [key: string]: string },
  >(map: TMap, literal: TLiteral): ClassList

  public switch(arg1: any, arg2: any, arg3?: any): ClassList {
    if (typeof arg1 === 'string') {
      return this.switchBinary(arg1, arg2, arg3)
    } else if (typeof arg1 === 'object') {
      return this.switchMany(arg1, arg2)
    } else {
      throw new Error('Invalid arguments')
    }
  }

  /**
   * Toggles a class in the list.
   * @param cls The class to toggle.
   * @returns Itself for chaining.
   */
  public toggle(cls: string): ClassList {
    if (this._classes.has(cls)) this.remove(cls)
    else this.add(cls)
    return this
  }

  /**
   * Joins the classes into one string.
   * @returns The string of classes.
   */
  public toString(): string {
    return this._classes.values().toArray().join(' ')
  }

  /**
   * Validates the given class, ensuring it
   * can be used in HTML.
   * @param cls The class to validate.
   * @returns Whether the class is valid.
   */
  public static isValidClass(cls: string): boolean {
    return cls.match(/^[a-zA-Z0-9_-]+$/) !== null
  }
}
