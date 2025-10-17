import React from 'react'
import type ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { type TUserPermissionId } from '../../../../../../../shared/users/permissions'
import { defaultButtonSvgProps } from './elements/ButtonSvg'
import StepperSvg from './elements/StepperSvg'
import TextSvg from './elements/TextSvg'
import type ButtonSvgEngine from './engines'

/**
 * Props for `ButtonSvgPanel` component.
 */
export interface TButtonSvgPanel_P {
  /**
   * The engine for the button panel.
   */
  engine: ButtonSvgEngine
}

/**
 * Parameters used to create a new
 * `ButtonSvgEngine`.
 */
export interface TButtonSvgEngine {
  /**
   * The elements to add to the engine.
   */
  elements?: TSvgPanelElement_Input[]
  /**
   * The options with which to configure the engine.
   */
  options?: TButtonSvgPanelOptions
  /**
   * The dependencies to use for the engine, creating
   * a new engine if any of them change.
   */
  dependencies?: React.DependencyList
}
/**
 * Creates an input type for the given props type
 * that extends {@link TSvgPanelElementBase}.
 */
export type TButtonPanelInput<TProps extends TSvgPanelElementBase> = Partial<
  Omit<TProps, 'key' | 'type'>
> &
  Pick<TProps, 'key' | 'type'>

/**
 * An element that can be rendered in a `ButtonSvgPanel`.
 */
type TSvgPanelElement_Input =
  | TButtonPanelInput<TButtonSvg_PK>
  | TButtonPanelInput<TToggleSvg_PK>
  | TButtonPanelInput<TStepperSvg_PK>
  | TButtonPanelInput<TDividerSvg_PK>
  | TButtonPanelInput<TTextSvg_PK>

/**
 * A base interface for SVG panel elements
 * to implement.
 */
interface TSvgPanelElementBase {
  /**
   * Uniquely identifies the element in the panel.
   * @note Low case letters and hypens only.
   * (Must match regex: `^[a-z-]+$`)
   */
  key: string
  /**
   * More detailed description for the SVG panel element.
   */
  description: string
  /**
   * Unique class lists to apply to the SVG panel element.
   */
  uniqueClassList: ClassList
  /**
   * Whether the SVG panel element is disabled.
   */
  disabled: boolean
  /**
   * Whether the SVG panel element is hidden.
   */
  hidden: boolean
}

/**
 * Props for `ButtonSVG` component with the key included.
 * @see {@link defaultButtonSvgProps} for default values.
 */
export interface TButtonSvg_PK extends TSvgPanelElementBase {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: 'button'
  /**
   * The icon for the SVG button.
   */
  icon: TMetisIcon
  /**
   * Brief descriptor for the button.
   * @note This will be displayed above the description
   * in the tooltip, and it will be displayed beside the
   * icon, if {@link TButtonSvg_PK.revealLabel} is set to true.
   */
  label: string
  /**
   * Whether to show the tooltip even when
   * the button is disabled.
   * @note Not applicable if the disable behavior
   * is set to `hide`.
   */
  alwaysShowTooltip: boolean
  /**
   * Cursor styling used for the button.
   */
  cursor: string
  /**
   * The permissions required to use the button.
   */
  permissions: TUserPermissionId[]
  /**
   * Handles the click event for the button.
   * @param event The click event.
   */
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * Props for `ToggleSvg` component with the key included.
 * @see {@link defaultButtonSvgProps} for default values.
 */
export interface TToggleSvg_PK extends TSvgPanelElementBase {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: 'toggle'
  /**
   * The icon for the SVG button.
   */
  icon: TMetisIcon
  /**
   * Brief descriptor for the button.
   * @note This will be displayed above the description
   * in the tooltip, and it will be displayed beside the
   * icon, if {@link TButtonSvg_PK.revealLabel} is set to true.
   */
  label: string
  /**
   * The initial value for the toggle.
   */
  initialValue: boolean
  /**
   * Whether to show the tooltip even when
   * the button is disabled.
   * @note Not applicable if the disable behavior
   * is set to `hide`.
   */
  alwaysShowTooltip: boolean
  /**
   * Cursor styling used for the button.
   */
  cursor: string
  /**
   * The permissions required to use the button.
   */
  permissions: TUserPermissionId[]
  /**
   * Callback for when the toggle state changes.
   * @param value The new toggle state value.
   */
  onChange: (value: boolean) => void
}

/**
 * Props for `DividerSvg` component.
 */
export interface TDividerSvg_PK extends TSvgPanelElementBase {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: 'divider'
}

/**
 * Props for {@link StepperSvg} component.
 */
export interface TStepperSvg_PK extends TSvgPanelElementBase {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: 'stepper'
  /**
   * Customizes the appearance of the stepper.
   */
  variation: 'page' | 'zoom'
  /**
   * The maximum value for the stepper.
   */
  maximum: number
  /**
   * The stepper's current value stored in state.
   */
  value: TReactState<number>
}

/**
 * Props for {@link TextSvg} component.
 */
export interface TTextSvg_PK extends TSvgPanelElementBase {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: 'text'
  /**
   * The value of the text to display.
   */
  value: string
  /**
   * The size of the text to display.
   * @default 'regular'
   */
  size: 'small' | 'regular' | 'large'
  /**
   * Makes the text appear bold.
   * @default false
   */
  bold: boolean
}

/**
 * A type that represents all SVG panel elements
 * that can be rendered in a `ButtonSvgPanel`.
 */
export type TSvgPanelElement =
  | TButtonSvg_PK
  | TToggleSvg_PK
  | TStepperSvg_PK
  | TDividerSvg_PK
  | TTextSvg_PK

/**
 * A type used to layout panel elements in a `ButtonSvgEngine`.
 * If not a key of a corresponding element, the option chosen will provide
 * special instruction to the `setLayout` method.
 * @option '<slot>' This will define where icons not defined
 * in the layout will be placed.
 * @option '<divider>' This will place a divider in the layout
 * between other elements. This will only be visible if the divider
 * is between two other elements.
 * @see {@link ButtonSvgEngine.setLayout}
 */
export type TSvgLayoutElement = string

/**
 * An array of layout elements used to define the
 * layout of the buttons and related components in
 * a `ButtonSvgEngine`.
 */
export type TSvgLayout = TSvgLayoutElement[]

/**
 * Options for the `ButtonSvgPanel` component.
 */
export type TButtonSvgPanelOptions = {
  /**
   * @see {@link ButtonSvgEngine.flow}
   */
  flow?: TButtonSvgFlow
  /**
   * @see {@link ButtonSvgEngine.layout}
   */
  layout?: TSvgLayout
  /**
   * @see {@link ButtonSvgEngine.labelsRevealed}
   */
  revealLabels?: boolean
}

/**
 * The direction that buttons flow in the DOM
 * for a SVG panel.
 */
export type TButtonSvgFlow = 'row' | 'column'
