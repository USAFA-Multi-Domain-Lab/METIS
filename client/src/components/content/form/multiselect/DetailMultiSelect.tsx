import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { TDetailBase_P } from '../'
import './DetailMultiSelect.scss'
import MultiSelectOption from './subcomponents/MultiSelectOption'

/**
 * Local context for the {@link DetailMultiSelect} component.
 */
const multiselectContext = new LocalContext<
  TDetailMultiSelect_P<any>,
  {},
  TDetailMultiSelect_S,
  {}
>()

/**
 * Hook which subcomponents of {@link DetailMultiSelect} can use
 * to access the local context of the multiselect.
 */
export const useMultiSelectContext = <TOption extends any>() => {
  return multiselectContext.getHook<
    TDetailMultiSelect_P<TOption>,
    {},
    TDetailMultiSelect_S,
    {}
  >()()
}

/**
 * This will render a detail for a form, with a label and
 * a field for selecting multiple of various options.
 * @note Selected values are displayed as pills/tags with remove buttons.
 */
export default function DetailMultiSelect<TOption>(
  props: TDetailMultiSelect_P<TOption>,
): TReactElement | null {
  /* -- PROPS -- */

  // Assign default values to props.
  const defaultedProps: Required<TDetailMultiSelect_P<TOption>> = {
    ...props,
    uniqueClassName: props.uniqueClassName ?? '',
    uniqueLabelClassName: props.uniqueLabelClassName ?? '',
    uniqueFieldClassName: props.uniqueFieldClassName ?? '',
    disabled: props.disabled ?? false,
    tooltipDescription: props.tooltipDescription ?? '',
    emptyText: props.emptyText ?? 'Select options',
    errorMessage: props.errorMessage ?? '',
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
    disabled,
    isExpanded,
    tooltipDescription,
    emptyText,
  } = defaultedProps

  /* -- STATE -- */

  const state: TDetailMultiSelect_S = {
    expanded: useState<boolean>(false),
  }
  const [expanded, setExpanded] = state.expanded

  /* -- COMPUTED -- */

  /**
   * The class name for the detail.
   */
  const rootClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['Detail', 'DetailMultiSelect']

    // If a unique class name is passed
    // then add it to the list of class names.
    if (uniqueClassName) {
      classList.push(uniqueClassName)
    }

    // If the detail is expanded then add
    // the expanded class name
    if (expanded) {
      classList.push('IsExpanded')
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
    let classList: string[] = ['Field']

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
   * The class name for the selected values container.
   */
  const selectedValuesClassName: string = compute(() => {
    // Default class names
    let classList: string[] = ['SelectedValues']

    // Return the list of class names as one string.
    return classList.join(' ')
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
  const infoClassName: string = compute(() => {
    return tooltipDescription ? 'DetailInfo' : 'Hidden'
  })

  /* -- EFFECTS -- */

  // Close multiselect when clicking outside.
  useEffect(() => {
    if (!expanded) return

    const handleClickOutside = (event: MouseEvent) => {
      let target = event.target as HTMLElement
      if (!target.closest('.DetailMultiSelect')) {
        setExpanded(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [expanded])

  /* -- FUNCTIONS -- */

  /**
   * Toggles the multiselect expansion.
   */
  const toggleExpanded = () => {
    if (!disabled) {
      setExpanded(!expanded)
    }
  }

  /**
   * Toggles an option's selection state.
   * @param option The option to toggle.
   */
  const onToggleOption = (option: TOption) => {
    if (disabled) return

    let currentValues = Array.isArray(value) ? [...value] : []
    let optionKey = getKey(option)
    let existingIndex = currentValues.findIndex((v) => getKey(v) === optionKey)

    if (existingIndex >= 0) {
      // Remove the option
      currentValues.splice(existingIndex, 1)
    } else {
      // Add the option
      currentValues.push(option)
    }

    setValue(currentValues as any)
  }

  /**
   * Removes a selected option.
   * @param option The option to remove.
   */
  const onRemoveOption = (option: TOption) => {
    if (disabled) return

    let currentValues = Array.isArray(value) ? [...value] : []
    let optionKey = getKey(option)
    let filteredValues = currentValues.filter((v) => getKey(v) !== optionKey)

    setValue(filteredValues as any)
  }

  /**
   * Checks if an option is currently selected.
   * @param option The option to check.
   * @returns Whether the option is selected.
   */
  const isOptionSelected = (option: TOption): boolean => {
    if (!Array.isArray(value)) return false
    let optionKey = getKey(option)
    return value.some((v) => getKey(v) === optionKey)
  }

  /* -- PRE-RENDER PROCESSING -- */

  const selectedValuesJsx: TReactElement[] = compute(() => {
    if (!Array.isArray(value) || value.length === 0) {
      return []
    }

    return value.map((selectedOption) => {
      let key = getKey(selectedOption)
      let displayText = render(selectedOption)

      return (
        <div key={key} className='SelectedPill'>
          <span className='PillText'>{displayText}</span>
          <button
            className='RemoveButton'
            onClick={(e) => {
              e.stopPropagation()
              onRemoveOption(selectedOption)
            }}
            disabled={disabled}
          >
            ✕
          </button>
        </div>
      )
    })
  })

  const optionsJsx: TReactElement[] = compute(() => {
    return options.map((option) => {
      let key = getKey(option)
      let displayText = render(option)
      let selected = isOptionSelected(option)

      return (
        <MultiSelectOption
          key={key}
          selected={selected}
          onClick={() => onToggleOption(option)}
        >
          <div className='OptionContent'>
            <input
              type='checkbox'
              checked={selected}
              onChange={() => {}}
              className='OptionCheckbox'
            />
            <span className='OptionText'>{displayText}</span>
          </div>
        </MultiSelectOption>
      )
    })
  })

  /* -- RENDER -- */

  return (
    <LocalContextProvider
      context={multiselectContext}
      defaultedProps={defaultedProps}
      computed={{}}
      state={state}
      elements={{}}
    >
      <div className={rootClassName}>
        <div className={labelClassName}>
          <label>{label}</label>
          <span className={optionalClassName}>(optional)</span>
          <span
            className={infoClassName}
            data-tooltip={tooltipDescription}
          ></span>
        </div>
        <div className={fieldClassName}>
          <div className='SelectedContainer' onClick={toggleExpanded}>
            <div className={selectedValuesClassName}>
              {selectedValuesJsx.length > 0 ? (
                selectedValuesJsx
              ) : (
                <span className='EmptyText'>{emptyText}</span>
              )}
            </div>
            <div className='ExpandIndicator'>
              <span className='Indicator'>▼</span>
            </div>
          </div>
          <div className={allOptionsClassName}>{optionsJsx}</div>
        </div>
      </div>
    </LocalContextProvider>
  )
}

/* -- TYPES -- */

/**
 * The base properties for the Detail Multi-Select component.
 */
type TDetailMultiSelectBase_P = TDetailBase_P & {
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
   * @note This is disabled for Multi-Select details.
   */
  errorMessage?: ''
  /**
   * The text to display when no values are selected.
   */
  emptyText?: string
}

/**
 * The properties for the Detail Multi-Select component.
 */
export type TDetailMultiSelect_P<TOption> = TDetailMultiSelectBase_P & {
  /**
   * The options available for the detail.
   */
  options: TOption[]
  /**
   * The selected values.
   */
  value: TOption[]
  /**
   * Sets the selected values.
   */
  setValue: (value: TOption[]) => void
  /**
   * The function to render the display name for the option.
   */
  render: (option: TOption) => ReactNode
  /**
   * Gets the key for the given option.
   * @param option The option for which to get the key.
   * @returns The key for the given option.
   */
  getKey: (option: TOption) => string
  /**
   * Field type for the detail.
   * @note Determines if the field should display the optional text.
   */
  fieldType: 'required' | 'optional'
}

/**
 * Consolidated state for the {@link DetailMultiSelect}
 * component.
 */
export interface TDetailMultiSelect_S {
  /**
   * Whether the multiselect is expanded.
   */
  expanded: TReactState<boolean>
}
