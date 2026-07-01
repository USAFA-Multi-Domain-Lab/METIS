import { LocalContext, LocalContextProvider } from '@client/context/local'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { ReactNode } from 'react'
import { useImperativeHandle, useRef, useState } from 'react'
import type { TDetailBase_P } from '../..'
import DetailTitleRow from '../../DetailTitleRow'
import { useDetailClassNames } from '../../hooks/useDetailClassNames'
import './DetailMultiSelect.scss'
import MultiSelectOptions from './subcomponents/MultiSelectOptions'

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
    renderOptions: props.renderOptions ?? MultiSelectOptions,
    uniqueClassName: props.uniqueClassName ?? '',
    uniqueLabelClassName: props.uniqueLabelClassName ?? '',
    uniqueFieldClassName: props.uniqueFieldClassName ?? '',
    disabled: props.disabled ?? false,
    tooltipDescription: props.tooltipDescription ?? '',
    fieldType: props.fieldType ?? 'required',
    emptyText: props.emptyText ?? 'Select options',
    errorMessage: props.errorMessage ?? '',
    errorType: props.errorType ?? 'default',
    isExpanded: props.isExpanded ?? false,
    onPillClick: props.onPillClick ?? (() => {}),
    getPillStyle: props.getPillStyle ?? (() => ({})),
    ref: props.ref ?? null,
  }

  // Extract props.
  const {
    ref,
    label,
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
    onPillClick,
    getPillStyle,
  } = defaultedProps

  /* -- STATE -- */

  const state: TDetailMultiSelect_S = {
    expanded: useState<boolean>(isExpanded),
  }
  const [expanded, setExpanded] = state.expanded
  const rootRef = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  const { rootClasses, labelClasses, fieldClasses } = useDetailClassNames({
    componentName: 'DetailMultiSelect',
    disabled,
    displayError: false,
    errorType: 'default',
    uniqueClassName,
    uniqueLabelClassName,
    uniqueFieldClassName,
  })
  rootClasses.set('IsExpanded', expanded)
  fieldClasses.set('IsExpanded', expanded)

  /**
   * The class names for all options.
   */
  const allOptionsClasses = new ClassList('AllOptions').set('Hidden', !expanded)

  /**
   * The class name for the optional text.
   * @note Always hidden — a multi-select always produces a defined array value,
   * so there is no meaningful distinction between required and optional.
   */
  /* -- EFFECTS -- */

  useImperativeHandle(ref, () => ({
    expand: () => setExpanded(true),
    collapse: () => setExpanded(false),
    toggleExpansion: () => setExpanded((previous) => !previous),
  }))

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

  /* -- PRE-RENDER PROCESSING -- */

  const selectedValuesJsx: TReactElement[] = compute(() => {
    if (!Array.isArray(value) || value.length === 0) {
      return []
    }

    return value.map((selectedOption) => {
      let key = getKey(selectedOption)
      let displayText = render(selectedOption)

      return (
        <div
          key={key}
          className='SelectedPill'
          style={getPillStyle(selectedOption)}
          onClick={(event) => {
            event.stopPropagation()
            onPillClick(selectedOption)
          }}
        >
          <span className='PillText'>{displayText}</span>
          <button
            className='RemoveButton'
            onClick={(event) => {
              event.stopPropagation()
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

  /* -- RENDER -- */

  return (
    <LocalContextProvider
      context={multiselectContext}
      defaultedProps={defaultedProps}
      computed={{}}
      state={state}
      elements={{}}
    >
      <div ref={rootRef} className={rootClasses.value}>
        <DetailTitleRow
          label={label}
          labelClassName={labelClasses.value}
          tooltipDescription={tooltipDescription}
          fieldType='required'
        />
        <div className={fieldClasses.value}>
          <div className='SelectedContainer' onClick={toggleExpanded}>
            <div className='SelectedValues'>
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
          <div className={allOptionsClasses.value}>
            <MultiSelectOptionRenderer />
          </div>
        </div>
      </div>
    </LocalContextProvider>
  )
}

/**
 * Renders the multiselect's options by invoking the `renderOptions` prop
 * pulled from context.
 * @note This will by default render the {@link MultiSelectOptions} component.
 */
function MultiSelectOptionRenderer(): TReactElement {
  const { renderOptions } = useMultiSelectContext()
  return <>{renderOptions()}</>
}

/* -- TYPES -- */

/**
 * Imperative handle exposed by {@link DetailMultiSelect} via `forwardRef`.
 */
export interface TDetailMultiSelectHandle {
  /**
   * Expands the multiselect dropdown.
   */
  expand: () => void
  /**
   * Collapses the multiselect dropdown.
   */
  collapse: () => void
  /**
   * Toggles the expansion state of the multiselect dropdown.
   */
  toggleExpansion: () => void
}

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
   * Provides custom rendering for how the available options are
   * displayed when the multiselect is expanded.
   */
  renderOptions?: () => ReactNode
  /**
   * Gets the key for the given option.
   * @param option The option for which to get the key.
   * @returns The key for the given option.
   */
  getKey: (option: TOption) => string
  /**
   * Called when a selected pill body is clicked (not the remove button).
   * Receives the option whose pill was clicked.
   * @note This is only for the pills. This will not call back if
   * the multiselect is expanded and one of the dropdown options
   * are clicked in the list.
   * @param option The option whose pill was clicked.
   */
  onPillClick?: (option: TOption) => void
  /**
   * @param option The option whose pill to style.
   * @returns inline styles to apply to the pill element for a given option.
   */
  getPillStyle?: (option: TOption) => React.CSSProperties
  /**
   * An optional ref that exposes imperative controls for the multiselect,
   * such as programmatically expanding or collapsing the dropdown.
   */
  ref?: React.Ref<TDetailMultiSelectHandle>
  /**
   * Field type for the detail.
   * @note Always treated as required — a multi-select always produces a defined
   * array value, so there is no meaningful distinction between required and optional.
   * @default 'required'
   */
  fieldType?: 'required'
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
