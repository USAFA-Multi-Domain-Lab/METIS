import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { TDetailDropdown_P, TDetailDropdown_S } from '.'
import Tooltip from '../../communication/Tooltip'
import './DetailDropdown.scss'
import DropdownOption from './subcomponents/DropdownOption'

/**
 * Local context for the {@link DetailDropdown} component.
 */
const dropdownContext = new LocalContext<
  TDetailDropdown_P<any>,
  {},
  TDetailDropdown_S,
  {}
>()

/**
 * Hook which subcomponents of {@link DetailDropdown} can use
 * to access the local context of the dropdown.
 */
export const useDropdownContext = <TOption extends any>() => {
  return dropdownContext.getHook<
    TDetailDropdown_P<TOption>,
    {},
    TDetailDropdown_S,
    {}
  >()()
}

/**
 * This will render a detail for
 * a form, with a label and a drop
 * down box for selecting from various
 * options.
 * @note If `TOption` can be null or undefined, passing null or undefined
 * will leave the Dropdown box unselected.
 */
export default function DetailDropdown<TOption>(
  props: TDetailDropdown_P<TOption>,
): TReactElement | null {
  /* -- PROPS -- */

  // Assign default values to props.
  const defaultedProps: Required<TDetailDropdown_P<TOption>> = {
    ...props,
    uniqueClassName: '',
    uniqueLabelClassName: '',
    uniqueFieldClassName: '',
    uniqueStateValueClassName: '',
    disabled: false,
    tooltipDescription: '',
    emptyText: 'Select an option',
    errorMessage: '',
  }
  // Extract props.
  const {
    label,
    fieldType,
    options,
    value,
    setValue,
    render,
    getKey,
    uniqueClassName,
    uniqueLabelClassName,
    uniqueFieldClassName,
    uniqueStateValueClassName,
    disabled,
    isExpanded,
    tooltipDescription,
    emptyText,
    handleInvalidOption,
  } = defaultedProps

  /* -- STATE -- */

  const state: TDetailDropdown_S = {
    expanded: useState<boolean>(false),
  }
  const [expanded, setExpanded] = state.expanded

  /* -- COMPUTED -- */

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailDropdown']

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
    let classList: string[] = ['Field', 'FieldDropdown']

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
  const valueDisplayed: ReactNode = compute(() => {
    // If the current value is not null
    // or undefined then display it.
    if (value !== null && value !== undefined) {
      return render(value)
    }
    // If the current value is null and a default
    // value is not passed, then display a message
    // that indicates an option should be selected.
    else {
      return emptyText
    }
  })
  /**
   * The class name for the optional text.
   */
  const optionalClassName: string = compute(() => {
    return fieldType === 'optional' ? 'Optional' : 'Hidden'
  })
  /**
   * The class name for the info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
  )
  /**
   * Determines if the warning icon should be displayed.
   */
  const displayWarning: boolean = compute(() => {
    if (
      fieldType === 'required' &&
      handleInvalidOption.method === 'warning' &&
      !options.includes(value)
    ) {
      return true
    } else if (
      fieldType === 'optional' &&
      handleInvalidOption.method === 'warning' &&
      value &&
      !options.includes(value)
    ) {
      return true
    } else {
      return false
    }
  })

  /**
   * The class name for the warning icon.
   */
  const warningClassName: string = compute(() =>
    displayWarning ? 'Warning' : 'Hidden',
  )
  /**
   * The tooltip description for the warning icon.
   */
  const warningTooltipDescription: string = compute(() => {
    if (handleInvalidOption.method === 'warning') {
      return handleInvalidOption.message ?? ''
    } else {
      return ''
    }
  })

  /* -- EFFECTS -- */

  // If the list of options changes, then
  // determine if the state value is still
  // a valid option.
  useEffect(() => {
    // If the selected option is not in the list
    // of options, then handle the invalid option
    // based on the method provided.
    if (fieldType === 'required' && !options.includes(value)) {
      switch (handleInvalidOption.method) {
        case 'setToDefault':
          setValue(handleInvalidOption.defaultValue)
          break
        case 'setToFirst':
          setValue(options[0])
          break
      }
    } else if (fieldType === 'optional' && value && !options.includes(value)) {
      switch (handleInvalidOption.method) {
        case 'setToDefault':
          setValue(handleInvalidOption.defaultValue)
          break
        case 'setToFirst':
          setValue(options[0])
          break
      }
    }
  }, [options, handleInvalidOption.method])

  /* -- FUNCTIONS -- */

  /**
   * Selects an option from the dropdown,
   * resetting the expanded state.
   * @param option The option to select.
   */
  const onSelectOption = (option: TOption | null) => {
    setExpanded(isExpanded)

    // Set the state if the option is valid.
    if (fieldType === 'required' && option) {
      setValue(option)
    } else if (fieldType === 'optional') {
      setValue(option)
    }
  }

  /* -- PRE-RENDER PROCESSING -- */

  const optionsJsx: TReactElement[] = compute(() => {
    let processedOptions = [...options]

    // If the list of options is empty, then
    // return a message indicating that there
    // are no options. This option cannot be
    // selected.
    if (processedOptions.length === 0) {
      return [
        <DropdownOption key={`no-options`}>
          No options available.
        </DropdownOption>,
      ]
    }

    // If the field type is optional, then
    // add a null option to the list of options.
    if (fieldType === 'optional') processedOptions.unshift(null)

    // Render each option.
    return processedOptions.map((option, index) => {
      let optionContent: ReactNode = emptyText
      let key: string | null | undefined = 'initial-null-value'

      // Initialize key and option content if
      // the option is not null or undefined.
      if (option) {
        key = getKey(option)
        optionContent = render(option)
      } else {
        // If the option is null and it is the
        // first index, then render the empty text.
        if (index === 0) optionContent = emptyText
        // Else, don't render anything.
        else return <></>
      }

      return (
        <DropdownOption key={key} onClick={() => onSelectOption(option)}>
          {optionContent}
        </DropdownOption>
      )
    })
  })

  /* -- RENDER -- */

  // Note: The LocalContextProvider is not currently serving
  // much of a purpose. Its existence is currently just a proof
  // of concept that it can be used with generic-typed components.
  return (
    <LocalContextProvider
      context={dropdownContext}
      defaultedProps={defaultedProps}
      computed={{}}
      state={state}
      elements={{}}
    >
      <div className={rootClassName}>
        <div className='TitleRow'>
          <div className='TitleColumnOne'>
            <div className={labelClassName}>{label}</div>
            <sup className={infoClassName}>
              i
              <Tooltip description={tooltipDescription} />
            </sup>
            <div className={warningClassName}>
              <Tooltip description={warningTooltipDescription} />
            </div>
          </div>
          <div className={'TitleColumnTwo'}>
            <div className={optionalClassName}>optional</div>
          </div>
        </div>
        <div className={fieldClassName}>
          <DropdownOption selected onClick={() => setExpanded(!expanded)}>
            <div className={stateValueClassName}>{valueDisplayed}</div>
            <div className='Indicator'>v</div>
          </DropdownOption>
          <div className={allOptionsClassName}>{optionsJsx}</div>
        </div>
      </div>
    </LocalContextProvider>
  )
}
