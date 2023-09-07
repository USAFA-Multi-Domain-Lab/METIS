import React from 'react'
import Tooltip from '../communication/Tooltip'
import './ButtonText.scss'
import { useDefaultProps } from 'metis/client/toolbox/hooks'

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
  // Extract props. Assign default props to
  // props passed as needed.
  let {
    text,
    handleClick,
    tooltipDescription,
    componentKey,
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

function SomeComponent() {
  return (
    <div>
      <ButtonText
        text={'Click me'}
        handleClick={() => {}}
        componentKey={'key'}
      />
    </div>
  )
}
