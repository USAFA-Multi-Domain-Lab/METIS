import React from 'react'
import { compute } from 'src/toolbox'
import Tooltip from '../../communication/Tooltip'
import './ButtonSvg.scss'

/* -- components -- */

/**
 * A button with an SVG icon.
 */
export default function ButtonSvg({
  type,
  size = 'regular',
  description: description = null,
  uniqueClassList = [],
  disabled = 'none',
  cursor = 'pointer',
  onClick,
  onCopy = () => {},
}: TButtonSvg_P): JSX.Element | null {
  /* -- computed -- */

  /**
   * The class for the root element.
   */
  const rootClass = compute((): string => {
    // Gather details.
    let classList: string[] = ['ButtonSvg', type, size, ...uniqueClassList]

    // Determine if the button is partially or fully disabled.
    if (disabled === 'partial') {
      classList.push('PartiallyDisabled')
    } else if (disabled === 'full') {
      classList.push('Disabled')
    }

    // Join and return class list.
    return classList.join(' ')
  })

  /**
   * The style for the root element.
   */
  const rootStyle = compute((): React.CSSProperties => {
    // Construct result.
    let result: React.CSSProperties = {}

    // Return as is if the type is '_blank'.
    if (type === '_blank') return result

    // Determine the background details based on size.
    switch (size) {
      case 'regular':
        result = {
          backgroundImage: `url(${require(`../../../../assets/images/icons/${type}.svg`)}), linear-gradient(to bottom, #1a2a1a 0% 100%)`,
          backgroundSize: '0.5em, cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }
        break
      case 'small':
        result = {
          backgroundImage: `url(${require(`../../../../assets/images/icons/${type}.svg`)})`,
          backgroundSize: '0.65em',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }
        break
      case 'wide':
        result = {
          backgroundImage: `url(${require(`../../../../assets/images/icons/${type}.svg`)})`,
          backgroundSize: '0.65em',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0% center',
        }
        break
    }

    // Offset the background position for 'upload' and
    // 'download' icons to center them.
    if (type === 'upload' || type === 'download') {
      result.backgroundPosition = 'center 0.25em, center'
    }

    // If a cursor is provided, use it.
    if (cursor) {
      result.cursor = cursor
    }

    // Return result.
    return result
  })

  /* -- RENDER -- */

  /**
   * The JSX for the description.
   */
  const descriptionJsx = compute<JSX.Element | null>(() => {
    // If there is no description, return null.
    if (!description) return null

    switch (size) {
      // Return the description as a tooltip
      // for 'small' and 'regular' sizes.
      case 'regular':
      case 'small':
        return <Tooltip description={description} />
      // Return the description as a label
      // for 'wide' size.
      case 'wide':
        return (
          <div className='ButtonLabel'>
            <div className='ButtonLabelText'>{description}</div>
          </div>
        )
    }
  })

  return (
    <div
      className={rootClass}
      style={rootStyle}
      onClick={onClick}
      onCopy={onCopy}
    >
      {descriptionJsx}
    </div>
  )
}

/* -- types -- */

/**
 * The size of a SVG button.
 */
export type TButtonSvgSize = 'small' | 'regular' | 'wide'

/**
 * Props for `ButtonSVG` component.
 */
export type TButtonSvg_P = {
  /**
   * The type of button.
   */
  type: TButtonSvgType
  /**
   * The size of the button.
   * @default 'regular'
   */
  size?: TButtonSvgSize
  /**
   * The description for the button.
   * @note In 'small' and 'regular' sizes, this will be
   * displayed as a tooltip, with 'wide' size, this will
   * be displayed as beside the icon at all times.
   * @default null
   */
  description?: string | null
  /**
   * Unique class lists to apply to the component.
   * @default []
   */
  uniqueClassList?: string[]
  /**
   * The disabled state of the button.
   * @default 'none'
   */
  disabled?: 'partial' | 'full' | 'none'
  /**
   * Cursor styling used for the button.
   * @default 'pointer'
   */
  cursor?: string
  /**
   * Handles the click event for the button.
   * @param event The click event.
   */
  onClick: (event: React.MouseEvent) => void
  /**
   * Callback for a clipboard copy event.
   * @param event The clipboard event.
   * @default () => {}
   */
  onCopy?: (event: React.ClipboardEvent) => void
}

/**
 * The type of button being used.
 * @note Used to determine the icon to display.
 * ### Special Types
 * - `'_blank'`: Does not do anything and cannot be seen.
 * Acts as a filler when the space needs to be
 * filled up, but no button is required.
 */
export type TButtonSvgType =
  // ! If adding to list, please maintain
  // ! alphabetical order.
  | '_blank'
  | 'add'
  | 'ban'
  | 'cancel'
  | 'copy'
  | 'down'
  | 'download'
  | 'edit'
  | 'kick'
  | 'launch'
  | 'lock'
  | 'open'
  | 'options'
  | 'question'
  | 'remove'
  | 'reorder'
  | 'save'
  | 'search'
  | 'shell'
  | 'text-cursor'
  | 'upload'
  | 'user'
  | 'warning-transparent'
  | 'zoom-in'
  | 'zoom-out'
