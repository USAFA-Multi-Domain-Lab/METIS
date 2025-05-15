import type ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import { type TWithKey } from '../../../../../../../shared/toolbox/objects'
import { type TUserPermissionId } from '../../../../../../../shared/users/permissions'
import { defaultButtonSvgProps } from './ButtonSvg'
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
 * Identifiers for different types of SVG panel
 * elements.
 */
export type TSvgPanelElementType = 'button' | 'divider'

/**
 * A base interface for SVG panel elements
 * to implement.
 */
export interface TSvgPanelElementBase<TType extends TSvgPanelElementType>
  extends TWithKey<{}> {
  /**
   * Identifier for the class of element being
   * used. Distinguishes different React component
   * types in use.
   */
  type: TType
}

/**
 * Props for `ButtonSVG` component with the key included.
 * @see {@link defaultButtonSvgProps} for default values.
 */
export interface TButtonSvg_PK extends TSvgPanelElementBase<'button'> {
  /**
   * The icon for the button.
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
   * More detailed description for the button.
   * @note This will be displayed in the tooltip
   * underneath a label, if there is one.
   */
  description: string
  /**
   * Unique class lists to apply to the component.
   */
  uniqueClassList: ClassList
  /**
   * Whether the button is currently disabled,
   * which will gray it out and prevent it from
   * being clicked.
   */
  disabled: boolean
  /**
   * Whether the button is hidden completely from
   * view.
   */
  hidden: boolean
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
 * Input data used to create a new SVG button.
 */
export type TButtonSvg_Input = Partial<Omit<TButtonSvg_PK, 'key' | 'type'>>

/**
 * Props for `ButtonSvgDivider` component.
 */
export interface TButtonSvgDivider_PK extends TSvgPanelElementBase<'divider'> {}

/**
 * An element that can be rendered in a `ButtonSvgPanel`.
 */
export type TSvgPanelElement = TButtonSvg_PK | TButtonSvgDivider_PK

/**
 * A type used to layout panel elements in a `ButtonSvgEngine`.
 * If not a `TMetisIcon`, the option chosen will provide
 * special instruction to the `setLayout` method.
 * @option '<slot>' This will define where icons not defined
 * in the layout will be placed.
 * @option '<divider>' This will place a divider in the layout
 * between other elements. This will only be visible if the divider
 * is between two other elements.
 * @see {@link ButtonSvgEngine.setLayout}
 */
export type TSvgLayoutElement = TMetisIcon | '<slot>' | '<divider>'

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
 * Props for `ButtonSvgPanel` component.
 */
export interface TButtonSvgPanel_P {
  /**
   * The engine for the button panel.
   */
  engine: ButtonSvgEngine
}

/**
 * The direction that buttons flow in the DOM
 * for a SVG panel.
 */
export type TButtonSvgFlow = 'row' | 'column'
