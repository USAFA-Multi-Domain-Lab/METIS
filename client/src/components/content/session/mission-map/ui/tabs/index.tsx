import { compute } from 'src/toolbox'
import './index.scss'

/**
 * A tab that can be used on the tab bar to represent a view
 * on the mission map.
 */
export default function Tab({
  text,
  color,
  selected,
  onClick = () => {},
}: // selected = false,
TTab_P): JSX.Element | null {
  /* -- STATE -- */

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
   * The root style for the tab.
   */
  const rootStyle = compute((): React.CSSProperties => {
    return {
      borderBottomColor: selected ? color : undefined,
    }
  })

  /**
   * The inline style for the text element.
   */
  const textStyle = compute((): React.CSSProperties => {
    return { color }
  })

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div className={rootClass} style={rootStyle} onClick={onClick}>
      <div className='Text' style={textStyle}>
        {text}
      </div>
      <div className='TextFade'></div>
    </div>
  )
}

/**
 * Props for `Tab`.
 */
export type TTab_P = {
  /**
   * A unique identifier for the tab.
   */
  _id: string
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
  /**
   * Callback for when the tab is clicked.
   * @default () => {}
   */
  onClick?: () => void
}
