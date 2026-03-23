import { getIconPath } from '@client/toolbox/icons'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useDetailIconSelectorContext } from '../context'
import { DetailIconSelector } from '../DetailIconSelector'

/**
 * An individual option within the {@link DetailIconSelector} component.
 */
export default function IconSelectorOption({
  icon,
}: TIconSelectorOption_P): TReactElement | null {
  /* -- STATE -- */

  const { value, onIconClick } = useDetailIconSelectorContext()

  /* -- FUNCTIONS -- */

  /**
   * @param icon An icon which is an available option for selection.
   * @returns A string of CSS classes to apply to the icon's corresponding
   * option element.
   */
  const getIconOptionClasses = (icon: TMetisIcon): string => {
    let classes = new ClassList('IconOption')
    if (icon === value) {
      classes.add('Selected')
    }
    return classes.value
  }

  /**
   * Determines the CSS styling for the given selectable icon.
   * @param icon The icon in question.
   * @returns The CSSProperties object containing the background
   * image for the icon.
   */
  const getIconStyle = (icon: TMetisIcon): React.CSSProperties => ({
    backgroundImage: `url(${getIconPath(icon)})`,
  })

  /* -- RENDER -- */

  return (
    <div
      key={icon}
      className={getIconOptionClasses(icon)}
      onClick={() => onIconClick(icon)}
    >
      <div className='Icon' style={getIconStyle(icon)} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link IconSelectorOption}.
 */
export type TIconSelectorOption_P = {
  /**
   * The icon to be displayed in this option.
   */
  icon: TMetisIcon
}
