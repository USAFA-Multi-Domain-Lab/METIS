import { useEffect, useRef } from 'react'
import GlobalContext, { useGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { useForcedUpdates } from 'src/toolbox/hooks'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { defaultButtonSvgProps } from './ButtonSvg'
import { TButtonSvg_PK, TSvgLayout, TSvgPanelElement } from './types'

/**
 * An engine used to power a `ButtonSvgPanel`
 * component.
 */
export default class ButtonSvgEngine {
  /**
   * The panel elements (buttons and related components)
   * powered by the engine.
   */
  private _panelElements: TSvgPanelElement[] = []
  /**
   * The panel elements (buttons and related components)
   * powered by the engine.
   */
  public get panelElements(): TSvgPanelElement[] {
    return [...this._panelElements]
  }

  /**
   * The buttons powered by the engine.
   */
  public get buttons(): TButtonSvg_PK[] {
    return this._panelElements.filter(
      (element) => typeof element !== 'string',
    ) as TButtonSvg_PK[]
  }

  /**
   * The global context of the app.
   */
  private globalContext: GlobalContext

  /**
   * The layout used to display the buttons.
   * @default ['<slot>']
   */
  public layout: TSvgLayout

  /**
   * @see {@link ButtonSvgEngine.hasCustomLayout}
   */
  private _hasCustomLayout: boolean = false
  /**
   * Whether a custom layout has been set.
   * @default false
   */
  public get hasCustomLayout(): boolean {
    return this._hasCustomLayout
  }

  /**
   * Cannot be instantiated directly.
   * @param globalContext The global context of the app.
   * @param onChange The callback to call when the
   * global context changes.
   * @see {@link ButtonSvgEngine.use} hook.
   */
  private constructor(globalContext: GlobalContext, onChange: () => void) {
    this._panelElements = []
    this.globalContext = globalContext
    this.onChange = onChange
    this.layout = ['<slot>']
  }

  /**
   * @param icon The icon in question.
   * @returns Whether the given icon is being used
   * by one of the currently powered buttons.
   */
  private inUse(icon: TMetisIcon): boolean {
    return this.buttons.some((button) => {
      return button.icon === icon
    })
  }

  /**
   * Adds a button to the engine.
   * @param button The button to add.
   * @returns Itself for chaining.
   * @throws If the button icon is already in use.
   */
  public add(button: Omit<TButtonSvg_PK, 'key' | 'type'>): ButtonSvgEngine {
    let element: Required<TButtonSvg_PK> = {
      key: StringToolbox.generateRandomId(),
      type: 'button',
      ...defaultButtonSvgProps,
      ...button,
    }

    // Throw an error if the button is already in use.
    if (this.inUse(element.icon)) {
      throw new Error(`Button with icon "${button.icon}" is already in use.`)
    }

    this._panelElements.push(element)
    this.applyLayout()
    return this
  }

  /**
   * Removes a button from the engine.
   * @param icon The icon of the button to remove.
   * @returns Itself for chaining.
   */
  public remove(icon: TMetisIcon): ButtonSvgEngine {
    let buttonIndex = this.buttons.findIndex((button) => button.icon === icon)
    if (buttonIndex >= 0) {
      this._panelElements.splice(buttonIndex, 1)
      this.applyLayout()
    }
    return this
  }

  /**
   * Lays out an order and structure for the buttons
   * in the engine for how they are rendered in the panel.
   * @param layout The layout used on the buttons.
   * @returns Itself for chaining.
   * @example
   * ```ts
   * // Order of the buttons before:
   * // ['edit', 'add', 'zoom-in', 'zoom-out', 'remove']
   *
   * // Call `layout` method with the defined schema.
   * engine.layout('<slot>', 'add', 'edit', 'remove')
   *
   * // Order after: ['zoom-in', 'zoom-out', 'add', 'edit', 'remove']
   */
  public setLayout(...layout: TSvgLayout): ButtonSvgEngine {
    this.layout = layout
    this._hasCustomLayout = true
    this.applyLayout()
    return this
  }

  /**
   * Gets a button by its icon.
   * @param icon The icon of the button.
   * @returns The button with the given icon.
   */
  public getButton(icon: TMetisIcon): TButtonSvg_PK | undefined {
    return this.buttons.find((button) => button.icon === icon)
  }

  /**
   * Sets the given property for the button of the
   * given icon.
   * @param icon The icon of the button.
   * @param propKey The key of the property to set.
   * @param propValue The value of the property to set.
   * @returns Itself for chaining.
   */
  private setButtonProp<
    TPropKey extends keyof TButtonSvg_PK,
    TPropValue extends TButtonSvg_PK[TPropKey],
  >(
    icon: TMetisIcon,
    propKey: TPropKey,
    propValue: TPropValue,
  ): ButtonSvgEngine {
    let button = this.buttons.find((button) => button.icon === icon)
    if (button) button[propKey] = propValue
    this.onChange()
    return this
  }

  /**
   * Sets the description for the button of
   * the given icon.
   * @param icon The icon of the button.
   * @param description The description to set.
   * @returns Itself for chaining.
   */
  public setDescription(
    icon: TMetisIcon,
    description: string | null,
  ): ButtonSvgEngine {
    return this.setButtonProp(icon, 'description', description)
  }

  /**
   * Sets whether the button of the given icon
   * is disabled.
   * @param icon The icon of the button.
   * @param disabled Whether the button is disabled.
   * @returns Itself for chaining.
   */
  public setDisabled(icon: TMetisIcon, disabled: boolean): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', disabled)
  }

  /**
   * Enables a button.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   */
  public enable(icon: TMetisIcon): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', false)
  }

  /**
   * Disables a button.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   */
  public disable(icon: TMetisIcon): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', true)
  }

  /**
   * Callback for a global state update.
   * @param globalContext The updated global context for the app.
   */
  public onGlobalUpdate(globalContext: GlobalContext): void {
    this.globalContext = globalContext
  }

  /**
   * Applies the current layout to the current
   * set of SVG panel elements.
   */
  private applyLayout(): void {
    let layout = this.layout
    let slotFound = false
    let prevPanelElements = this.panelElements
    let nextPanelElementsPreSlot: TSvgPanelElement[] = []
    let nextPanelElementsPostSlot: TSvgPanelElement[] = []
    let nextPanelElements: TSvgPanelElement[] = []

    const pushElements = (...elements: TSvgPanelElement[]) => {
      !slotFound
        ? nextPanelElementsPreSlot.push(...elements)
        : nextPanelElementsPostSlot.push(...elements)
    }

    // Loop through the layout elements and
    // push them to the next panel elements
    // based on the defined layout.
    for (let layoutElement of layout) {
      switch (layoutElement) {
        case '<slot>':
          slotFound = true
          break
        case '<divider>':
          pushElements({
            key: StringToolbox.generateRandomId(),
            type: 'divider',
          })
          break
        default:
          // Add button for the current index, if present.
          let currentIndex = prevPanelElements.findIndex(
            (panelElement) =>
              panelElement.type === 'button' &&
              panelElement.icon === layoutElement,
          )
          if (currentIndex >= 0) {
            pushElements(...prevPanelElements.splice(currentIndex, 1))
          }
          break
      }
    }

    // Join panel elements together.
    nextPanelElements = [
      // Elements before the slot was found go first.
      ...nextPanelElementsPreSlot,
      // Then any remaining, unspecified elements.
      ...prevPanelElements,
      // Then elements after the slot was found.
      ...nextPanelElementsPostSlot,
    ]

    // Set new elements.
    this._panelElements = nextPanelElements

    this.onChange()
  }

  /**
   * The callback to call when a change has been
   * made to the button props.
   */
  private onChange: () => void

  /**
   * A hook used to create an manage a new instance of
   * `ButtonSvgEngine`.
   * @returns A new instance of `ButtonSvgEngine`.
   * @note Must be used within a React component.
   */
  public static use(): ButtonSvgEngine {
    return compute(() => {
      const globalContext = useGlobalContext()
      const forceUpdate = useForcedUpdates()
      const engine = useRef(
        new ButtonSvgEngine(globalContext, () => forceUpdate()),
      )

      // Handle any global updates within the engine.
      useEffect(
        () => engine.current.onGlobalUpdate(globalContext),
        [globalContext],
      )

      return engine.current
    })
  }
}
