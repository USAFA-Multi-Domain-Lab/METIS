import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { ReactNode } from 'react'

/**
 * Subcomponent of dropdown-based components which represents
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

/* -- TYPES -- */

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
