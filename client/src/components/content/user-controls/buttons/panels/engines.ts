import { compute } from '@client/toolbox'
import { useForcedUpdates, usePostInitEffect } from '@client/toolbox/hooks'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'
import { createButtonDefaults } from './elements/ButtonSvg'
import { createDividerDefaults } from './elements/DividerSvg'
import { createStepperDefaults } from './elements/StepperSvg'
import { createTextDefaults } from './elements/TextSvg'
import { useButtonSvgEngine, useButtonSvgs } from './hooks'
import type {
  TButtonSvg_PK,
  TButtonSvgEngine,
  TButtonSvgFlow,
  TButtonSvgPanelOptions,
  TStepperSvg_PK,
  TSvgLayout,
  TSvgPanelElement,
  TSvgPanelElement_Input,
  TSvgPanelElementBase,
  TTextSvg_PK,
} from './types'

/**
 * An engine used to power a `ButtonSvgPanel`
 * component.
 */
export class ButtonSvgEngine {
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
    const buttonElements = this.panelElements.filter(
      (element) => element.type === 'button',
    )
    return buttonElements as TButtonSvg_PK[]
  }

  /**
   * The steppers powered by the engine.
   */
  public get steppers(): TStepperSvg_PK[] {
    const stepperElements = this.panelElements.filter(
      (element) => element.type === 'stepper',
    )
    return stepperElements as TStepperSvg_PK[]
  }

  /**
   * The text elements powered by the engine.
   */
  public get texts(): TTextSvg_PK[] {
    const textElements = this.panelElements.filter(
      (element) => element.type === 'text',
    )
    return textElements as TTextSvg_PK[]
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
      (panelElement) => panelElement.key === element.key,
    )
  }

  /**
   * Pushes an element to the panel elements.
   * @param element The element to push.
   * @throws If the element is already in use.
   */
  private pushElement(element: TSvgPanelElement): void {
    // If the element is already in use, throw an error.
    if (this.inUse(element)) {
      throw new Error(
        `Element "{ key: "${element.key}", type: "${element.type}" }" is already in use.\n` +
          `Element Data: ${JSON.stringify(element, null, 2)}`,
      )
    }
    // Otherwise, push the element to the panel elements.
    this._panelElements.push(element)
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
      if (!/^[a-z-]+$/.test(element.key)) {
        // If the key is invalid, throw an error.
        throw new Error(
          `Invalid key "${element.key}". Keys must match the regex: ^[a-z-]+$`,
        )
      }

      switch (element.type) {
        case 'button':
          this.pushElement({
            ...createButtonDefaults(),
            ...element,
          })
          break
        case 'stepper':
          this.pushElement({
            ...createStepperDefaults(),
            ...element,
          })
          break
        case 'text':
          this.pushElement({
            ...createTextDefaults(),
            ...element,
          })
          break
      }
    }
    this.applyLayout()
    return this
  }

  /**
   * Removes elements from the engine.
   * @param keys The keys of the elements to remove.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public remove(...keys: TSvgPanelElement_Input['key'][]): ButtonSvgEngine {
    for (let key of keys) {
      let elementIndex = this.panelElements.findIndex(
        ({ key: elementKey }) => elementKey === key,
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
      (element) => element.type === 'divider',
    )
    this.applyLayout()
    return this
  }

  /**
   * Gets an element by its key.
   * @param key The key of the SVG panel element to get.
   * @returns The element with the given key, or `undefined`
   * if no such element exists.
   */
  public get(key: TSvgPanelElement['key']): TSvgPanelElement | undefined {
    return this.panelElements.find((element) => element.key === key)
  }

  /**
   * Sets the given property for the element of the
   * given key.
   * @param key The key of the element.
   * @param propKey The key of the property to set.
   * @param propValue The value of the property to set.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  private setButtonProp<
    TPropKey extends keyof TSvgPanelElement,
    TPropValue extends TSvgPanelElement[TPropKey],
  >(
    key: TSvgPanelElement['key'],
    propKey: TPropKey,
    propValue: TPropValue,
  ): ButtonSvgEngine {
    let element = this.get(key)
    if (element) element[propKey] = propValue
    this.onChange()
    return this
  }

  /**
   * Sets the icon for the button element of the given key.
   * @param key The key of the button element.
   * @param icon The icon to set.
   * @returns Itself for chaining.
   * @note Element will only be updated if it
   * is of type "button".
   */
  public setButtonIcon(
    key: TSvgPanelElement['key'],
    icon: TMetisIcon,
  ): ButtonSvgEngine {
    let element = this.get(key)
    if (element?.type === 'button') {
      element.icon = icon
      this.onChange()
    }
    return this
  }

  /**
   * Sets the description for the element of
   * the given key.
   * @param key The key of the element.
   * @param description The description to set.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setDescription(
    key: TSvgPanelElement['key'],
    description: string,
  ): ButtonSvgEngine {
    return this.setButtonProp(key, 'description', description)
  }

  /**
   * Sets whether the element of the given key
   * is disabled.
   * @param key The key of the element.
   * @param disabled Whether the element is disabled.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setDisabled(
    key: TSvgPanelElement['key'],
    disabled: boolean,
  ): ButtonSvgEngine {
    return this.setButtonProp(key, 'disabled', disabled)
  }

  /**
   * Enables an element.
   * @param key The key of the element.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public enable(key: TSvgPanelElement['key']): ButtonSvgEngine {
    return this.setDisabled(key, false)
  }

  /**
   * Disables an element.
   * @param key The key of the element.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public disable(key: TSvgPanelElement['key']): ButtonSvgEngine {
    return this.setDisabled(key, true)
  }

  /**
   * Sets whether the element of the given key
   * is hidden.
   * @param key The key of the element.
   * @param hidden Whether the element is hidden.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setHidden(
    key: TSvgPanelElement['key'],
    hidden: boolean,
  ): ButtonSvgEngine {
    return this.setButtonProp(key, 'hidden', hidden)
  }

  /**
   * Reveals a button that was previously hidden.
   * @param key The key of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public reveal(key: TSvgPanelElement['key']): ButtonSvgEngine {
    return this.setHidden(key, false)
  }

  /**
   * Hides a button that was previously visible.
   * @param key The key of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public hide(key: TSvgPanelElement['key']): ButtonSvgEngine {
    return this.setHidden(key, true)
  }

  /**
   * Allows modifications to be made to the unique class
   * list of the button with the given key.
   * @param key The key of the button.
   * @param callback A callback which will provide the class
   * list to be modified by the caller.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public modifyClassList(
    key: TSvgPanelElement['key'],
    callback: (classList: ClassList) => void,
  ): ButtonSvgEngine {
    let element = this.get(key)
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
    // Filter out existing dividers before applying layout
    // to prevent duplicates when layout is reapplied
    let prevPanelElements = this.panelElements.filter(
      ({ type }) => type !== 'divider',
    )
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
            ...createDividerDefaults(),
          })
          break
        default:
          // Add the element to the next panel elements
          // if it exists in the previous panel elements.
          const currentIndex = prevPanelElements.findIndex(
            ({ key }) => key === layoutElement,
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
   * Default properties for SVG panel elements.
   */
  public static get DEFAULT_ELEMENT_PROPS(): Required<
    Omit<TSvgPanelElementBase, 'key' | 'type'>
  > {
    return {
      description: '',
      uniqueClassList: new ClassList(),
      disabled: false,
      hidden: false,
    }
  }

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
