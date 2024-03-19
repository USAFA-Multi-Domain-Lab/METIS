import React from 'react'
import { useDefaultProps } from 'src/toolbox/hooks'
import Tooltip from '../communication/Tooltip'
import './ButtonText.scss'

/* -- interfaces -- */

// Interface for props for ButtonText component.
export interface TButtonText {
  text: string
  onClick: (event: React.MouseEvent) => void
  tooltipDescription?: string | null
  uniqueClassName?: string
  style?: React.CSSProperties
  disabled?: boolean
}

/* -- classes -- */

// A button with normal text
// that performs a given action.
export function ButtonText(props: TButtonText): JSX.Element | null {
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
    disabled: false,
  })

  // Create class name.
  let className: string = `ButtonText ${
    disabled ? ' Disabled ' : ' '
  }${uniqueClassName}`

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
