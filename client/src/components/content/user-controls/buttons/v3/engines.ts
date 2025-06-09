import { useState } from 'react'
import { compute } from 'src/toolbox'
import { useForcedUpdates, usePostInitEffect } from 'src/toolbox/hooks'
import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import { useButtonSvgEngine, useButtonSvgs } from './hooks'
import {
  TButtonSvg_Input,
  TButtonSvg_PK,
  TButtonSvgEngine_P,
  TButtonSvgFlow,
  TButtonSvgPanelOptions,
  TSvgLayout,
  TSvgPanelElement,
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
  public get buttons(): TButtonSvg_PK[] {
    return this._panelElements.filter(
      (element) => element.type === 'button',
    ) as TButtonSvg_PK[]
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
   * @param buttons The initial buttons to add to the engine.
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
   * Adds buttons to the engine.
   * @param buttons The buttons to add.
   * @returns Itself for chaining.
   * @throws If any of the icons of the buttons,
   * with the exception of the '_blank' icon, are
   * already in use.
   * @note Calling this will cause a re-render.
   */
  public add(...buttons: TButtonSvg_Input[]): ButtonSvgEngine {
    for (let button of buttons) {
      let element: TButtonSvg_PK = {
        key: StringToolbox.generateRandomId(),
        type: 'button',
        ...ButtonSvgEngine.DEFAULT_BUTTON_PROPS,
        ...button,
      }

      // Throw an error if the button is already in use.
      if (element.icon !== '_blank' && this.inUse(element.icon)) {
        throw new Error(`Button with icon "${button.icon}" is already in use.`)
      }

      this._panelElements.push(element)
    }

    this.applyLayout()
    return this
  }

  /**
   * Removes buttons from the engine.
   * @param icons The icons of the buttons to remove.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public remove(...icons: TMetisIcon[]): ButtonSvgEngine {
    for (let icon of icons) {
      let buttonIndex = this.buttons.findIndex((button) => button.icon === icon)
      if (buttonIndex >= 0) {
        this._panelElements.splice(buttonIndex, 1)
      }
    }
    this.applyLayout()
    return this
  }

  /**
   * Removes all buttons from the engine.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public removeAll(): ButtonSvgEngine {
    this._panelElements = this._panelElements.filter(
      (element) => element.type !== 'button',
    )
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
   * @note Calling this will cause a re-render.
   */
  private setButtonProp<
    TPropKey extends keyof TButtonSvg_PK,
    TPropValue extends TButtonSvg_PK[TPropKey],
  >(
    icon: TMetisIcon,
    propKey: TPropKey,
    propValue: TPropValue,
  ): ButtonSvgEngine {
    let button = this.getButton(icon)
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
   * @note Calling this will cause a re-render.
   */
  public setDescription(
    icon: TMetisIcon,
    description: string,
  ): ButtonSvgEngine {
    return this.setButtonProp(icon, 'description', description)
  }

  /**
   * Sets whether the button of the given icon
   * is disabled.
   * @param icon The icon of the button.
   * @param disabled Whether the button is disabled.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setDisabled(icon: TMetisIcon, disabled: boolean): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', disabled)
  }

  /**
   * Enables a button.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public enable(icon: TMetisIcon): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', false)
  }

  /**
   * Disables a button.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public disable(icon: TMetisIcon): ButtonSvgEngine {
    return this.setButtonProp(icon, 'disabled', true)
  }

  /**
   * Sets whether the button of the given icon
   * is hidden.
   * @param icon The icon of the button.
   * @param hidden Whether the button is hidden.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public setHidden(icon: TMetisIcon, hidden: boolean): ButtonSvgEngine {
    return this.setButtonProp(icon, 'hidden', hidden)
  }

  /**
   * Reveals a button that was previously hidden.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public reveal(icon: TMetisIcon): ButtonSvgEngine {
    return this.setButtonProp(icon, 'hidden', false)
  }

  /**
   * Hides a button that was previously visible.
   * @param icon The icon of the button.
   * @returns Itself for chaining.
   * @note Calling this will cause a re-render.
   */
  public hide(icon: TMetisIcon): ButtonSvgEngine {
    return this.setButtonProp(icon, 'hidden', true)
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
    icon: TMetisIcon,
    callback: (classList: ClassList) => {},
  ): ButtonSvgEngine {
    let button = this.getButton(icon)
    if (button) callback(button.uniqueClassList)
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
   * Default props when adding a new button.
   */
  public static get DEFAULT_BUTTON_PROPS(): Required<TButtonSvg_Input> {
    return {
      icon: 'options',
      label: '',
      description: '',
      uniqueClassList: new ClassList(),
      disabled: false,
      hidden: false,
      alwaysShowTooltip: false,
      cursor: 'pointer',
      permissions: [],
      onClick: () => {},
      onCopy: () => {},
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
    buttons = [],
    options = {},
    dependencies = [],
  }: TButtonSvgEngine_P = {}): ButtonSvgEngine {
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
      useButtonSvgs(engine, ...buttons)
      return engine
    })
  }
}
