// -- imports --

import React from 'react'
import './Toggle.scss'

/* -- enumerations */

export enum EToggleLockState {
  Unlocked,
  LockedActivation,
  LockedDeactivation,
}

// -- interfaces --

interface IProps {
  initiallyActivated: boolean
  lockState: EToggleLockState
  deliverValue: (activated: boolean, revert: () => void) => void
}

interface IState {
  activated: boolean
}

// -- classes --

export default class Toggle extends React.Component<IProps, IState> {
  state: IState

  static defaultProps = {
    initialValue: false,
    lockState: EToggleLockState.Unlocked,
  }

  constructor(props: IProps) {
    super(props)
    this.state = {
      activated: false,
    }
  }

  componentDidMount(): void {
    let initiallyActivated: boolean = this.props.initiallyActivated
    this.setState({ activated: initiallyActivated })
  }

  componentDidUpdate(): void {
    let activated: boolean = this.state.activated
    let lockState: EToggleLockState = this.props.lockState
    switch (lockState) {
      case EToggleLockState.LockedActivation:
        if (!activated) {
          this.setState({ activated: true }, () =>
            this.props.deliverValue(this.state.activated, this.revert),
          )
        }
        break
      case EToggleLockState.LockedDeactivation:
        if (activated) {
          this.setState({ activated: false }, () =>
            this.props.deliverValue(this.state.activated, this.revert),
          )
        }
        break
      default:
        break
    }
  }

  revert = (): void => {
    this.setState({ activated: !this.state.activated })
  }

  // inherited
  render(): JSX.Element | null {
    let activated: boolean = this.state.activated
    let lockState: EToggleLockState = this.props.lockState
    let className: string = `Toggle${activated ? ' Activated' : ''}${
      lockState !== EToggleLockState.Unlocked ? ' Locked' : ''
    }`
    return (
      <div
        className={className}
        onClick={() => {
          this.setState({ activated: !activated }, () => {
            if (lockState === EToggleLockState.Unlocked) {
              this.props.deliverValue(this.state.activated, this.revert)
            }
          })
        }}
      >
        <div className='Switch'></div>
      </div>
    )
  }
}
