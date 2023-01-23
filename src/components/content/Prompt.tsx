import React from 'react'
import Markdown, { MarkdownTheme } from './Markdown'
import './Prompt.scss'

export interface IPrompt {
  active: boolean
  promptMessage: string
  handleDismissal: () => void
  buttonDismissalText: string
}

export default class Prompt extends React.Component<IPrompt, {}> {
  static defaultProps = {
    buttonDismissalText: 'Ok',
  }

  // inherited
  render(): JSX.Element | null {
    let active: boolean = this.props.active
    let promptMessage: string = this.props.promptMessage
    let buttonDismissalText: string = this.props.buttonDismissalText
    let propmtClassName: string = `Prompt${active ? ' Active' : ''}`
    let messageClassName: string = `Message`
    let actionsClassName: string = 'Actions'
    let buttonDismissalClassName: string = `ButtonDismissal Button`

    return (
      <div className={propmtClassName}>
        <div className='Backing'>
          <div className='AlertBox'>
            <div className={messageClassName}>
              <Markdown
                theme={MarkdownTheme.ThemeSecondary}
                markdown={promptMessage}
              />
            </div>
            <div className={actionsClassName}>
              <div
                className={buttonDismissalClassName}
                onClick={() => this.props.handleDismissal()}
              >
                {buttonDismissalText}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
