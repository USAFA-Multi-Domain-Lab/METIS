import React from 'react'
import { compute } from 'src/toolbox'
import { TWithKey } from '../../../../../../shared/toolbox/objects'
import ButtonSvg, { TButtonSvg_P } from './ButtonSvg'
import './ButtonSvgPanel.scss'

/**
 * A panel of SVG buttons.
 * @deprecated Use `ButtonSvgPanel_v2` instead.
 */
export default function ButtonSvgPanel({
  buttons,
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
        <ButtonSvg {...button} key={button.key} />
      ))}
    </div>
  )
}

/**
 * A button that can be displayed in a panel.
 */
export type TValidPanelButton = Omit<TWithKey<TButtonSvg_P>, 'size'>

/**
 * Props for `ButtonSvgPanel` component.
 */
export type TButtonSvgPanel = {
  /**
   * The props for the buttons to display.
   */
  buttons: TWithKey<TButtonSvg_P>[]
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
