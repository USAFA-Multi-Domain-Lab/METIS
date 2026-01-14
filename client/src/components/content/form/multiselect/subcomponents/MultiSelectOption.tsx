import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { ReactNode } from 'react'

/**
 * Subcomponent of {@link DetailMultiSelect} which represents
 * a single option inside the multiselect that can be selected.
 */
export default function MultiSelectOption({
  children,
  selected = false,
  onClick,
}: TMultiSelectOption_P): TReactElement {
  /**
   * The classes used for the root element
   * of the multiselect option.
   */
  const rootClasses = compute<ClassList>(() =>
    new ClassList('MultiSelectOption').set('Selected', selected),
  )

  return (
    <div className={rootClasses.value} onClick={onClick}>
      {children}
    </div>
  )
}

/**
 * Props for the {@link MultiSelectOption} component.
 */
export type TMultiSelectOption_P = {
  /**
   * The content to render inside the option.
   */
  children?: ReactNode
  /**
   * Whether the option is currently selected.
   */
  selected?: boolean
  /**
   * Callback when the option is clicked.
   */
  onClick?: () => void
}
