import { useRef } from 'react'
import Tooltip from 'src/components/content/communication/Tooltip'
import { TButtonSvgType } from 'src/components/content/user-controls/buttons/ButtonSvg'
import { compute } from 'src/toolbox'
import './index.scss'
import { TTabBarTab } from './TabBar'

/**
 * A tab that can be used on the tab bar to represent a view
 * on the mission map.
 */
export default function Tab({
  _id,
  text,
  color,
  selected,
  description = '',
  menuOptions = [],
  getOptionDescription = () => '',
  onOptionClick = () => {},
  onClick = () => {},
}: TTab_P): JSX.Element | null {
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

  /**
   * The tab item for this tab.
   */
  const item: TTabBarTab = compute(() => ({
    _id,
    text,
    color,
    description,
    tabItemOptions: menuOptions,
    getOptionDescription,
    onOptionClick,
  }))

  /* -- FUNCTIONS -- */

  /**
   * Handles a button click.
   * @param button The button that was clicked.
   * @returns The callback for the button.
   */
  const onButtonClick = (button: TButtonSvgType) => onOptionClick(button, item)

  /**
   * Gets the description for a button.
   * @param button The button for which to get the description.
   * @returns The description for the button.
   */
  const getButtonDescription = (button: TButtonSvgType) =>
    getOptionDescription(button, item)

  /* -- RENDER -- */

  // Render root JSX.
  return (
    <div className={rootClass} style={rootStyle} onClick={onClick} ref={root}>
      <div className='Text' style={textStyle}>
        {text}
      </div>
      <div className='TextFade'></div>
      {/* <ButtonMenuController
        target={root}
        // todo: Add engine to button-menu controller.
        // engine={}
        highlightTarget={root.current ?? undefined}
        getDescription={getButtonDescription}
        onButtonClick={onButtonClick}
      /> */}
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
   * The tooltip description for the tab item.
   */
  description?: string
  /**
   * The options to display in the option menu for the tab item.
   * @default []
   * @note The option menu is displayed when the tab item is right-clicked.
   */
  menuOptions?: TButtonSvgType[]
  /**
   * Gets the description for an option button.
   * @param button The button for which to get the description.
   * @returns The description for the button, if null, the type
   * will be used in its plain text form.
   * @note If this function is not provided, the type will be
   * used in its plain text form.
   * @default () => ''
   */
  getOptionDescription?: (button: TButtonSvgType, item: TTabBarTab) => string
  /**
   * A callback for when a button in the option menu is clicked.
   * @param button The button that was clicked.
   * @default () => {}
   */
  onOptionClick?: (button: TButtonSvgType, item: TTabBarTab) => void
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
