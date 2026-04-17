import { compute } from '@client/toolbox'
import { getIconPath } from '@client/toolbox/icons'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useRef, useState } from 'react'
import Tooltip from '../../communication/Tooltip'
import './PropertyBadge.scss'
import PropertyBadges from './PropertyBadges'

/**
 * Can be used as a child of {@link PropertyBadges} to
 * represent a single property, represent by a METIS icon.
 * @see {@link TMetisIcon}
 */
export default function PropertyBadge({
  active = true,
  value,
  icon,
  description,
  strikethrough = false,
  strikethroughReason = '',
}: TPropertyBadge_P): TReactElement | null {
  /* -- STATE -- */

  const [hasValue, setHasValue] = useState<boolean>(false)

  /**
   * A ref to track the `div.PropertyValue` element of the component.
   */
  const propertyValueRef = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  /**
   * The classes applied to the root element of
   * the component.
   */
  const rootClasses = new ClassList('PropertyBadge')
    .set('Hidden', !active)
    .set('Strikethrough', strikethrough)

  /**
   * Classes applied to the element which displays
   * the value of the property.
   */
  const valueClasses = new ClassList('PropertyValue').set('Hidden', !hasValue)

  /**
   * The classes applied to the element which provides
   * the reason for the strikethrough, if a strikethrough
   * is applied.
   */
  const strikethroughReasonClasses = new ClassList('StrikethroughReason').set(
    'Hidden',
    !strikethrough || !strikethroughReason,
  )

  /**
   * The style for the icon based on the action key.
   */
  const iconStyle: React.CSSProperties = compute(() => {
    let result: React.CSSProperties = {
      backgroundImage: 'linear-gradient(transparent, transparent)',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }

    if (icon !== '_blank') {
      const url = getIconPath(icon)
      if (url) result.backgroundImage = `url(${url})`
    }

    // Return the style for the icon.
    return result
  })

  /* -- EFFECTS -- */

  // Track whether actual content is provided for
  // property value.
  useEffect(() => {
    let rootElement = propertyValueRef.current
    if (!rootElement) return
    setHasValue(Boolean(rootElement.innerHTML.trim()))
  }, [value])

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <div className='PropertyIcon' style={iconStyle}></div>
      <div className={valueClasses.value} ref={propertyValueRef}>
        {value}
      </div>
      <div className={strikethroughReasonClasses.value}>
        {strikethroughReason}
      </div>
      <Tooltip description={description} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link PropertyBadge}.
 */
export type TPropertyBadge_P = {
  /**
   * Whether the property is currently active. If inactive,
   * the property will not be displayed at all.
   * @default true
   */
  active?: boolean
  /**
   * The icon used to visually represent the property.
   * This will help user recognition of that property.
   */
  icon: TMetisIcon
  /**
   * The current value of the property. This is typically
   * a string or number.
   */
  value: React.ReactNode
  /**
   * A description that displays when hovering over the property.
   * This should clarify the significance of the property, in case
   * the icon doesn't sufficient communicate that on its own.
   */
  description: string
  /**
   * If true, applies a strikethrough style to the value. This is
   * intended to indicate that the property is currently not applicable,
   * for one reason or another.
   * @note If you would like to provide an explanation for why the property
   * is inapplicable, include a quick 1-2 word reason in the
   * {@link strikethroughReason} prop, which will be displayed alongside
   * the strikethrough.
   */
  strikethrough?: boolean
  /**
   * A quick 1-2 word reason for why the property is inapplicable, if
   * the {@link strikethrough} prop is true. This will be displayed
   * alongside the strikethrough style.
   * @note This will only be displayed when the {@link strikethrough}
   * prop is true. There is no need to provide this otherwise.
   */
  strikethroughReason?: string
}
