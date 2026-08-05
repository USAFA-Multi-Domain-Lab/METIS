import { useMultiSelectContext } from '../DetailMultiSelect'
import MultiSelectOption from './MultiSelectOption'

/**
 * Subcomponent of {@link DetailMultiSelect} which represents
 * a grouping of available options from which the user can choose.
 */
export default function MultiSelectOptions<TOption>(): TReactElement {
  const { value, options, disabled, getKey, render, setValue } =
    useMultiSelectContext<TOption>()

  /**
   * Toggles an option's selection state.
   * @param option The option to toggle.
   */
  const onToggleOption = (option: TOption) => {
    if (disabled) return

    let currentValues = Array.isArray(value) ? [...value] : []
    let optionKey = getKey(option)
    let existingIndex = currentValues.findIndex(
      (cursor) => getKey(cursor) === optionKey,
    )

    if (existingIndex >= 0) {
      // Remove the option
      currentValues.splice(existingIndex, 1)
    } else {
      // Add the option
      currentValues.push(option)
    }

    setValue(currentValues)
  }

  /**
   * Checks if an option is currently selected.
   * @param option The option to check.
   * @returns Whether the option is selected.
   */
  const isOptionSelected = (option: TOption): boolean => {
    if (!Array.isArray(value)) return false
    let optionKey = getKey(option)
    return value.some((cursor) => getKey(cursor) === optionKey)
  }

  return (
    <>
      {options.map((option: TOption) => {
        let key = getKey(option)
        let displayText = render(option)
        let selected = isOptionSelected(option)

        return (
          <MultiSelectOption key={key} selected={selected}>
            <div
              className='OptionContent'
              onClick={(e) => {
                e.stopPropagation()
                onToggleOption(option)
              }}
            >
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
      })}
    </>
  )
}
