import { LocalContextProvider } from '@client/context/local'
import { useDefaultProps } from '@client/toolbox/hooks'
import type { TDetailRequired_P } from '..'
import DetailTitleRow from '../DetailTitleRow'
import { useDetailClassNames } from '../useDetailClassNames'
import { detailIconSelectorContext } from './context'
import './DetailIconSelector.scss'
import IconSelectorOption from './subcomponents/IconSelectorOption'

/**
 * This will render a detail for a form, with a label and
 * a grid of icon options for selection.
 */
export function DetailIconSelector(
  props: TDetailIconSelector_P,
): TReactElement {
  /* -- PROPS -- */

  // Apply default props, then extract
  // needed values.
  const defaultedProps = useDefaultProps(
    // Convert icon to a set to guarantee unique values.
    { ...props, icons: new Set(props.icons) },
    {
      fieldType: 'required',
      uniqueLabelClassName: '',
      uniqueFieldClassName: '',
      disabled: false,
      tooltipDescription: '',
    },
  )
  const {
    fieldType,
    label,
    setValue,
    icons,
    uniqueLabelClassName,
    uniqueFieldClassName,
    disabled,
    tooltipDescription,
  } = defaultedProps

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

  /* -- FUNCTIONS -- */

  /**
   * Callback for when an icon in the grid receives a click event.
   * @param icon The icon that was clicked.
   */
  const onIconClick = (icon: TMetisIcon): void => {
    if (disabled) return
    setValue(icon)
  }

  /* -- RENDER -- */

  return (
    <LocalContextProvider
      context={detailIconSelectorContext}
      defaultedProps={defaultedProps}
      computed={{
        onIconClick,
      }}
      state={{}}
      elements={{}}
    >
      <div className={rootClasses.value}>
        <DetailTitleRow
          label={label}
          labelClassName={labelClasses.value}
          tooltipDescription={tooltipDescription}
          fieldType={fieldType}
        />
        <div className={fieldClasses.value}>
          {Array.from(icons).map((icon) => (
            <IconSelectorOption key={icon} icon={icon} />
          ))}
        </div>
      </div>
    </LocalContextProvider>
  )
}

/* ---------------------------- TYPES FOR DETAIL ICON SELECTOR ---------------------------- */

/**
 * Props for the {@link DetailIconSelector} component.
 */
export type TDetailIconSelector_P = Omit<
  TDetailRequired_P<TMetisIcon>,
  'fieldType' | 'errorMessage' | 'errorType'
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
  icons: TMetisIcon[] | Set<TMetisIcon>
}

/**
 * Computed values to be passed to the subcomponents of {@link DetailIconSelector}
 * via context.
 */
export type TDetailIconSelector_C = {
  /**
   * Callback for when an icon option in the grid receives
   * a click event.
   * @param icon The icon that was clicked.
   */
  onIconClick: (icon: TMetisIcon) => void
}
