import React from 'react'
import Markdown, { MarkdownTheme } from '../general-layout/Markdown'
import { ButtonText } from '../user-controls/ButtonText'
import './Prompt.scss'

/**
 * A modal-based prompt that asks the user to make a choice between various options. Once a choice
 * is a made, a pending message will be displayed until the this component is unmounted.
 */
export default class Prompt<TChoice extends string> extends React.Component<
  TPrompt_P<TChoice>,
  TPrompt_S<TChoice>
> {
  /**
   * Ref for the text field form.
   */
  private textFieldInput = React.createRef<HTMLInputElement>()
  private submitButton = React.createRef<HTMLButtonElement>()

  // Overridden
  public state: TPrompt_S<TChoice> = {
    choice: null,
    resolving: false,
  }

  /* -- callback -- */

  /**
   * Called on form submission of text field.
   */
  private onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Gather details.
    const { choice } = this.state
    const { resolve } = this.props

    // Resolve the choice with the text.
    this.setState({ resolving: true }, () => {
      // If the choice is not set, throw an error.
      if (!choice) {
        throw new Error('Form submitted, but choice is null.')
      }
      // Check if text field input ref is available.
      if (!this.textFieldInput.current) {
        throw new Error('Text field cannot be found in the DOM.')
      }

      // Resolve.
      resolve({ choice, text: this.textFieldInput.current.value })
    })
  }

  /* -- render -- */

  /**
   * @returns The JSX for the confirmation message.
   */
  protected get messageJsx(): JSX.Element | null {
    // Gather details.
    const { message } = this.props

    // Render JSX.
    return (
      <div className='message'>
        <Markdown theme={MarkdownTheme.ThemeSecondary} markdown={message} />
      </div>
    )
  }

  /**
   * @returns The JSX for the text field.
   */
  protected get textFieldJsx(): JSX.Element | null {
    // If there is a text field, render it.
    if (this.props.textField) {
      // Gather details.
      const {
        label,
        placeholder,
        minLength,
        maxLength,
        pattern,
        initialValue = '',
      } = this.props.textField

      return (
        <form className='text-field' onSubmit={this.onFormSubmit}>
          <div className='label'>{label}:</div>
          <input
            className='field'
            ref={this.textFieldInput}
            type='text'
            placeholder={placeholder}
            required={true}
            minLength={minLength}
            maxLength={maxLength}
            pattern={pattern}
            defaultValue={initialValue}
          />
          <button
            ref={this.submitButton}
            type='submit'
            title='Submit'
            style={{ display: 'none' }}
          />
        </form>
      )
    }
    // Else, return null.
    else {
      return null
    }
  }

  /**
   * @returns The JSX for the confirmation actions.
   */
  protected get actionsJsx(): JSX.Element | null {
    // Gather details.
    const { choices, resolve } = this.props

    // Render JSX.
    return (
      <div className='actions'>
        {choices.map((choice) => (
          <ButtonText
            key={choice}
            text={choice}
            onClick={() => {
              this.setState({ choice }, () => {
                // Gather details.
                let { textField } = this.props

                // If there is no text field, resolve
                // right away.
                if (!textField || !textField.boundChoices.includes(choice)) {
                  this.setState({ resolving: true }, () =>
                    resolve({ choice, text: '' }),
                  )
                }
                // Else submit text field form to allow for
                // validation.
                else {
                  // Check if submit button ref is available.
                  if (!this.submitButton.current) {
                    throw new Error('Text field cannot be found in the DOM.')
                  }

                  // Click the submit button.
                  this.submitButton.current.click()
                }
              })
            }}
          />
        ))}
      </div>
    )
  }

  // Implemented
  public render(): JSX.Element | null {
    // Gather details.
    let rootClassList: string[] = ['Prompt']

    // Add 'resolving' class if resolving.
    if (this.state.resolving) {
      rootClassList.push('resolving')
    }
    // Else, add 'unresolved' class.
    else {
      rootClassList.push('unresolved')
    }

    // Render JSX.
    return (
      <div className={rootClassList.join(' ')}>
        <div className='backing'>
          <div className='alert-box'>
            {this.messageJsx}
            {this.textFieldJsx}
            {this.actionsJsx}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Standard choices for a prompt seeking the confirmation of an action.
   */
  public static ConfirmationChoices: ['Cancel', 'Confirm'] = [
    'Cancel',
    'Confirm',
  ]

  /**
   * Standard choices for a prompt seeking a yes/no answer.
   */
  public static YesNoChoices: ['Yes', 'No'] = ['Yes', 'No']

  /**
   * Standard choices a simple alert that requires the user only to dismiss it.
   */
  public static AlertChoices: ['OK'] = ['OK']
}

/* -- types -- */

/**
 * Prop type for `Prompt` component.
 */
export type TPrompt_P<TChoice extends string> = {
  /**
   * The message to display to the user prompting to make a choice.
   */
  message: string
  /**
   * The choices that the user can make for the prompt.
   */
  choices: TChoice[]
  /**
   * A text field that the user can enter text into before making a choice.
   * @default undefined
   * @note If `undefined`, no text field will be displayed.
   */
  textField?: TPromptTextField<TChoice>
  /**
   * Resolves the choice made by the user.
   * @param result The data given to the caller to resolve the choice made by the user.
   */
  resolve: (result: TPromptResult<TChoice>) => void
}

/**
 * Text field type for `Prompt` component.
 */
export type TPromptTextField<TChoice extends string> = {
  /**
   * The choices bound to the text field. This will make the
   * text field required in order to make any of the given
   * choices. Any non-included choices will not require the
   * text field to be filled out.
   */
  boundChoices: TChoice[]
  /**
   * The label given to the text field.
   * @default undefined
   * @note If `undefined`, no label will be displayed.
   */
  label: string
  /**
   * The placeholder text for the text field.
   * @default undefined
   * @note If `undefined`, no placeholder text will be displayed.
   */
  placeholder?: string
  /**
   * A minimum length for the text field.
   * @default undefined
   * @note If `undefined`, no minimum length will be enforced.
   */
  minLength?: number
  /**
   * A maximum length for the text field.
   * @default undefined
   * @note If `undefined`, no maximum length will be enforced.
   */
  maxLength?: number
  /**
   * The pattern that the text field must match.
   * @default undefined
   * @note If `undefined`, no pattern will be enforced.
   */
  pattern?: string
  /**
   * The initial value of the text field.
   * @default ''
   */
  initialValue?: string
}

/**
 * State type for `Confirmation` component.
 */
export type TPrompt_S<TChoice extends string> = {
  /**
   * The choice selected by the user.
   * @default null
   * @note If `null`, the user has not made a choice yet.
   */
  choice: TChoice | null
  /**
   * Whether the prompt is being resolved.
   * @default false
   */
  resolving: boolean
}

/**
 * Prompt results after the user has made a choice.
 */
export type TPromptResult<TChoice extends string> = {
  /**
   * The choice made by the user.
   */
  choice: TChoice
  /**
   * Text entered by the user.
   * @note This will be '' un
   */
  text: string
}
