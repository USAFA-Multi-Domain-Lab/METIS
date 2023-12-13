import React from 'react'
import { TAjaxStatus } from '../../../../../shared/toolbox/ajax'
import './AjaxStatusDisplay.scss'

// -- interfaces --

interface IProps {
  status: TAjaxStatus
  pendingMessage: string
  style: React.CSSProperties
  inline: boolean
}

interface IState {}

// -- classes --

export default class AjaxStatusDisplay extends React.Component<IProps, IState> {
  // -- fields --

  static defaultProps = {
    pendingMessage: 'loading...',
    style: {},
    inline: false,
  }
  state: IState = {}

  // -- functions | render --

  render() {
    let status: TAjaxStatus = this.props.status
    let pendingMessage: string = this.props.pendingMessage
    let content: JSX.Element = <div></div>
    let className: string = 'AjaxStatusDisplay'
    let style: React.CSSProperties = this.props.style
    className += !this.props.inline ? '' : ' inline'
    switch (status) {
      case 'NotLoaded':
        content = <div className='status inactive hidden' style={style}></div>
        break
      case 'Loading':
        content = (
          <div className='status pending' style={style}>
            {pendingMessage}
          </div>
        )
        break
      case 'Loaded':
        content = <div className='status loaded hidden' style={style}></div>
        break
      case 'Error':
        content = (
          <div className='status error' style={style}>
            server-error | 500
          </div>
        )
        break
    }
    return <div className={className}>{content}</div>
  }
}
