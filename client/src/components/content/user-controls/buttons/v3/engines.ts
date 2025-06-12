import { useState } from 'react'
import { compute } from 'src/toolbox'
import { useForcedUpdates, usePostInitEffect } from 'src/toolbox/hooks'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import SvgButton from './button-svg'
import SvgDivider from './divider-svg'
import { useButtonSvgEngine, useButtonSvgs } from './hooks'
import SvgStepper from './stepper-svg'
import {
  TButtonSvgEngine,
  TButtonSvgFlow,
  TButtonSvgPanelOptions,
  TSvgLayout,
  TSvgPanelElement,
  TSvgPanelElement_Input,
} from './types'

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
  public get buttons(): SvgButton[] {
    const buttonElements = this.panelElements.filter(
      (element) => element instanceof SvgButton,
    )
    return buttonElements as SvgButton[]
  }

  /**
   * The steppers powered by the engine.
   */
  public get steppers(): SvgStepper[] {
    const stepperElements = this.panelElements.filter(
      (element) => element instanceof SvgStepper,
    )
    return stepperElements as SvgStepper[]
  }

  /**
   * @see {@link ButtonSvgEngine.flow}
   */
  private _flow: TButtonSvgFlow
  /**
   * The direction the elements in the panel flow
   * in the DOM.
   * @default 'row'
   * @note Setting this will cause a re-render.
   */
  public get flow(): TButtonSvgFlow {
    return this._flow
  }
  public set flow(flow: TButtonSvgFlow) {
    this._flow = flow
    this.onChange()
  }

  /**
   * @see {@link ButtonSvgEngine.layout}
   */
  private _layout: TSvgLayout
  /**
   * The layout used to display the buttons.
   * @default ['<slot>']
   * @note Setting this will cause a re-render.
   */
  public get layout(): TSvgLayout {
    return this._layout
  }
  public set layout(layout: TSvgLayout) {
    this._layout = layout
    this._hasCustomLayout = true
    this.applyLayout()
  }

  /**
   * @see {@link ButtonSvgEngine.labelsRevealed}
   */
  private _labelsRevealed: boolean
  /**
   * Whether the labels of the buttons should be
   * shown inline with the icons.
   * @default false
   * @note Setting this will cause a re-render.
   */
  public get labelsRevealed(): boolean {
    return this._labelsRevealed
  }
  public set labelsRevealed(revealLabels: boolean) {
    this._labelsRevealed = revealLabels
    this.onChange()
  }

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
   * Cannot be instantiated externally.
   * @param options Custom configuration for the engine.
   * @param onChange The callback to call when the engine
   * changes. This is used to trigger a re-render of
   * the component using the engine.
   * global context changes.
   * @see {@link ButtonSvgEngine.use} hook.
   */
  private constructor(
    options: TButtonSvgPanelOptions = {},
    onChange: () => void,
  ) {
    this._hasCustomLayout = Boolean(options.layout)

    const { layout = ['<slot>'], flow = 'row', revealLabels = false } = options

    this._panelElements = []
    this._layout = layout
    this._flow = flow
    this._labelsRevealed = revealLabels
    this.onChange = onChange
  }

  /**
   * @param element The element in question.
   * @returns Whether the given element is being used
   * by the engine.
   */
  private inUse(element: Partial<TSvgPanelElement_Input>): boolean {
    return this.panelElements.some(
      (panelElement) => panelElement.icon === element.icon,
    )
  }

  /**
   * Adds elements to the engine.
   * @param elements The elements to add.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public add(
    ...elements: Required<TButtonSvgEngine>['elements']
  ): ButtonSvgEngine {
    for (let element of elements) {
      // If the element is already in use, throw an error.
      if (this.inUse(element)) {
        throw new Error(
          `Element "{ key: "${element.key}", type: "${element.type}" icon: "${element.icon}" }" is already in use.\n` +
            `Element Data: ${JSON.stringify(element, null, 2)}`,
        )
      }

      switch (element.type) {
        case 'button':
          const button = SvgButton.create(this, element)
          this._panelElements.push(button)
          break
        case 'stepper':
          const stepper = SvgStepper.create(this, element)
          this._panelElements.push(stepper)
          break
      }
    }
    this.applyLayout()
    return this
  }

  /**
   * Removes elements from the engine.
   * @param elements The elements to remove.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public remove(...elements: TSvgPanelElement_Input[]): ButtonSvgEngine {
    for (let element of elements) {
      let elementIndex = this.panelElements.findIndex(
        ({ icon }) => icon === element.icon,
      )
      if (elementIndex >= 0) {
        this._panelElements.splice(elementIndex, 1)
      }
    }
    this.applyLayout()
    return this
  }

  /**
   * Removes all non-layout elements from the engine.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public removeAll(): ButtonSvgEngine {
    this._panelElements = this.panelElements.filter(
      (element) => element instanceof SvgDivider,
    )
    this.applyLayout()
    return this
  }

  /**
   * Gets an element by its icon.
   * @param icon The icon of the SVG panel element to get.
   * @returns The element with the given icon, or `undefined`
   * if no such element exists.
   */
  public get(icon: TSvgPanelElement['icon']): TSvgPanelElement | undefined {
    return this.panelElements.find((element) => element.icon === icon)
  }

  /**
   * Sets the given property for the element of the
   * given icon.
   * @param icon The icon of the element.
   * @param propKey The key of the property to set.
   * @param propValue The value of the property to set.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  private setButtonProp<
    TPropKey extends keyof TSvgPanelElement,
    TPropValue extends TSvgPanelElement[TPropKey],
  >(
    icon: TSvgPanelElement['icon'],
    propKey: TPropKey,
    propValue: TPropValue,
  ): ButtonSvgEngine {
    let element = this.get(icon)
    if (element) element[propKey] = propValue
    this.onChange()
    return this
  }

  /**
   * Sets the description for the element of
   * the given icon.
   * @param icon The icon of the element.
   * @param description The description to set.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setDescription(
    icon: TSvgPanelElement['icon'],
    description: string,
  ): ButtonSvgEngine {
    return this.setButtonProp(icon, 'description', description)
  }

  /**
   * Sets whether the element of the given icon
   * is disabled.
   * @param icon The icon of the element.
   * @param disabled Whether the element is disabled.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setDisabled(
    icon: TSvgPanelElement['icon'],
    disabled: boolean,
  ): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', disabled)
  }

  /**
   * Enables an element.
   * @param icon The icon of the element.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public enable(icon: TSvgPanelElement['icon']): ButtonSvgEngine {
    return this.setDisabled(icon, false)
  }

  /**
   * Disables an element.
   * @param icon The icon of the element.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public disable(icon: TSvgPanelElement['icon']): ButtonSvgEngine {
    return this.setDisabled(icon, true)
  }

  /**
   * Sets whether the element of the given icon
   * is hidden.
   * @param icon The icon of the element.
   * @param hidden Whether the element is hidden.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setHidden(
    icon: TSvgPanelElement['icon'],
    hidden: boolean,
  ): ButtonSvgEngine {
    return this.setButtonProp(icon, 'hidden', hidden)
  }

  /**
   * Reveals a button that was previously hidden.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public reveal(icon: TSvgPanelElement['icon']): ButtonSvgEngine {
    return this.setHidden(icon, false)
  }

  /**
   * Hides a button that was previously visible.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public hide(icon: TSvgPanelElement['icon']): ButtonSvgEngine {
    return this.setHidden(icon, true)
  }

  /**
   * Allows modifications to be made to the unique class
   * list of the button with the given icon.
   * @param icon The icon of the button.
   * @param callback A callback which will provide the class
   * list to be modified by the caller.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public modifyClassList(
    icon: TSvgPanelElement['icon'],
    callback: (classList: ClassList) => {},
  ): ButtonSvgEngine {
    let element = this.get(icon)
    if (element) callback(element.uniqueClassList)
    this.onChange()
    return this
  }

  /**
   * Applies the current layout to the current
   * set of SVG panel elements.
   * @note Calling this will cause a re-render.
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
          pushElements(SvgDivider.create(this))
          break
        default:
          // Add the element to the next panel elements
          // if it exists in the previous panel elements.
          let currentIndex = prevPanelElements.findIndex(
            (panelElement) => panelElement.icon === layoutElement,
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
   * @see {@link useButtonSvgEngine} for details
   * concerning the parameters of this method.
   */
  public static use({
    elements = [],
    options = {},
    dependencies = [],
  }: TButtonSvgEngine = {}): ButtonSvgEngine {
    return compute(() => {
      const forceUpdate = useForcedUpdates()
      const [engine, setEngine] = useState(
        new ButtonSvgEngine(options, () => forceUpdate()),
      )
      // Update the engine whenever the dependencies change.
      usePostInitEffect(() => {
        setEngine(new ButtonSvgEngine(options, () => forceUpdate()))
      }, dependencies)
      // Add the buttons to the engine.
      useButtonSvgs(engine, ...elements)
      return engine
    })
  }
}
