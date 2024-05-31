import { useState } from 'react'
import { compute } from 'src/toolbox'
import { HEX_COLOR_REGEX } from '../../../../../../../../shared/toolbox/strings'
import './index.scss'

/**
 * A tab that can be used on the tab bar to represent a view
 * on the mission map.
 */
export default function Tab({
  text,
  color,
}: // selected = false,
TTab_P): JSX.Element | null {
  /* -- STATE -- */

  const [selected, setSelected] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The class name for the root element.
   */
  const rootClass = compute((): string => {
    let classList: string[] = ['Tab']

    // If the tab is selected, add the selected class.
    if (selected) classList.push('Selected')

    return classList.join(' ')
  })

  /**
   * The color of the tab with a heavy fade.
   */
  const colorWithAlpha = compute((): string => {
    let alpha: string = '1f'

    // If the tab is selected, increase the alpha.
    if (selected) {
      alpha = '88'
    }

    // If the color is a valid hex color,
    // add a heavy fade to it, else use
    // a default color.
    if (HEX_COLOR_REGEX.test(color)) {
      return color + alpha
    } else {
      return '#ffffff' + alpha
    }
  })

  /**
   * The inline style for the root element.
   */
  const rootStyle = compute((): React.CSSProperties => {
    return {
      // color: color,
      // background: `
      //   linear-gradient(to bottom, ${colorWithAlpha} 0 100%),
      //   linear-gradient(to bottom, #000 0 100%)`,
    }
  })

  /**
   * The inline style for the text element.
   */
  const textStyle = compute((): React.CSSProperties => {
    return {
      color: color,
      borderColor: selected ? color : 'transparent',
    }
  })

  /**
   * The inline style for the text fade element.
   */
  const textFadeStyle = compute((): React.CSSProperties => {
    return {
      // background: `
      //   linear-gradient(to left, ${colorWithAlpha} 0 0.75em, transparent 100%),
      //   linear-gradient(to left, #000 0 0.75em, transparent 100%)`,
    }
  })

  /* -- FUNCTIONS -- */

  const onClick = () => setSelected(!selected)

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div className={rootClass} style={rootStyle} onClick={onClick}>
      <div className='Text' style={textStyle}>
        {text}
      </div>
      <div className='TextFade' style={textFadeStyle}></div>
    </div>
  )
}

/**
 * Props for `Tab`.
 */
export type TTab_P = {
  /**
   * The text to display.
   */
  text: string
  /**
   * The color for the tab.
   * @note A heavy fade will be applied to this color.
   * @note This color will be used as inline CSS as a
   * background color. Please provide a non-alpha hexidecimal
   * color. (e.g. `#ff0000`)
   */
  color: string
  /**
   * Whether the tab is selected.
   * @default false
   */
  selected?: boolean
}
