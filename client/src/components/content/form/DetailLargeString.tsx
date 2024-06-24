import { useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { compute } from 'src/toolbox'
import { TDetailWithInput_P } from '.'
import Tooltip from '../communication/Tooltip'
import './DetailLargeString.scss'

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
  tooltipDescription = '',
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
    let classList: string[] = ['Detail', 'DetailLargeString']

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
    let classList: string[] = ['Field', 'FieldLargeString']

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
    fieldType === 'optional' ? 'Optional' : 'Hidden',
  )
  /**
   * The class name for the info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
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
      <div className='TitleRow'>
        <div className='TitleColumnOne'>
          <div className={labelClassName}>{label}</div>
          <sup className={infoClassName}>
            i
            <Tooltip description={tooltipDescription} />
          </sup>
        </div>
        <div className={`TitleColumnTwo ${optionalClassName}`}>optional</div>
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

/* ---------------------------- TYPES FOR DETAIL LARGE STRING ---------------------------- */

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
