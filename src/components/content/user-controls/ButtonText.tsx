import React from 'react'
import Tooltip from '../communication/Tooltip'
import './ButtonText.scss'
import { useDefaultProps } from 'src/modules/hooks'

/* -- interfaces -- */

// Interface for props for ButtonText component.
export interface IButtonText {
  text: string
  handleClick: (event: React.MouseEvent) => void
  componentKey: string
  tooltipDescription?: string | null
  uniqueClassName?: string
  style?: React.CSSProperties
  disabled?: boolean
}

/* -- classes -- */

// A button with normal text
// that performs a given action.
export function ButtonText(props: IButtonText): JSX.Element | null {
  // Assign default props to
  // props passed as needed.
  useDefaultProps(props, {
    tooltipDescription: null,
    uniqueClassName: '',
    style: {},
    disabled: false,
  })

  // Extract props.
  let {
    text,
    handleClick,
    tooltipDescription,
    componentKey,
    uniqueClassName,
    style,
    disabled,
  } = props

  // Create class name.
  let className: string = `ButtonText ${disabled ? ' Disabled ' : ' '}${
    uniqueClassName ?? ''
  }`

  // Render.
  return (
    <div
      className={className}
      style={style}
      key={componentKey}
      onClick={handleClick}
    >
      <span className='Bracket LeftBracket'>{'['}</span>
      <span className='Text'>{text}</span>
      <span className='Bracket RightBracket'>{']'}</span>
      {tooltipDescription ? <Tooltip description={tooltipDescription} /> : null}
    </div>
  )
}
