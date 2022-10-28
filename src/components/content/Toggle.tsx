// -- imports --

import React from 'react'
import './Toggle.scss'

/* -- enumerations */

export enum ToggleLockState {
  Unlocked,
  LockedActivation,
  LockedDeactivation,
}

// -- interfaces --

interface IProps {
  initiallyActivated: boolean
  lockState: ToggleLockState
  deliverValue: (activated: boolean) => void
}

interface IState {
  activated: boolean
}

// -- classes --

export default class Toggle extends React.Component<IProps, IState> {
  state: IState

  static defaultProps = {
    initialValue: false,
    lockState: ToggleLockState.Unlocked,
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
    let lockState: ToggleLockState = this.props.lockState
    switch (lockState) {
      case ToggleLockState.LockedActivation:
        if (!activated) {
          this.setState({ activated: true }, () =>
            this.props.deliverValue(this.state.activated),
          )
        }
        break
      case ToggleLockState.LockedDeactivation:
        if (activated) {
          this.setState({ activated: false }, () =>
            this.props.deliverValue(this.state.activated),
          )
        }
        break
      default:
        break
    }
  }

  // inherited
  render(): JSX.Element | null {
    let activated: boolean = this.state.activated
    let lockState: ToggleLockState = this.props.lockState
    let className: string = `Toggle${activated ? ' Activated' : ''}${
      lockState !== ToggleLockState.Unlocked ? ' Locked' : ''
    }`
    return (
      <div
        className={className}
        onClick={() => {
          this.setState({ activated: !activated }, () => {
            if (lockState === ToggleLockState.Unlocked) {
              this.props.deliverValue(this.state.activated)
            }
          })
        }}
      >
        <div className='Switch'></div>
      </div>
    )
  }
}
