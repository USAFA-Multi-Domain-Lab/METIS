import React from 'react'
import { ButtonSVG } from './ButtonSVG'
import './ButtonSVGPanel.scss'

export interface IButtonSVGPanel {
  buttons: ButtonSVG[]
  linkBack: JSX.Element | null
  styling: React.CSSProperties
  uniqueClassName: string
}

export class ButtonSVGPanel extends React.Component<IButtonSVGPanel, {}> {
  static defaultProps = {
    styling: {},
    uniqueClassName: '',
  }

  render(): JSX.Element | null {
    let uniqueClassName: string = this.props.uniqueClassName

    return (
      <div
        className={`ButtonSVGPanel ${uniqueClassName}`}
        style={this.props.styling}
      >
        <div className='glue'>
          {this.props.linkBack}
          {this.props.buttons.map((button: ButtonSVG) => {
            return button.render()
          })}
        </div>
      </div>
    )
  }
}
