import React from 'react'
import AjaxStatusDisplay, { AjaxStatus } from './AjaxStatusDisplay'
import Markdown, { MarkdownTheme } from './Markdown'
import './Confirmation.scss'

export interface IConfirmation {
  active: boolean
  confirmationMessage: string
  pendingAjaxCallMessage: string
  ajaxStatus: AjaxStatus
  handleConfirmation: () => void
  handleAlternative: (() => void) | null
  handleCancelation: () => void
  buttonCancelText: string
  buttonConfirmText: string
  buttonAlternateText: string
}

interface IConfirmation_S {}

export default class Confirmation extends React.Component<
  IConfirmation,
  IConfirmation_S
> {
  static defaultProps = {
    confirmationMessage: 'Please confirm this action.',
    pendingAjaxCallMessage: 'submitting...',
    handleAlternative: null,
    buttonCancelText: 'Cancel',
    buttonConfirmText: 'Confirm',
    buttonAlternateText: 'Other',
  }

  render(): JSX.Element | null {
    let ajaxStatus: AjaxStatus = this.props.ajaxStatus
    let active: boolean = this.props.active
    let handleAlternative: (() => void) | null = this.props.handleAlternative
    let confirmationMessage: string = this.props.confirmationMessage
    let pendingAjaxCallMessage: string = this.props.pendingAjaxCallMessage
    let buttonCancelText: string = this.props.buttonCancelText
    let buttonConfirmText: string = this.props.buttonConfirmText
    let buttonAlternateText: string = this.props.buttonAlternateText
    let confirmationClassName: string = `Confirmation${
      active ? ' active' : ''
    }${ajaxStatus === AjaxStatus.Pending ? ' pending' : ''}`
    let messageClassName: string = `message${
      ajaxStatus === AjaxStatus.Pending ? ' hidden' : ''
    }`
    let actionsClassName: string = `actions${
      ajaxStatus === AjaxStatus.Pending ? ' hidden' : ''
    }`
    let buttonAlternateClassName: string = `button-alternate button ${
      handleAlternative ? '' : ' hidden'
    }`
    return (
      <div className={confirmationClassName}>
        <div className='backing'>
          <div className='alert-box'>
            <div className={messageClassName}>
              <Markdown
                theme={MarkdownTheme.ThemeSecondary}
                markdown={confirmationMessage}
              />
            </div>
            <div className={actionsClassName}>
              <div
                className='button-cancel Button'
                onClick={this.props.handleCancelation}
              >
                {buttonCancelText}
              </div>
              <div
                className='button-confirm Button'
                onClick={this.props.handleConfirmation}
              >
                {buttonConfirmText}
              </div>
              <div
                className={buttonAlternateClassName}
                onClick={handleAlternative ? handleAlternative : () => {}}
              >
                {buttonAlternateText}
              </div>
            </div>
            <AjaxStatusDisplay
              status={ajaxStatus}
              pendingMessage={pendingAjaxCallMessage}
              style={{}}
            />
          </div>
        </div>
      </div>
    )
  }
}
