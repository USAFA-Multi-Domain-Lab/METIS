import React from 'react'
import Tooltip from '../communication/Tooltip'
import './MiniButtonSVG.scss'

/* -- interfaces -- */

// the purpose of a mini button, helps
// give different buttons different
// icons and looks
export enum EMiniButtonSVGPurpose {
  Cancel,
  Add,
  Edit,
  Remove,
  Down,
  Reorder,
  ZoomIn,
  ZoomOut,
  Save,
  Copy,
  Upload,
  Download,
  Launch,
}

// Interface for props for MiniButtonSVG component.
export interface IMiniButtonSVG {
  purpose: EMiniButtonSVGPurpose
  handleClick: (event: React.MouseEvent) => void
  handleCopy: (event: React.ClipboardEvent) => void
  tooltipDescription: string | null
  componentKey: string | undefined
  uniqueClassName: string
  style: React.CSSProperties
  disabled: boolean
}

/* -- classes -- */

// something represented by an icon,
// explained by a tooltip, that when
// clicked calls back to cause an action
export class MiniButtonSVG extends React.Component<IMiniButtonSVG, {}> {
  static defaultProps = {
    handleCopy: () => {},
    tooltipDescription: null,
    componentKey: undefined,
    uniqueClassName: '',
    style: {},
    disabled: false,
  }

  // different buttons are styled differently.
  // based on the purpose of the button, a class
  // name is returned to style it differently
  static getButtonClassName(purpose: EMiniButtonSVGPurpose): string {
    switch (purpose) {
      case EMiniButtonSVGPurpose.Cancel:
        return 'MiniButtonSVG cancel'
      case EMiniButtonSVGPurpose.Add:
        return 'MiniButtonSVG add'
      case EMiniButtonSVGPurpose.Edit:
        return 'MiniButtonSVG edit'
      case EMiniButtonSVGPurpose.Remove:
        return 'MiniButtonSVG remove'
      case EMiniButtonSVGPurpose.Down:
        return 'MiniButtonSVG down'
      case EMiniButtonSVGPurpose.Reorder:
        return 'MiniButtonSVG reorder'
      case EMiniButtonSVGPurpose.ZoomIn:
        return 'MiniButtonSVG zoom-in'
      case EMiniButtonSVGPurpose.ZoomOut:
        return 'MiniButtonSVG zoom-out'
      case EMiniButtonSVGPurpose.Save:
        return 'MiniButtonSVG save'
      case EMiniButtonSVGPurpose.Copy:
        return 'MiniButtonSVG copy'
      case EMiniButtonSVGPurpose.Upload:
        return 'MiniButtonSVG upload'
      case EMiniButtonSVGPurpose.Download:
        return 'MiniButtonSVG download'
      case EMiniButtonSVGPurpose.Launch:
        return 'MiniButtonSVG launch'
      default:
        return 'MiniButtonSVG hidden'
    }
  }

  // html content for various buttons
  static getButtonInnerHTML(
    purpose: EMiniButtonSVGPurpose,
  ): string | JSX.Element {
    switch (purpose) {
      case EMiniButtonSVGPurpose.Cancel:
        return 'x'
      case EMiniButtonSVGPurpose.Add:
        return '+'
      default:
        return ''
    }
  }

  // inherited
  render(): JSX.Element | null {
    let purpose: EMiniButtonSVGPurpose = this.props.purpose
    let tooltipDescription: string | null = this.props.tooltipDescription
    let key: string | undefined = this.props.componentKey
    let uniqueClassName: string = this.props.uniqueClassName
    let style: React.CSSProperties = this.props.style
    let disabled: boolean = this.props.disabled
    let className: string = `${MiniButtonSVG.getButtonClassName(purpose)}${
      disabled ? ' Disabled ' : ' '
    }${uniqueClassName}`
    let innerHTML: string | JSX.Element =
      MiniButtonSVG.getButtonInnerHTML(purpose)

    return (
      <div
        className={className}
        style={style}
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
