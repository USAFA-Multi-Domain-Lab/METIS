import React from 'react'
import { compute } from 'src/toolbox'
import ButtonSvg, { TButtonSvgSize, TButtonSvgType } from './ButtonSvg'
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
  size = 'regular',
  uniqueClassList = [],
  styling = {},
  getTooltip = () => '',
  onButtonClick,
}: TButtonSvgPanel_v2_P): JSX.Element | null {
  // If no buttons, add a blank to
  // maintain the correct height.
  if (!buttons.length) buttons.push('_blank')

  /* -- COMPUTED -- */

  /**
   * The class for the root element.
   */
  const rootClass = compute((): string => {
    // Gather details.
    let classList: string[] = ['ButtonSvgPanel_v2', ...uniqueClassList]
    // Join and return class list.
    return classList.join(' ')
  })

  /* -- RENDER -- */

  return (
    <div className={rootClass} style={styling}>
      {buttons.map((type, index) => (
        <ButtonSvg
          key={type + index} // todo: fix this to not use the index.
          type={type}
          size={size}
          onClick={() => onButtonClick(type)}
          tooltipDescription={getTooltip(type)}
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
   * The size of the buttons.
   * @default 'regular'
   */
  size?: TButtonSvgSize
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
   * Gets the tooltip description for the button.
   * @param button The type of button for which to get the tooltip.
   * @returns The tooltip description.
   * @default () => ''
   */
  getTooltip?: TSvgPanelGetTooltip
  /**
   * Callback for when a button is clicked.
   * @param button The type of button clicked.
   */
  onButtonClick: TSvgPanelOnClick
}

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
