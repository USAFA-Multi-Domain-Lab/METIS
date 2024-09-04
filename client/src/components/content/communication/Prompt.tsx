import React from 'react'
import List, { ESortByMethod } from '../general-layout/List'
import Markdown, { MarkdownTheme } from '../general-layout/Markdown'
import { ButtonText } from '../user-controls/ButtonText'
import './Prompt.scss'

/**
 * A modal-based prompt that asks the user to make a choice between various options. Once a choice
 * is a made, a pending message will be displayed until the this component is unmounted.
 */
export default class Prompt<
  TChoice extends string,
  TList extends object = {},
> extends React.Component<TPrompt_P<TChoice, TList>, TPrompt_S<TChoice>> {
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
    let { choice } = this.state
    const { resolve, defaultChoice } = this.props
    console.log(choice, defaultChoice)
    // If the choice is not set and there is
    // a default choice, set the default choice.
    if (!choice && defaultChoice) choice = defaultChoice
    // If the choice is still not set, return.
    if (!choice) return

    // Resolve the choice with the text.
    this.setState({ resolving: true }, () => {
      // Check if text field input ref is available.
      if (!this.textFieldInput.current) {
        throw new Error('Text field cannot be found in the DOM.')
      }

      // Resolve.
      resolve({ choice: choice!, text: this.textFieldInput.current.value })
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
   * @returns The JSX for the list.
   */
  protected get listJsx(): JSX.Element | null {
    if (this.props.list) {
      // Gather details.
      const {
        items,
        headingText,
        sortByMethods,
        nameProperty,
        searchableProperties,
        renderObjectListItem,
      } = this.props.list

      return (
        <List<TList>
          items={items}
          renderItemDisplay={(object) => renderObjectListItem(object)}
          headingText={headingText}
          sortByMethods={sortByMethods}
          nameProperty={nameProperty}
          alwaysUseBlanks={false}
          searchableProperties={searchableProperties}
          noItemsDisplay={null}
          ajaxStatus={'Loaded'}
          applyItemStyling={() => {
            return {}
          }}
          itemsPerPage={null}
          listSpecificItemClassName='AltDesign2 PromptList'
        />
      )
    } else {
      return null
    }
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
    const { choices, resolve, capitalizeChoices } = this.props

    // Render JSX.
    return (
      <div className='actions'>
        {choices.map((choice) => {
          // Gather details.
          let text: string = choice

          // Capitalize the first letter of the choice,
          // if specified.
          if (capitalizeChoices) {
            text = text.charAt(0).toUpperCase() + text.slice(1)
          }

          // Render JSX.
          return (
            <ButtonText
              key={choice}
              text={text}
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
          )
        })}
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
            {this.listJsx}
            {this.textFieldJsx}
            {this.actionsJsx}
          </div>
        </div>
      </div>
    )
  }

  // Overridden
  public static defaultProps() {
    return {
      capitalizeChoices: false,
      defaultChoice: null,
    }
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
export type TPrompt_P<TChoice extends string, TList extends object = {}> = {
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
   * Capitalizes the first letter of each choice when displaying
   * the choices to the user, but keeps the data in the original
   * casing.
   * @default false
   * @example
   * ```typescript
   * // Raw choices:
   * ['apple', 'banana', 'cherry']
   * // Displayed to user:
   * ['Apple', 'Banana', 'Cherry']
   * ```
   */
  capitalizeChoices?: boolean
  /**
   * A list of items to display to the user.
   * @note This allows for a dynamic list of items to be displayed
   * to the user to interact with.
   * @default undefined
   * @param items The items to display to the user.
   * @param headingText The heading text for the list.
   * @param sortByMethods The methods to sort the items by.
   * @param searchableProperties The properties to search the items by.
   * @param renderObjectListItem The JSX to render for each item.
   *
   * ***Optional:***
   * @param nameProperty The property to use as the name for each item.
   *
   * @example
   * ```typescript
   * {
   *  list: {
   *    items: [{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }],
   *    headingText: 'Fruits',
   *    sortByMethods: ['name'],
   *    searchableProperties: ['name'],
   *    nameProperty: 'name',
   *    renderObjectListItem: (object) => {
   *      return <div onClick={() => setState(object)}>{object.name}</div>
   *    }
   *  }
   * }
   * ```
   */
  list?: TPromptList<TList>
  /**
   * Default choice made when enter is pressed.
   * @default null
   * @note If `null`, prompt will not resolve on enter.
   */
  defaultChoice?: TChoice | null
  /**
   * Resolves the choice made by the user.
   * @param result The data given to the caller to resolve the choice made by the user.
   */
  resolve: (result: TPromptResult<TChoice, TList>) => void
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
export type TPromptResult<TChoice extends string, TList extends object = {}> = {
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

/**
 * Choices for a prompt with a cancel choice included.
 */
export type TChoicesWithCancel<T extends string> = 'Cancel' | T

/**
 * Propterties for a list to display to the user.
 */
type TPromptList<TList extends object = {}> = {
  /**
   * The items to display to the user.
   */
  items: TList[]
  /**
   * The heading text for the list.
   */
  headingText: string
  /**
   * The methods to sort the items by.
   */
  sortByMethods: ESortByMethod[]
  /**
   * The properties to search the items by.
   */
  searchableProperties: string[]
  /**
   * The property to use as the name for each item.
   */
  nameProperty?: string
  /**
   * The JSX to render for each item.
   */
  renderObjectListItem: (object: TList) => string | JSX.Element
}
