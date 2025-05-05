import React from 'react'
import { compute } from 'src/toolbox'
import ClassList from '../../../../../../shared/toolbox/html/class-lists'
import ButtonSvg, { TButtonSvgDisabled, TButtonSvgType } from './ButtonSvg'
import './ButtonSvgPanel_v2.scss'

/**
 * A panel of SVG buttons.
 * @note This version of the component has a different
 * way of handling button clicks. Instead of passing a
 * callback to each button, a single callback is passed
 * to the panel. When a button is clicked, the panel
 * will call the callback with the type of the button
 * clicked.
 */
export default function ButtonSvgPanel_v2({
  buttons,
  uniqueClassList = [],
  styling = {},
  getLabel = () => '',
  getTooltip = () => '',
  getButtonClassList = () => [],
  onButtonClick,
  disableButton = () => 'none',
}: TButtonSvgPanel_v2_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The class for the root element.
   */
  const rootClass = compute((): string => {
    // Gather details.
    let classList: string[] = ['ButtonSvgPanel_v2', ...uniqueClassList]
    // If, no buttons, add "PanelEmpty" class.
    if (buttons.length === 0) classList.push('PanelEmpty')
    // Join and return class list.
    return classList.join(' ')
  })

  /* -- RENDER -- */

  // If no buttons, add a blank to
  // maintain the correct height.
  if (!buttons.length) buttons.push('_blank')

  return (
    <div className={rootClass} style={styling}>
      {buttons.map((type, index) => (
        <ButtonSvg
          key={type + index} // todo: fix this to not use the index.
          type={type}
          label={getLabel(type)}
          description={getTooltip(type)}
          onClick={() => onButtonClick(type)}
          disabled={disableButton(type)}
          uniqueClassList={getButtonClassList(type, index)}
        />
      ))}
    </div>
  )
}

/**
 * Props for `ButtonSvgPanel_v2` component.
 */
export type TButtonSvgPanel_v2_P = {
  /**
   * The button SVG types to display.
   * @note Buttons will automatically be generated
   * based on the types provided.
   * @note Each index should be unique, meaning,
   * no more than one of each type.
   */
  buttons: TButtonSvgType[]
  /**
   * Unique classes to add to the panel.
   * @default []
   */
  uniqueClassList?: string[]
  /**
   * The styling for the panel.
   * @default {}
   */
  styling?: React.CSSProperties
  /**
   * Gets the label for the button.
   * @param button The type of button for which to get the label.
   * @returns The label for the button.
   * @default () => ''
   */
  getLabel?: TSvgPanelGetLabel
  /**
   * Gets the tooltip description for the button.
   * @param button The type of button for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getTooltip?: TSvgPanelGetTooltip
  /**
   * Gets the class list for the button.
   * @param button The type of button for which to get the class list.
   * @param index The index of the button.
   * @returns The class list for the button.
   * @default () => []
   */
  getButtonClassList?: (
    button: TButtonSvgType,
    index: number,
  ) => string[] | ClassList
  /**
   * Callback for when a button is clicked.
   * @param button The type of button clicked.
   */
  onButtonClick: TSvgPanelOnClick
  /**
   * Callback that determines if a button should be disabled.
   * @param button The type of button to disable.
   * @returns The disabled state of the button.
   * @default () => 'none'
   */
  disableButton?: TSvgPanelDisableButton
}

/**
 * Gets the label for the button.
 * @param button The type of button for which to get the label.
 * @returns The label for the button.
 */
export type TSvgPanelGetLabel = (button: TButtonSvgType) => string

/**
 * Gets the tooltip description for the button.
 * @param button The type of button for which to get the tooltip.
 * @returns The tooltip description.
 */
export type TSvgPanelGetTooltip = (button: TButtonSvgType) => string

/**
 * A callback for when a button is clicked.
 * @param button The type of button clicked.
 */
export type TSvgPanelOnClick = (button: TButtonSvgType) => void

/**
 * A callback that determines if a button should be disabled.
 * @param button The type of button to disable.
 * @returns The disabled state of the button.
 */
export type TSvgPanelDisableButton = (
  button: TButtonSvgType,
) => TButtonSvgDisabled
