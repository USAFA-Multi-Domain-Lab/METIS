import React from 'react'
import type ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { type TWithKey } from '../../../../../../../shared/toolbox/objects'
import { type TUserPermissionId } from '../../../../../../../shared/users/permissions'
import SvgButton from './button-svg'
import { defaultButtonSvgProps } from './ButtonSvg'
import SvgDivider from './divider-svg'
import type ButtonSvgEngine from './engines'
import SvgStepper from './stepper-svg'

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
 * Input data used to create a new SVG button.
 */
type TButtonSvg_Input = Partial<TButtonSvg_PK> & {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: TButtonSvg_PK['type']
}

/**
 * Input data used to create a new SVG divider.
 */
type TDividerSvg_Input = Partial<TDividerSvg_PK> & {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: TDividerSvg_PK['type']
}

/**
 * Input data used to create a new SVG stepper.
 */
type TStepperSvg_Input = Partial<TStepperSvg_PK> & {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: TStepperSvg_PK['type']
}

/**
 * An element that can be rendered in a `ButtonSvgPanel`.
 */
type TSvgPanelElement_Input =
  | TButtonSvg_Input
  | TStepperSvg_Input
  | TDividerSvg_Input

/**
 * A base interface for SVG panel elements
 * to implement.
 */
interface TSvgPanelElementBase {
  /**
   * The unique key for the SVG panel element.
   * @note This is used to identify the element in the
   * `ButtonSvgEngine` and should be unique.
   */
  key: TWithKey['key']
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
  onClick: (event: React.MouseEvent) => void
  /**
   * Callback for a clipboard copy event.
   * @param event The clipboard event.
   */
  onCopy: (event: React.ClipboardEvent) => void
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
  /**
   * The icon for the divider.
   * @note This is used to display a visual divider
   * in the SVG panel.
   */
  icon: TMetisIcon
}

/**
 * Props for `StepperSvg` component.
 */
export interface TStepperSvg_PK extends TSvgPanelElementBase {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: 'stepper'
  /**
   * The icon for the stepper.
   * @note This is used to display the stepper icon
   * in the SVG panel.
   */
  icon: 'stepper-page' | 'stepper-zoom'
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
 * @see {@link SvgButton}
 */
export type TButtonSvg = TButtonSvg_PK

/**
 * @see {@link SvgStepper}
 */
export type TStepperSvg = TStepperSvg_PK

/**
 * @see {@link DividerSvg}
 */
export type TDividerSvg = TDividerSvg_PK

/**
 * A type that represents all SVG panel elements
 * that can be rendered in a `ButtonSvgPanel`.
 */
export type TSvgPanelElement = SvgButton | SvgStepper | SvgDivider

/**
 * A type used to layout panel elements in a `ButtonSvgEngine`.
 * If not a correct icon type, the option chosen will provide
 * special instruction to the `setLayout` method.
 * @option '<slot>' This will define where icons not defined
 * in the layout will be placed.
 * @option '<divider>' This will place a divider in the layout
 * between other elements. This will only be visible if the divider
 * is between two other elements.
 * @see {@link ButtonSvgEngine.setLayout}
 */
export type TSvgLayoutElement =
  | TSvgPanelElement['icon']
  | '<slot>'
  | '<divider>'

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
