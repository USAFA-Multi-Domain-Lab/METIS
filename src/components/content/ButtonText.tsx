import React from 'react'
import Tooltip from './Tooltip'
import './ButtonText.scss'

/* -- interfaces -- */

// Interface for props for ButtonText component.
export interface IButtonText {
  text: string
  handleClick: (event: React.MouseEvent) => void
  tooltipDescription: string | null
  componentKey: string | undefined
  uniqueClassName: string
  style: React.CSSProperties
  disabled: boolean
}

/* -- classes -- */

// A button with normal text
// that performs a given action.
export class ButtonText extends React.Component<IButtonText, {}> {
  static defaultProps = {
    tooltipDescription: null,
    componentKey: undefined,
    uniqueClassName: '',
    style: {},
    disabled: false,
  }

  // inherited
  render(): JSX.Element | null {
    let text: string = this.props.text
    let tooltipDescription: string | null = this.props.tooltipDescription
    let key: string | undefined = this.props.componentKey
    let uniqueClassName: string = this.props.uniqueClassName
    let style: React.CSSProperties = this.props.style
    let disabled: boolean = this.props.disabled
    let className: string = `ButtonText ${
      disabled ? ' Disabled ' : ' '
    }${uniqueClassName}`

    return (
      <div
        className={className}
        style={style}
        key={key ? key : className}
        onClick={this.props.handleClick}
      >
        <span className='Bracket LeftBracket'>{'['}</span>
        <span className='Text'>{text}</span>
        <span className='Bracket RightBracket'>{']'}</span>
        {tooltipDescription ? (
          <Tooltip description={tooltipDescription} />
        ) : null}
      </div>
    )
  }
}
