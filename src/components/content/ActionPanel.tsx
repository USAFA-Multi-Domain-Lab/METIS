import React from 'react'
import { Action } from './Action'
import './ActionPanel.scss'

export interface IActionPanel {
  actions: Action[]
  linkBack: JSX.Element | null
  styling: React.CSSProperties
  uniqueClassName: string
}

export class ActionPanel extends React.Component<IActionPanel, {}> {
  static defaultProps = {
    styling: {},
    uniqueClassName: '',
  }

  render(): JSX.Element | null {
    let uniqueClassName: string = this.props.uniqueClassName

    return (
      <div
        className={`ActionPanel ${uniqueClassName}`}
        style={this.props.styling}
      >
        <div className='glue'>
          {this.props.linkBack}
          {this.props.actions.map((action: Action) => {
            return action.render()
          })}
        </div>
      </div>
    )
  }
}
