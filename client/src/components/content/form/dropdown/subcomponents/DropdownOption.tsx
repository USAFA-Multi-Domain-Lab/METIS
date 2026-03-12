import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { TDropdownOption_P } from '../DetailDropdown'
import { DetailDropdown } from '../DetailDropdown'

/**
 * Subcomponent of {@link DetailDropdown} which represents
 * a single option inside the dropdown that can be selected.
 */
export default function ({
  children,
  selected = false,
  onClick,
}: TDropdownOption_P): TReactElement {
  /**
   * The classes used for the root element
   * of the dropdown option.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('DropdownOption').set('Selected', selected),
  )

  return (
    <div className={rootClasses.value} onClick={onClick}>
      {children}
    </div>
  )
}
