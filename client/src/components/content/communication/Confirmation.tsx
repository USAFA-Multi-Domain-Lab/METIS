import React from 'react'
import { TAjaxStatus } from '../../../../../shared/toolbox/ajax'
import Markdown, { MarkdownTheme } from '../general-layout/Markdown'
import { ButtonText } from '../user-controls/ButtonText'
import AjaxStatusDisplay from './AjaxStatusDisplay'
import './Confirmation.scss'

export interface IConfirmation {
  active: boolean
  confirmationMessage: string
  pendingMessageUponConfirm: string
  pendingMessageUponAlternate: string
  confirmAjaxStatus: TAjaxStatus
  alternateAjaxStatus: TAjaxStatus
  handleConfirmation: (entry: string) => void
  handleAlternate: ((entry: string) => void) | null
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
    pendingMessageUponConfirm: 'Submitting...',
    pendingMessageUponAlternate: 'Submitting...',
    handleAlternate: null,
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
    let confirmAjaxStatus: TAjaxStatus = this.props.confirmAjaxStatus
    let alternateAjaxStatus: TAjaxStatus = this.props.alternateAjaxStatus
    let active: boolean = this.props.active
    let handleAlternate = this.props.handleAlternate
    let confirmationMessage: string = this.props.confirmationMessage
    let pendingMessageUponConfirm: string = this.props.pendingMessageUponConfirm
    let pendingMessageUponAlternate: string =
      this.props.pendingMessageUponAlternate
    let buttonCancelText: string = this.props.buttonCancelText
    let buttonConfirmText: string = this.props.buttonConfirmText
    let buttonAlternateText: string = this.props.buttonAlternateText
    let requireEntry: boolean = this.props.requireEntry
    let entryLabel: string = this.props.entryLabel
    let entry: string = this.state.entry
    let readyToConfirm: boolean = !requireEntry || entry.length > 0

    let confirmationClassName: string = `Confirmation${
      active ? ' active' : ''
    }${
      confirmAjaxStatus === 'Loading' || alternateAjaxStatus === 'Loading'
        ? ' pending'
        : ''
    }`
    let messageClassName: string = `message${
      confirmAjaxStatus === 'Loading' || alternateAjaxStatus === 'Loading'
        ? ' hidden'
        : ''
    }`
    let entryClassName: string = `entry${
      !requireEntry ||
      confirmAjaxStatus === 'Loading' ||
      alternateAjaxStatus === 'Loading'
        ? ' hidden'
        : ''
    }`
    let actionsClassName: string = `actions${
      confirmAjaxStatus === 'Loading' || alternateAjaxStatus === 'Loading'
        ? ' hidden'
        : ''
    }`
    let buttonConfirmClassName: string = readyToConfirm ? '' : ' Disabled'
    let buttonAlternateClassName: string = handleAlternate ? '' : ' hidden'

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
              <ButtonText
                text={buttonCancelText}
                onClick={this.props.handleCancelation}
              />
              <ButtonText
                text={buttonConfirmText}
                onClick={() => this.props.handleConfirmation(this.state.entry)}
                uniqueClassName={buttonConfirmClassName}
              />
              <ButtonText
                text={buttonAlternateText}
                onClick={
                  handleAlternate
                    ? () => {
                        if (handleAlternate) {
                          handleAlternate(this.state.entry)
                        }
                      }
                    : () => {}
                }
                uniqueClassName={buttonAlternateClassName}
              />
            </div>
            <AjaxStatusDisplay
              status={confirmAjaxStatus}
              pendingMessage={pendingMessageUponConfirm}
            />
            <AjaxStatusDisplay
              status={alternateAjaxStatus}
              pendingMessage={pendingMessageUponAlternate}
            />
          </div>
        </div>
      </div>
    )
  }
}
