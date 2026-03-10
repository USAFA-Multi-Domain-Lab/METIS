import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useState } from 'react'
import Tooltip from '../../communication/Tooltip'
import DetailTitleRow from '../DetailTitleRow'
import { useDetailClassNames } from '../useDetailClassNames'
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
export function DetailDropdown<TOption>(
  props: TDetailDropdown_P<TOption>,
): TReactElement | null {
  /* -- PROPS -- */

  // Assign default values to props.
  const defaultedProps: Required<TDetailDropdown_P<TOption>> = {
    ...props,
    uniqueClassName: props.uniqueClassName ?? '',
    uniqueLabelClassName: props.uniqueLabelClassName ?? '',
    uniqueFieldClassName: props.uniqueFieldClassName ?? '',
    uniqueStateValueClassName: props.uniqueStateValueClassName ?? '',
    disabled: props.disabled ?? false,
    tooltipDescription: props.tooltipDescription ?? '',
    emptyText: props.emptyText ?? 'Select an option',
    errorMessage: props.errorMessage ?? '',
    errorType: props.errorType ?? 'default',
    errorDisplay: props.errorDisplay ?? 'on-blur',
    isExpanded: props.isExpanded ?? false,
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

  const { rootClasses, labelClasses, fieldClasses } = useDetailClassNames({
    componentName: 'DetailDropdown',
    disabled,
    displayError: false,
    errorType: 'default',
    uniqueClassName,
    uniqueLabelClassName,
    uniqueFieldClassName,
  })
  fieldClasses.set('IsExpanded', expanded)

  /**
   * The class names for all options.
   */
  const allOptionsClasses = new ClassList('AllOptions').set('Hidden', !expanded)

  /**
   * The class names for the state value.
   */
  const stateValueClasses = new ClassList('Text', uniqueStateValueClassName)
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
   * The class names for the warning icon.
   */
  const warningClasses = new ClassList().switch(
    'Warning',
    'Hidden',
    displayWarning,
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
        <DropdownOption
          key={key}
          onClick={() => (!disabled ? onSelectOption(option) : null)}
        >
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
      <div className={rootClasses.value}>
        <DetailTitleRow
          label={label}
          labelClassName={labelClasses.value}
          tooltipDescription={tooltipDescription}
          fieldType={fieldType}
        >
          <div className={warningClasses.value}>
            <Tooltip description={warningTooltipDescription} />
          </div>
        </DetailTitleRow>
        <div className={fieldClasses.value}>
          <DropdownOption
            selected
            onClick={() => (!disabled ? setExpanded(!expanded) : null)}
          >
            <div className={stateValueClasses.value}>{valueDisplayed}</div>
            <div className='Indicator'>v</div>
          </DropdownOption>
          <div className={allOptionsClasses.value}>{optionsJsx}</div>
        </div>
      </div>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

import type { ReactNode } from 'react'
import type { TDetailBase_P, TDetailOptional_P, TDetailRequired_P } from '../'

/**
 * The base properties for the Detail Dropdown component.
 */
type TDetailDropdownBase_P = TDetailBase_P & {
  /**
   * The boolean that determines if the detail is expanded.
   * @default false
   */
  isExpanded?: boolean
  /**
   * The unique class name for the detail.
   */
  uniqueClassName?: string
  /**
   * The unique class name for the current value.
   */
  uniqueStateValueClassName?: string
  /**
   * @note This is disabled for Dropdown details.
   */
  errorMessage?: ''
  /**
   * The text to display when the value is not set.
   */
  emptyText?: string
}

/**
 * The properties for the Detail Dropdown component.
 */
export type TDetailDropdown_P<TOption> =
  | TDetailDropdownRequired_P<TOption>
  | TDetailDropdownOptional_P<TOption | null>

/**
 * The required properties for the Detail Dropdown component.
 */
type TDetailDropdownRequired_P<TOption> = TDetailRequired_P<TOption> &
  TDetailDropdownBase_P & {
    /**
     * The options available for the detail.
     */
    options: NonNullable<TOption>[]
    /**
     * The function to render the display name for the option.
     */
    render: (option: NonNullable<TOption>) => ReactNode
    /**
     * Gets the key for the given option.
     * @param option The option for which to get the key.
     * @returns The key for the given option.
     */
    getKey: (option: NonNullable<TOption>) => string
    /**
     * How to handle the selected option if it's invalid or not in the list.
     * @methods
     * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
     * - `setToFirst` - Set the selected option to the first option in the list.
     * - `warning` - Display a warning icon.
     *
     * @example
     * ```
     * handleInvalidOption={{
     *  method: 'setToDefault',
     *  defaultValue: new Object()
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'setToFirst'
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'warning',
     * message: 'This is a warning message.'
     * }}
     * ```
     */
    handleInvalidOption: TRequiredHandleInvalidOption<TOption>
  }

/**
 * The optional properties for the Detail Dropdown component.
 */
type TDetailDropdownOptional_P<TOption> = TDetailOptional_P<TOption> &
  TDetailDropdownBase_P & {
    /**
     * The options available for the detail.
     */
    options: TOption[]
    /**
     * The function to render the display name for the option.
     */
    render: (option: TOption) => ReactNode | null | undefined
    /**
     * Gets the key for the given option.
     * @param option The option for which to get the key.
     * @returns The key for the given option.
     */
    getKey: (option: TOption) => string | null | undefined
    /**
     * How to handle the selected option if it's invalid or not in the list.
     * @methods
     * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
     * - `setToFirst` - Set the selected option to the first option in the list.
     * - `warning` - Display a warning icon.
     *
     * @example
     * ```
     * handleInvalidOption={{
     *  method: 'setToDefault',
     *  defaultValue: new Object()
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'setToFirst'
     * }}
     * ```
     *
     * @example
     * ```
     * handleInvalidOption={{
     * method: 'warning',
     * message: 'This is a warning message.'
     * }}
     * ```
     */
    handleInvalidOption: TOptionalHandleInvalidOption<TOption>
  }

/**
 * How to handle the selected option if it's invalid or not in the list.
 * @methods
 * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
 * - `setToFirst` - Set the selected option to the first option in the list.
 * - `warning` - Display a warning icon.
 *
 * @example
 * ```
 * handleInvalidOption={{
 *  method: 'setToDefault',
 *  defaultValue: new Object()
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'setToFirst'
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'warning',
 * message: 'This is a warning message.'
 * }}
 * ```
 */
export type TRequiredHandleInvalidOption<TOption> =
  | TRequiredSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 * How to handle the selected option if it's invalid or not in the list.
 * @methods
 * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
 * - `setToFirst` - Set the selected option to the first option in the list.
 * - `warning` - Display a warning icon.
 *
 * @example
 * ```
 * handleInvalidOption={{
 *  method: 'setToDefault',
 *  defaultValue: new Object()
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'setToFirst'
 * }}
 * ```
 *
 * @example
 * ```
 * handleInvalidOption={{
 * method: 'warning',
 * message: 'This is a warning message.'
 * }}
 * ```
 */
export type TOptionalHandleInvalidOption<TOption> =
  | TOptionalSetToDefault<TOption>
  | TSetToFirst
  | TWarning

/**
 * The method that handles an invalid option by setting the selected option to the default value provided.
 * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
 * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
 */
type TRequiredSetToDefault<TOption> = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToDefault'
  /**
   * The default value to set the selected option to.
   * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
   * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
   */
  defaultValue: NonNullable<TOption>
}

/**
 * The method that handles an invalid option by setting the selected option to the default value provided.
 * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
 * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
 */
type TOptionalSetToDefault<TOption> = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToDefault'
  /**
   * The default value to set the selected option to.
   * @note If the fieldType is 'required', then the default value provided cannot be null or undefined.
   * @note If the fieldType is 'optional', then the default value provided can be null or undefined.
   */
  defaultValue: TOption
}

/**
 * The method that handles an invalid option by setting the selected option to the first option in the list.
 */
type TSetToFirst = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'setToFirst'
}

/**
 * The method that handles an invalid option by displaying a warning icon with a message.
 */
type TWarning = {
  /**
   * The method to handle the invalid option.
   * @options
   * - `setToDefault` - Set the selected option to the default value. (If selected, a default value must be provided.)
   * - `setToFirst` - Set the selected option to the first option in the list.
   * - `warning` - Display a warning icon.
   */
  method: 'warning'
  /**
   * The message that displays when hovering over the warning icon.
   */
  message?: string
}

/**
 * Consolidated state for the {@link DetailDropdown}
 * component.
 */
export interface TDetailDropdown_S {
  /**
   * Whether the dropdown is expanded or not.
   */
  expanded: TReactState<boolean>
}

/**
 * Props for the {@link DropdownOption} component.
 */
export type TDropdownOption_P = {
  /**
   * The React children to be displayed inside the dropdown option.
   * @note Typically this will be plain text.
   */
  children?: ReactNode
  /**
   * Whether the option is selected or not.
   * @note Applies special styling to the option.
   * @default false
   */
  selected?: boolean
  /**
   * Callback for when the option is clicked.
   */
  onClick?: () => void
}
