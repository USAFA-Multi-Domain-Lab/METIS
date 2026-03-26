import type { TAdditionalClassesSupport } from '@shared/toolbox/html/ClassList'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { TRootElementRefSupport } from '@shared/toolbox/html/elements'
import './PropertyBadges.scss'

/**
 * A list of externally defined properties which can
 * be displayed in a row, represented by METIS icons.
 * @see {@link TMetisIcon}
 * @note This component functionally does very little,
 * other than render the children provided. The main
 * benefit of this component is the styling provided
 * in the corresponding SCSS file, which lays out the
 * children in a helpful way.
 */
export default function PropertyBadges({
  children,
  elementRef,
  additionalClasses = new ClassList(),
}: TPropertyBadges_P): TReactElement | null {
  let rootClasses = new ClassList('PropertyBadges').import(additionalClasses)

  /* -- RENDER -- */
  return (
    <div className={rootClasses.value} ref={elementRef}>
      {children}
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link PropertyBadges}.
 */
export type TPropertyBadges_P = {
  /**
   * The children to render within the component.
   * Unless custom styling or functionality is needed,
   * this should simply be a list of {@link PropertyBadge}
   * component instances.
   */
  children?: React.ReactNode
} & TRootElementRefSupport &
  TAdditionalClassesSupport
