import React from 'react'
import AjaxStatusDisplay, { AjaxStatus } from './AjaxStatusDisplay'
import Markdown, { MarkdownTheme } from './Markdown'
import './Confirmation.scss'

export interface IConfirmation {
  active: boolean
  confirmationMessage: string
  pendingAjaxCallMessage: string
  ajaxStatus: AjaxStatus
  handleConfirmation: (entry?: string) => void
  handleAlternative: (() => void) | null
  handleCancelation: () => void
  buttonCancelText: string
  buttonConfirmText: string
  buttonAlternateText: string
  requireEntry: boolean
  entryLabel: string
}

interface IConfirmation_S {
  entry: string
}

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
    requireEntry: false,
    entryLabel: 'Entry',
  }

  state: IConfirmation_S = {
    entry: '',
  }

  // Called when the entry field
  // is updated with new text.
  handleEntryChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({ entry: event.target.value })
  }

  // inherited
  render(): JSX.Element | null {
    let ajaxStatus: AjaxStatus = this.props.ajaxStatus
    let active: boolean = this.props.active
    let handleAlternative: (() => void) | null = this.props.handleAlternative
    let confirmationMessage: string = this.props.confirmationMessage
    let pendingAjaxCallMessage: string = this.props.pendingAjaxCallMessage
    let buttonCancelText: string = this.props.buttonCancelText
    let buttonConfirmText: string = this.props.buttonConfirmText
    let buttonAlternateText: string = this.props.buttonAlternateText
    let requireEntry: boolean = this.props.requireEntry
    let entryLabel: string = this.props.entryLabel
    let entry: string = this.state.entry
    let readyToConfirm: boolean = !requireEntry || entry.length > 0

    let confirmationClassName: string = `Confirmation${
      active ? ' active' : ''
    }${ajaxStatus === AjaxStatus.Pending ? ' pending' : ''}`
    let messageClassName: string = `message${
      ajaxStatus === AjaxStatus.Pending ? ' hidden' : ''
    }`
    let entryClassName: string = `entry${requireEntry ? '' : ' hidden'}`
    let actionsClassName: string = `actions${
      ajaxStatus === AjaxStatus.Pending ? ' hidden' : ''
    }`
    let buttonConfirmClassName: string = `'button-confirm Button${
      readyToConfirm ? '' : ' Disabled'
    }`
    let buttonAlternateClassName: string = `button-alternate Button ${
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
            <div className={entryClassName}>
              <div className='label'>{entryLabel}:</div>
              <input
                className='field'
                type='text'
                onChange={this.handleEntryChange}
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
                className={buttonConfirmClassName}
                onClick={() => this.props.handleConfirmation(this.state.entry)}
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
