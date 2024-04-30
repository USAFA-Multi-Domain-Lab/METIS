import React, { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { compute } from 'src/toolbox'
import inputs from 'src/toolbox/inputs'
import { ReactSetter } from 'src/toolbox/types'
import { AnyObject } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import Toggle, { TToggleLockState } from '../user-controls/Toggle'
import './Form.scss'

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailString({
  fieldType,
  handleOnBlur,
  label,
  stateValue,
  setState,
  // Optional Properties
  defaultValue = undefined,
  errorMessage = 'At least one character is required here.',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  inputType = 'text',
  placeholder = 'Enter text here...',
}: TDetailString_P): JSX.Element {
  /* -- STATE -- */
  const [leftField, setLeftField] = useState<boolean>(false)
  const [currentInputType, setCurrentInputType] = useState<TInput>(inputType)
  const [displayPasswordText, setDisplayPasswordText] = useState<
    'show' | 'hide'
  >('show')

  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => {
    let display: boolean = false

    // If the user has left the field and the
    // field is required and the error message
    // should be delivered, then display the error.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage !== 'At least one character is required here.'
    ) {
      display = true
    }

    // If the user has left the field and the
    // field is required and the error message
    // should be delivered and the field is empty,
    // then display the default error message.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage === 'At least one character is required here.' &&
      stateValue === ''
    ) {
      display = true
    }

    // Return the boolean.
    return display
  })
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // displayError is false.
    if (!displayError) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // If displayError is true then
    // add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // If displayError is true then
    // add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the input container.
   */
  const inputContainerClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['InputContainer']

    // If the input type is password then
    // add the password class name.
    if (inputType === 'password') {
      classList.push('Password')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the toggle password display container.
   * @note Appears as a button with the text "show" or "hide".
   */
  const togglePasswordButtonClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['TogglePasswordButton', fieldClassName]

    // If the input type is not "password" then
    // add the hidden class name.
    if (inputType !== 'password') {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The placeholder text being displayed.
   */
  const placeholderDisplayed: string = compute(() => {
    let placeholderText: string = placeholder

    if (inputType === 'password' && placeholder === 'Enter text here...') {
      placeholderText = 'Enter password here...'
    }

    return placeholderText
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    fieldType === 'optional' ? 'Optional' : 'Optional Hidden',
  )

  /* -- FUNCTIONS -- */

  /**
   * Toggles the display of the password.
   */
  const togglePasswordDisplay = (): void => {
    if (currentInputType === 'password') {
      setCurrentInputType('text')
      setDisplayPasswordText('hide')
    } else {
      setCurrentInputType('password')
      setDisplayPasswordText('show')
    }
  }

  /* -- RENDER -- */

  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className={inputContainerClassName}>
        <input
          className={fieldClassName}
          type={currentInputType}
          value={stateValue}
          placeholder={placeholderDisplayed}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string = target.value
            setState(value)
          }}
          onBlur={(event: React.FocusEvent) => {
            let target: HTMLInputElement = event.target as HTMLInputElement
            let value: string | undefined = target.value

            // Indicate that the user has left the field.
            // @note - This allows errors to be displayed.
            setLeftField(true)

            // If the field is empty or in a default
            // state and the error message is not displayed
            // and the default value is defined, but not an
            // empty string, and the field is required, then
            // set the input's value to a default value.
            if (
              (value === '' || value === undefined) &&
              !displayError &&
              handleOnBlur === 'repopulateValue' &&
              fieldType === 'required'
            ) {
              if (defaultValue !== undefined && defaultValue !== '') {
                setState(defaultValue)
              } else {
                setState(placeholderDisplayed)
              }
            }
          }}
        />
        <input
          className={togglePasswordButtonClassName}
          onClick={togglePasswordDisplay}
          type='button'
          value={displayPasswordText}
          disabled={inputType !== 'password'}
        />
      </div>
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/**
 * This will render a detail for
 * a form, with a label and a number
 * field for entering information.
 */
export function DetailNumber({
  fieldType,
  label,
  stateValue,
  setState,
  // Optional Properties
  minimum = undefined,
  maximum = undefined,
  integersOnly = false,
  unit = undefined,
  placeholder = 'Enter a number here...',
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  disabled = false,
}: TDetailNumber_P): JSX.Element | null {
  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailNumber']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    fieldType === 'optional' ? 'Optional' : 'Optional Hidden',
  )

  /* -- RENDER -- */
  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div className='Unit'>{unit}</div>
      <input
        className={fieldClassName}
        type='text'
        placeholder={placeholder}
        value={stateValue ?? ''}
        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
          // Enforce the input to only accept numeric characters.
          inputs.enforceNumbericCharsOnly(event)

          // If integersOnly is true then enforce the input to only accept integers.
          if (integersOnly) {
            inputs.enforceIntegersOnly(event)
          }

          // If a minimum value is passed and it is greater than or equal to 0,
          // then enforce the input to only accept non-negative numbers.
          if (minimum !== undefined && minimum >= 0) {
            inputs.enforceNonNegativeOnly(event)
          }
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          let target: HTMLInputElement = event.target as HTMLInputElement
          let value: number | null

          // If a minimum or maximum value is passed
          // then enforce the minimum and maximum values.
          if (minimum !== undefined) {
            inputs.enforceNumberFloor(event, minimum)
          }
          if (maximum !== undefined) {
            inputs.enforceNumberCap(event, maximum)
          }

          if (fieldType === 'required' && target.value === '') {
            // ...but the minimum value is greater than 0,
            // then set the input's value to the minimum value.
            if (minimum !== undefined && minimum > 0) {
              target.value = minimum.toString()
            }
            // Or, if the maximum value is less than 0,
            // then set the input's value to the maximum value.
            else if (maximum !== undefined && maximum < 0) {
              target.value = maximum.toString()
            }
            // Otherwise, set the input's value to 0.
            else {
              target.value = '0'
            }

            target.select()
          }

          // Convert the input's value to a number and
          // check if it is a number, then deliver the value.
          value = parseInt(target.value)
          value = isNaN(value) ? null : value

          // If the field is required and the value is not null,
          // then update the value.
          if (fieldType === 'required' && value !== null) {
            setState(value)
          }
          // If the field is optional, then update the value.
          if (fieldType === 'optional') {
            setState(value)
          }
        }}
      />
    </div>
  )
}

