import React from 'react'
import { MiniButtonSVG } from './MiniButtonSVG'
import '../sass/ButtonSVGPanel.scss'

export interface IMiniButtonSVGPanel {
  buttons: MiniButtonSVG[]
  linkBack: JSX.Element | null
  styling: React.CSSProperties
  uniqueClassName: string
}

export class MiniButtonSVGPanel extends React.Component<
  IMiniButtonSVGPanel,
  {}
> {
  static defaultProps = {
    styling: {},
    uniqueClassName: '',
  }

  render(): JSX.Element | null {
    let uniqueClassName: string = this.props.uniqueClassName

    return (
      <div
        className={`MiniButtonSVGPanel ${uniqueClassName}`}
        style={this.props.styling}
      >
        <div className='glue'>
          {this.props.linkBack}
          {this.props.buttons.map((button: MiniButtonSVG) => {
            return button.render()
          })}
        </div>
      </div>
    )
  }
}
