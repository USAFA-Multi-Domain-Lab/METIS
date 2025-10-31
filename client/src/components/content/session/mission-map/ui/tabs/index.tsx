import { useRef } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import {
  TButtonMenuEngine_P,
  useButtonMenuEngine,
} from 'src/components/content/user-controls/buttons/ButtonMenu'
import ButtonMenuController from 'src/components/content/user-controls/buttons/ButtonMenuController'
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
  description = '',
  engineProps = {},
  onClick = () => {},
}: TTab_P): TReactElement | null {
  const buttonMenuEngine = useButtonMenuEngine(engineProps)

  /* -- REFS -- */

  const root = useRef<HTMLDivElement>(null)

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

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div className={rootClass} style={rootStyle} onClick={onClick} ref={root}>
      <div className='Text' style={textStyle}>
        {text}
      </div>
      <div className='TextFade'></div>
      <ButtonMenuController
        target={root}
        engine={buttonMenuEngine}
        highlightTarget={root.current ?? undefined}
        trigger={'r-click'}
      />
      <Tooltip description={description} />
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
  _id: string // ! *** Note: DO NOT REMOVE. THIS IS USED EXTERNALLY ***
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
   * The button menu engine properties to use for the tab.
   * @default {}
   */
  engineProps?: TButtonMenuEngine_P
  /**
   * The tooltip description for the tab item.
   */
  description?: string
  /**
   * Callback for when the tab is clicked.
   * @default () => {}
   */
  onClick?: () => void
}