/**
 * This will render a detail for
 * a form, with a label and a text
 * field for entering information.
 */
export function DetailLargeString({
  fieldType,
  handleOnBlur,
  label,
  stateValue,
  setState,
  // Optional Properties
  defaultValue = undefined,
  errorMessage = 'At least one character is required here.',
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  placeholder = 'Enter text here...',
  elementBoundary = undefined,
}: TDetailLargeString_P): JSX.Element | null {
  /* -- STATE -- */
  const [leftField, setLeftField] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => {
    let display: boolean = false

    // If the user has left the field and the
    // field is required and the error message
    // should be delivered, then display the error.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage !== 'At least one character is required here.'
    ) {
      display = true
    }

    // If the user has left the field and the
    // field is required and the error message
    // should be delivered and the field is empty,
    // then display the default error message.
    if (
      leftField &&
      fieldType === 'required' &&
      handleOnBlur === 'deliverError' &&
      errorMessage === 'At least one character is required here.' &&
      stateValue === '<p><br></p>'
    ) {
      display = true
    }

    // Return the boolean.
    return display
  })
  /**
   * The root class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailBox']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // If displayError is true then
    // add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldBox']

    // If the error message is displayed
    // then add the error class name.
    if (displayError) {
      classList.push('Error')
    }

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // displayError is false.
    if (!displayError) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() =>
    fieldType === 'optional' ? 'Optional' : 'Optional Hidden',
  )

  /* -- PRE-RENDER PROCESSING -- */

  /**
   * The modules used by the ReactQuill component.
   */
  const reactQuillModules = {
    toolbar: {
      container: [
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['bold', 'italic', 'underline', 'link'],
        ['clean'],
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  }

  /**
   * The formats used by the ReactQuill component.
   */
  const reactQuillFormats = ['bold', 'italic', 'underline', 'link', 'list']

  /* -- RENDER -- */

  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{`${label}:`}</div>
        <div className={optionalClassName}>optional</div>
      </div>
      <div
        className='FieldContainer'
        onBlur={(event: React.FocusEvent) => {
          let target: HTMLDivElement = event.target as HTMLDivElement
          let value: string = target.innerHTML

          // Indicate that the user has left the field.
          // @note - This allows errors to be displayed.
          setLeftField(true)

          // If the field is empty or in a default
          // state and the error message is not displayed
          // and the default value is defined, but not an
          // empty string, and the field is required, then
          // set the input's value to a default value.
          if (
            (value === '<p><br></p>' || value === undefined) &&
            !displayError &&
            handleOnBlur === 'repopulateValue' &&
            fieldType === 'required'
          ) {
            if (defaultValue !== undefined && defaultValue !== '<p><br></p>') {
              setState(defaultValue)
            } else {
              setState(placeholder)
            }
          }
        }}
      >
        <ReactQuill
          bounds={elementBoundary}
          className={fieldClassName}
          modules={reactQuillModules}
          formats={reactQuillFormats}
          value={stateValue}
          placeholder={placeholder}
          theme='snow'
          onChange={(value: string) => setState(value)}
        />
      </div>
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/**
 * This will render a detail for
 * a form, with a label and a drop
 * down box for selecting from various
 * options.
 * @note If `TOption` can be null or undefined, passing null or undefined
 * will leave the drop down box unselected.
 */
export function DetailDropDown<TOption>({
  fieldType,
  label,
  options,
  stateValue,
  setState,
  isExpanded,
  renderDisplayName,
  // Optional Properties
  uniqueDropDownStyling = {},
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  uniqueStateValueClassName = undefined,
  disabled = false,
  uniqueOptionStyling = () => ({}),
  renderOptionClassName = () => '',
}: TDetailDropDown_P<TOption>): JSX.Element | null {
  /* -- STATE -- */
  const [expanded, setExpanded] = useState<boolean>(false)

  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailDropDown']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field', 'FieldDropDown']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // If the detail is expanded then add
    // the expanded class name
    if (expanded) {
      classList.push('IsExpanded')
    }
    // Otherwise add the collapsed class name.
    else {
      classList.push('IsCollapsed')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for all options.
   */
  const allOptionsClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['AllOptions']

    // If the detail is collapsed
    // then hide the options.
    if (!expanded) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the state value.
   */
  const stateValueClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Text']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueStateValueClassName) {
      classList.push(uniqueStateValueClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The value displayed.
   */
  const valueDisplayed: string = compute(() => {
    // If the current value is not null
    // or undefined then display it.
    if (stateValue !== null && stateValue !== undefined) {
      return renderDisplayName(stateValue)
    }
    // If the current value is null and a default
    // value is not passed, then display a message
    // that indicates an option should be selected.
    else {
      return 'Select an option'
    }
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() => {
    return fieldType === 'optional' ? 'Optional' : 'Optional Hidden'
  })

  /* -- RENDER -- */
  if (options.length > 0) {
    return (
      <div className={rootClassName} style={uniqueDropDownStyling}>
        <div className='TitleContainer'>
          <div className={labelClassName}>{`${label}:`}</div>
          <div className={optionalClassName}>optional</div>
        </div>
        <div className={fieldClassName}>
          <div
            className='Option Selected'
            onClick={() => {
              setExpanded(!expanded)
            }}
          >
            <div className={stateValueClassName}>{valueDisplayed}</div>
            <div className='Indicator'>v</div>
          </div>
          <div className={allOptionsClassName}>
            {options.map((option: NonNullable<TOption>, index: number) => {
              return (
                <div
                  className={`Option ${renderOptionClassName(option)}`}
                  style={uniqueOptionStyling(option)}
                  key={`option_${renderDisplayName(option)}_${index}`}
                  onClick={() => {
                    setState(option)
                    setExpanded(isExpanded)
                  }}
                >
                  {renderDisplayName(option)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/**
 * This will render a detail for a form,
 * with a label and a toggle switch
 * for turning a feature on or off.
 */
export function DetailToggle({
  label,
  stateValue,
  setState,
  // Optional Properties
  lockState = 'unlocked',
  tooltipDescription = '',
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
  disabled = false,
}: TDetailToggle_P): JSX.Element | null {
  /* -- COMPUTED -- */
  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailToggle']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // error message is not passed.
    if (errorMessage === undefined) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })

  /* -- RENDER -- */
  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{label}</div>
      </div>
      <div className={fieldClassName}>
        <Toggle
          stateValue={stateValue}
          setState={setState}
          lockState={lockState}
        />
      </div>
      <Tooltip description={tooltipDescription} />
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

// Set default props for the DetailToggle
// component.
DetailToggle.defaultProps = {
  fieldType: 'required',
}

/**
 * This will render a detail for a form,
 * with a label and a value that is locked
 * from being edited.
 */
export function DetailLocked({
  label,
  stateValue,
  // Optional Properties
  disabled = false,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
}: TDetailLocked_P): JSX.Element | null {
  /* -- COMPUTED -- */

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailLocked']

    // If disabled is true then add the
    // disabled class name.
    if (disabled) {
      classList.push('Disabled')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the label.
   */
  const labelClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Label']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueLabelClassName) {
      classList.push(uniqueLabelClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * The class name for the input field.
   */
  const fieldClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Field']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueFieldClassName) {
      classList.push(uniqueFieldClassName)
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })
  /**
   * Class name for the error message field.
   */
  const fieldErrorClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['FieldErrorMessage']

    // Hide the error message if the
    // error message is not passed.
    if (errorMessage === undefined) {
      classList.push('Hidden')
    }

    // Return the list of class names as one string.
    return classList.join(' ')
  })

  return (
    <div className={rootClassName}>
      <div className='TitleContainer'>
        <div className={labelClassName}>{label}:</div>
      </div>
      <div className={fieldClassName}>
        <span className='Text Disabled'>{stateValue}</span>
        <span className='Lock'>
          <Tooltip description='This is locked and cannot be changed.' />
        </span>
      </div>
      <div className={fieldErrorClassName}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR FORMS ---------------------------- */

/**
 * Input types for the Detail component.
 */
type TInput = 'password' | 'text'

/**
 * The base properties for the details.
 */
type TDetailBase_P = {
  /**
   * The label for the detail.
   */
  label: string
  /**
   * Boolean that determines if the detail should be disabled.
   */
  disabled?: boolean
  /**
   * The unique class name for the label.
   */
  uniqueLabelClassName?: string
  /**
   * The unique class name for the field.
   */
  uniqueFieldClassName?: string
  /**
   * The error message to display if the detail has an error.
   * @default 'At least one character is required here.'
   */
  errorMessage?: string
}

/**
 * The properties needed for required details.
 */
interface TDetailRequired_P<Type> extends TDetailBase_P {
  /**
   * Field type for the detail.
   * @note Determines if the field should allow empty strings
   * and/or if the field should display the optional text.
   */
  fieldType: 'required'
  /**
   * The value stored in a component's state that
   * will be displayed in the detail.
   */
  stateValue: NonNullable<Type>
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setState: ReactSetter<NonNullable<Type>>
}

/**
 * The properties needed for optional details.
 */
interface TDetailOptional_P<Type> extends TDetailBase_P {
  /**
   * Field type for the detail.
   * @note Determines if the field should allow empty strings
   * and/or if the field should display the optional text.
   */
  fieldType: 'optional'
  /**
   * The value stored in a component's state that
   * will be displayed in the detail.
   */
  stateValue: Type
  /**
   * React setter function used to update the value stored
   * in a component's state.
   */
  setState: ReactSetter<Type>
}

/**
 * The properties needed for every type of detail component.
 */
type TDetail_P<Type> = TDetailRequired_P<Type> | TDetailOptional_P<Type>

/**
 * The properties for the details that use an input field.
 */
type TDetailWithInput_P<Type> = TDetail_P<Type> & {
  /**
   * **Determines what happens when the user leaves the field.**
   * @type `'repopulateValue'` will repopulate the field with the default value
   * if the field is empty or in a default state. (*The field type must be required
   * and the default value must be correctly defined for this to work.*)
   * @type `'deliverError'` will deliver an error message if the field is empty.
   * (*The field type must be required for this to work.*)
   * @type `'none'` will do nothing when the user leaves the field.
   */
  handleOnBlur: 'repopulateValue' | 'deliverError' | 'none'
  /**
   * The default value that is used if the field is empty.
   */
  defaultValue?: Type
  /**
   * The placeholder for the input.
   * @default 'Enter [input value type] here...'
   * @note The default value is determined by the input type.
   * For example, if the input type is 'text', then the default
   * value will be 'Enter text here...'.
   */
  placeholder?: string
}

/**
 * The properties for the Detail String component.
 */
type TDetailString_P = TDetailWithInput_P<string> & {
  /**
   * The type of input to render (i.e., text or password).
   * @default 'text'
   */
  inputType?: TInput
}

/**
 * The properties for the Detail Number component.
 */
type TDetailNumber_P = TDetail_P<number | null> & {
  /**
   * The placeholder for the input.
   * @default 'Enter [input value type] here...'
   * @note The default value is determined by the input type.
   * For example, if the input type is 'text', then the default
   * value will be 'Enter text here...'.
   */
  placeholder?: string
  /**
   * The minimum value allowed for the detail.
   */
  minimum?: number
  /**
   * The maximum value allowed for the detail.
   */
  maximum?: number
  /**
   * The boolean that determines if the detail should only allow integers.
   * @default false
   */
  integersOnly?: boolean
  /**
   * The unit to display after the detail.
   */
  unit?: string
}

/**
 * The properties for the Detail Large String component.
 */
type TDetailLargeString_P = TDetailWithInput_P<string> & {
  /**
   * The class name of the element that the detail is bound to.
   * @note This is used to keep the tooltip from being cut off by the
   * element's boundary.
   */
  elementBoundary?: string
}

/**
 * The properties for the Detail Drop Down component.
 */
type TDetailDropDown_P<TOption> = TDetail_P<TOption | null> & {
  /**
   * The options available for the detail.
   */
  options: NonNullable<TOption>[]
  /**
   * The boolean that determines if the detail is expanded.
   */
  isExpanded: boolean
  /**
   * The function to render the display name for the option.
   */
  renderDisplayName: (option: NonNullable<TOption>) => string
  /**
   * The unique CSS styling for the drop down.
   * @default {}
   */
  uniqueDropDownStyling?: AnyObject
  /**
   * The unique class name for the detail.
   */
  uniqueClassName?: string
  /**
   * The unique class name for the current value.
   */
  uniqueStateValueClassName?: string
  /**
   * The unique styling for the options.
   * @default (option: TOption) => { return {} }
   */
  uniqueOptionStyling?: (option: TOption) => AnyObject
  /**
   * The function to render the class name for the option.
   * @default (option: TOption) => { return '' }
   */
  renderOptionClassName?: (option: TOption) => string
  /**
   * @note This is disabled for drop down details.
   */
  errorMessage?: undefined
}

/**
 * The properties for the Detail Toggle component..
 */
export type TDetailToggle_P = TDetailRequired_P<boolean> & {
  /**
   * The toggle lock state of the toggle.
   * @default 'unlocked'
   */
  lockState?: TToggleLockState
  /**
   * The description displayed when hovered over.
   * @default ''
   */
  tooltipDescription?: string
  /**
   * Class name to apply to the root element.
   */
  uniqueClassName?: string
}

/**
 * The properties for the Detail Locked component.
 */
export type TDetailLocked_P = TDetailBase_P & {
  /**
   * The value displayed in the detail.
   */
  stateValue: string
}
