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
   * @throws If a class is invalid.
   * @note Any duplicate classes will be ignored.
   */
  public add(...classes: string[]): void {
    // Validate the classes before adding them.
    classes.forEach((cls) => {
      if (!ClassList.isValidClass(cls)) {
        throw new Error(`Invalid class: ${cls}`)
      }
    })

    // Add the classes.
    for (let cls of classes) this._classes.add(cls)
  }

  /**
   * Removes one or more classes from the list.
   * @param classes The classes to remove.
   */
  public remove(...classes: string[]): void {
    for (let cls of classes) this._classes.delete(cls)
  }

  /**
   * Adds or removes classes based on a condition.
   * @param classes The class/classes to add or remove.
   * @param condition The condition to determine
   * whether to add or remove the classes.
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
  public set(classes: string | string[], condition: boolean): void {
    if (typeof classes === 'string') classes = [classes]
    if (condition) this.add(...classes)
    else this.remove(...classes)
  }

  /**
   * Toggles a class in the list.
   * @param cls The class to toggle.
   */
  public toggle(cls: string): void {
    if (this._classes.has(cls)) this.remove(cls)
    else this.add(cls)
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
