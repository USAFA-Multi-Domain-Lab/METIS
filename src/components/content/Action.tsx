import React from 'react'
import Tooltip from './Tooltip'
import './Action.scss'

/* -- interfaces -- */

// the purpose of an action, helps
// give different actions different
// icons and looks
export enum EActionPurpose {
  Add,
  Edit,
  Down,
  Reorder,
  ZoomIn,
  ZoomOut,
  Save,
}

// Interface for props for Action component.
export interface IAction_P {
  purpose: EActionPurpose
  handleClick: (event: React.MouseEvent) => void
  handleCopy: (event: React.ClipboardEvent) => void
  tooltipDescription: string | null
  key: string | undefined
  uniqueClassName: string
}

/* -- classes -- */

// something represented by an icon,
// explained by a tooltip, that when
// clicked calls back to cause an action
export class Action extends React.Component<IAction_P, {}> {
  static defaultProps = {
    handleCopy: () => {},
    tooltipDescription: null,
    key: undefined,
    uniqueClassName: '',
  }

  // different actions are styled differently.
  // based on the purpose of the action, a class
  // name is returned to style it differently
  static getActionClassName(purpose: EActionPurpose): string {
    switch (purpose) {
      case EActionPurpose.Add:
        return 'Action add'
      case EActionPurpose.Edit:
        return 'Action edit'
      case EActionPurpose.Down:
        return 'Action down'
      case EActionPurpose.Reorder:
        return 'Action reorder'
      case EActionPurpose.ZoomIn:
        return 'Action zoom-in'
      case EActionPurpose.ZoomOut:
        return 'Action zoom-out'
      case EActionPurpose.Save:
        return 'Action save'
      default:
        return 'Action hidden'
    }
  }

  // html content for various actions
  static getActionInnerHTML(purpose: EActionPurpose): string | JSX.Element {
    switch (purpose) {
      case EActionPurpose.Add:
        return '+'
      default:
        return ''
    }
  }

  // inherited
  render(): JSX.Element | null {
    let purpose: EActionPurpose = this.props.purpose
    let tooltipDescription: string | null = this.props.tooltipDescription
    let key: string | undefined = this.props.key
    let uniqueClassName: string = this.props.uniqueClassName
    let className: string = `${Action.getActionClassName(
      purpose,
    )} ${uniqueClassName}`
    let innerHTML: string | JSX.Element = Action.getActionInnerHTML(purpose)

    return (
      <div
        className={className}
        key={key ? key : className}
        onClick={this.props.handleClick}
        onCopy={this.props.handleCopy}
      >
        {innerHTML}
        {tooltipDescription ? (
          <Tooltip description={tooltipDescription} />
        ) : null}
      </div>
    )
  }
}
