import React from 'react'
import { compute } from 'src/toolbox'
import { useDefaultProps } from 'src/toolbox/hooks'
import Tooltip from '../communication/Tooltip'
import './ButtonText.scss'

/* -- COMPONENT -- */

// A button with normal text
// that performs a given action.
export function ButtonText(props: TButtonText_P): JSX.Element | null {
  // Extract props. Assign default props to
  // props passed as needed.
  let {
    text,
    onClick: onClick,
    tooltipDescription,
    uniqueClassName,
    style,
    disabled,
  } = useDefaultProps(props, {
    tooltipDescription: null,
    uniqueClassName: '',
    style: {},
    disabled: 'none',
  })

  /**
   * The class name for the button.
   */
  const className: string = compute(() => {
    // Create a list of class names.
    let classList: string[] = ['ButtonText']
    // Add the disabled class if the button is disabled.
    if (disabled === 'full') {
      classList.push('Disabled')
    }
    // Add the partially disabled class if the button is partially disabled.
    if (disabled === 'partial') {
      classList.push('PartiallyDisabled')
    }
    // Add the unique class name if it exists.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }
    // Return the class list as a string.
    return classList.join(' ')
  })

  // Render.
  return (
    <div className={className} style={style} onClick={onClick}>
      <span className='Bracket LeftBracket'>{'['}</span>
      <span className='Text'>{text}</span>
      <span className='Bracket RightBracket'>{']'}</span>
      {tooltipDescription ? <Tooltip description={tooltipDescription} /> : null}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for `ButtonText`.
 */
export interface TButtonText_P {
  /**
   * The text for the button.
   */
  text: string
  /**
   * Handles the click event for the button.
   * @param event The click event.
   */
  onClick: (event: React.MouseEvent) => void
  /**
   * The description for the tooltip. If null, no tooltip is displayed.
   * @default null
   */
  tooltipDescription?: string | null
  /**
   * Unique class name to apply to the component.
   * @default ''
   */
  uniqueClassName?: string
  /**
   * The style for the button
   * @default {}
   */
  style?: React.CSSProperties
  /**
   * The disabled state of the button.
   * @default 'none'
   */
  disabled?: 'partial' | 'full' | 'none'
}
