import { compute } from '@client/toolbox'
import { getIconPath } from '@client/toolbox/icons'
import React, { useState } from 'react'
import type { TDetailRequired_P } from '../..'
import DetailTitleRow from '../../DetailTitleRow'
import { useDetailClassNames } from '../../useDetailClassNames'
import DropdownOption from '../subcomponents/DropdownOption'
import './DetailIconSelector.scss'

/**
 * This will render a detail for a form, with a label and
 * a collapsible grid of icon options for selecting an icon.
 * Selecting an icon collapses the picker automatically.
 */
export function DetailIconSelector({
  fieldType = 'required',
  label,
  value,
  setValue,
  icons,
  // Optional Properties
  isExpanded = false,
  uniqueLabelClassName = '',
  uniqueFieldClassName = '',
  disabled = false,
  tooltipDescription = '',
}: TDetailIconSelector_P): TReactElement {
  // Convert icon to a set to guarantee unique values.
  icons = new Set(icons)

  /* -- STATE -- */

  const [expanded, setExpanded] = useState<boolean>(isExpanded)

  /* -- COMPUTED -- */

  const { rootClasses, labelClasses, fieldClasses } = useDetailClassNames({
    componentName: 'DetailIconSelector',
    disabled,
    displayError: false,
    errorType: 'default',
    uniqueLabelClassName,
    uniqueFieldClassName,
  })
  rootClasses.add('DetailDropdownCommon')
  fieldClasses.add('FieldIconSelector')
  fieldClasses.switch('Expanded', 'Collapsed', expanded)

  /**
   * The dynamic style for the selected icon displayed in the collapsed header.
   */
  const selectedIconStyle = compute<React.CSSProperties>(() => ({
    backgroundImage: `url(${getIconPath(value)})`,
  }))

  /* -- FUNCTIONS -- */

  /**
   * Determines the CSS styling for the given selectable icon.
   * @param icon The icon in question.
   * @returns The CSSProperties object containing the background
   * image for the icon.
   */
  const getIconStyle = (icon: TSelectableIcon): React.CSSProperties => ({
    backgroundImage: `url(${getIconPath(icon)})`,
  })

  /**
   * Callback for when the dropdown receives a click event.
   */
  const onClickDropdown = () => {
    if (disabled) return
    setExpanded(!expanded)
  }

  /**
   * Callback for when an icon in the grid receives a click event.
   * @param icon The icon that was clicked.
   */
  const onIconClick = (icon: TSelectableIcon): void => {
    if (disabled) return
    setValue(icon)
    setExpanded(false)
  }

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType={fieldType}
      />
      <div className={fieldClasses.value}>
        <DropdownOption onClick={onClickDropdown} selected>
          <div className='DropdownIcon' style={selectedIconStyle} />
          <div className='Indicator'>v</div>
        </DropdownOption>
        <div className='AvailableOptions'>
          {Array.from(icons).map((icon) => {
            return (
              <DropdownOption key={icon} onClick={() => onIconClick(icon)}>
                <div className='DropdownIcon' style={getIconStyle(icon)} />
              </DropdownOption>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL ICON SELECTOR ---------------------------- */

/**
 * Props for the {@link DetailIconSelector} component.
 */
type TDetailIconSelector_P = Omit<
  TDetailRequired_P<TSelectableIcon>,
  'fieldType'
> & {
  /**
   * Field type for the detail.
   * @default 'required'
   */
  fieldType?: 'required'
  /**
   * The icons available for the user to choose from.
   * @note All repeat values will be removed. All options
   * must be unique.
   */
  icons: TSelectableIcon[] | Set<TSelectableIcon>
  /**
   * Whether the icon grid is expanded on initial render.
   * @default false
   */
  isExpanded?: boolean
  /**
   * @note Error messages are not supported for this detail type.
   */
  errorMessage?: undefined
}

/**
 * An icon that can be selected by the user — all {@link TMetisIcon} values
 * except `'_blank'`, which is a non-visual filler.
 */
export type TSelectableIcon = Exclude<TMetisIcon, '_blank'>
