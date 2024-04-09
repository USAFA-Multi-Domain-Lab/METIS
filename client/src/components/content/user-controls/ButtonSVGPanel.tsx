import React from 'react'
import { compute } from 'src/toolbox'
import { TWithKey } from '../../../../../shared/toolbox/objects'
import './ButtonSvgPanel.scss'
import ButtonSvg, { TButtonSvg, TButtonSvgSize } from './ButtonSvgg'

/**
 * A panel of SVG buttons.
 */
export default function ButtonSvgPanel({
  buttons,
  size = 'regular',
  uniqueClassList = [],
  styling = {},
}: TButtonSvgPanel): JSX.Element | null {
  /* -- computed -- */

  /**
   * The class for the root element.
   */
  const rootClass = compute((): string => {
    // Gather details.
    let classList: string[] = ['ButtonSvgPanel', ...uniqueClassList]
    // Join and return class list.
    return classList.join(' ')
  })

  /* -- render -- */

  return (
    <div className={rootClass} style={styling}>
      {buttons.map((button) => (
        <ButtonSvg {...button} size={size} key={button.key} />
      ))}
    </div>
  )
}

/**
 * A button that can be displayed in a panel.
 */
export type TValidPanelButton = Omit<TWithKey<TButtonSvg>, 'size'>

/**
 * Props for `ButtonSvgPanel` component.
 */
export type TButtonSvgPanel = {
  /**
   * The props for the buttons to display.
   */
  buttons: TWithKey<TButtonSvg>[]
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
}
