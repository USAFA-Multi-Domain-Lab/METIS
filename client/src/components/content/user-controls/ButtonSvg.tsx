import React from 'react'
import { compute } from 'src/toolbox'
import Tooltip from '../communication/Tooltip'
import './ButtonSvg.scss'

/* -- components -- */

/**
 * A button with an SVG icon.
 */
export default function ButtonSvg({
  icon,
  size = 'regular',
  tooltipDescription = null,
  uniqueClassList = [],
  disabled = false,
  onClick,
  onCopy = () => {},
}: TButtonSvg): JSX.Element | null {
  /* -- computed -- */

  /**
   * The class for the root element.
   */
  const rootClass = compute((): string => {
    // Gather details.
    let classList: string[] = ['ButtonSvg', icon, size, ...uniqueClassList]

    // Push disabled class if disabled.
    if (disabled) {
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

    // Determine the background details based on size.
    switch (size) {
      case 'regular':
        result = {
          backgroundImage: `url(${require(`../../../assets/images/icons/${icon}.svg`)}), linear-gradient(to bottom, #1a2a1a 0% 100%)`,
          backgroundSize: '0.5em, cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }
        break
      case 'small':
        result = {
          backgroundImage: `url(${require(`../../../assets/images/icons/${icon}.svg`)})`,
          backgroundSize: '0.65em',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }
        break
    }

    // Offset the background position for 'upload' and
    // 'download' icons to center them.
    if (icon === 'upload' || icon === 'download') {
      result.backgroundPosition = 'center 0.25em, center'
    }

    // Return result.
    return result
  })

  /* -- render -- */

  return (
    <div
      className={rootClass}
      style={rootStyle}
      onClick={onClick}
      onCopy={onCopy}
    >
      {tooltipDescription ? <Tooltip description={tooltipDescription} /> : null}
    </div>
  )
}

/* -- types -- */

/**
 * The size of a SVG button.
 */
export type TButtonSvgSize = 'small' | 'regular'

/**
 * Props for `ButtonSVG` component.
 */
export type TButtonSvg = {
  /**
   * The icon for the button.
   */
  icon: TButtonSvgIcon
  /**
   * The size of the button.
   * @default 'regular'
   */
  size?: TButtonSvgSize
  /**
   * The description for the tooltip. If null, no tooltip is displayed.
   * @default null
   */
  tooltipDescription?: string | null
  /**
   * Unique class lists to apply to the component.
   * @default []
   */
  uniqueClassList?: string[]
  /**
   * Whether the button is currently disabled.
   * @default false
   */
  disabled?: boolean
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
 * The type of icon being used for the button.
 */
export type TButtonSvgIcon =
  | 'cancel'
  | 'add'
  | 'edit'
  | 'remove'
  | 'down'
  | 'reorder'
  | 'zoom-in'
  | 'zoom-out'
  | 'save'
  | 'copy'
  | 'upload'
  | 'download'
  | 'search'
  | 'launch'
  | 'lock'
  | 'kick'
  | 'ban'
  | 'user'
  | 'shell'
