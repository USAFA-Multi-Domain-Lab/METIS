import React from 'react'
import Tooltip from '../communication/Tooltip'
import './ButtonSVG.scss'

/* -- interfaces -- */

// the purpose of a button, helps
// give different buttons different
// icons and looks
export enum EButtonSVGPurpose {
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
  Search,
}

// Interface for props for ButtonSVG component.
export interface IButtonSVG {
  purpose: EButtonSVGPurpose
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
export class ButtonSVG extends React.Component<IButtonSVG, {}> {
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
  static getButtonClassName(purpose: EButtonSVGPurpose): string {
    switch (purpose) {
      case EButtonSVGPurpose.Cancel:
        return 'ButtonSVG cancel'
      case EButtonSVGPurpose.Add:
        return 'ButtonSVG add'
      case EButtonSVGPurpose.Edit:
        return 'ButtonSVG edit'
      case EButtonSVGPurpose.Remove:
        return 'ButtonSVG remove'
      case EButtonSVGPurpose.Down:
        return 'ButtonSVG down'
      case EButtonSVGPurpose.Reorder:
        return 'ButtonSVG reorder'
      case EButtonSVGPurpose.ZoomIn:
        return 'ButtonSVG zoom-in'
      case EButtonSVGPurpose.ZoomOut:
        return 'ButtonSVG zoom-out'
      case EButtonSVGPurpose.Save:
        return 'ButtonSVG save'
      case EButtonSVGPurpose.Copy:
        return 'ButtonSVG copy'
      case EButtonSVGPurpose.Upload:
        return 'ButtonSVG upload'
      case EButtonSVGPurpose.Download:
        return 'ButtonSVG download'
      case EButtonSVGPurpose.Search:
        return 'ButtonSVG search'
      default:
        return 'ButtonSVG hidden'
    }
  }

  // html content for various buttons
  static getButtonInnerHTML(purpose: EButtonSVGPurpose): string | JSX.Element {
    switch (purpose) {
      case EButtonSVGPurpose.Cancel:
        return 'x'
      case EButtonSVGPurpose.Add:
        return '+'
      default:
        return ''
    }
  }

  // inherited
  render(): JSX.Element | null {
    let purpose: EButtonSVGPurpose = this.props.purpose
    let tooltipDescription: string | null = this.props.tooltipDescription
    let key: string | undefined = this.props.componentKey
    let uniqueClassName: string = this.props.uniqueClassName
    let style: React.CSSProperties = this.props.style
    let disabled: boolean = this.props.disabled
    let className: string = `${ButtonSVG.getButtonClassName(purpose)}${
      disabled ? ' Disabled ' : ' '
    }${uniqueClassName}`
    let innerHTML: string | JSX.Element = ButtonSVG.getButtonInnerHTML(purpose)

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
