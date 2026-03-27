import { useDetailIconSelectorContext } from '../context'
import { DetailIconSelector } from '../DetailIconSelector'
import IconSelectorOption from './IconSelectorOption'

/**
 * A row of icon options within the {@link DetailIconSelector} component.
 */
export default function IconSelectorRow({
  rowNumber,
}: TIconSelectorRow_P): TReactElement | null {
  const { icons: allIcons } = useDetailIconSelectorContext()
  let iconsInRow: TMetisIcon[] = Array.from(allIcons).slice(
    (rowNumber - 1) * 6,
    rowNumber * 6,
  )

  return (
    <div className='IconSelectorRow'>
      {iconsInRow.map((icon) => (
        <IconSelectorOption key={`icon-selector-option_${icon}`} icon={icon} />
      ))}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link IconSelectorRow}.
 */
export type TIconSelectorRow_P = {
  /**
   * Defines which icons to display in the row. This
   * will be the icons within the following range:
   * ```
   * (rowNumber - 1) * 6 <= optionIndex < rowNumber * 6
   * ```
   * For example, rowNumber 1 will display options 0-5,
   * rowNumber 2 will display options 6-11, and etc.
   */
  rowNumber: number
}
