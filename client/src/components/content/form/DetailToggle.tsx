import { compute } from '@client/toolbox'
import type { TDetailRequired_P } from '.'
import type { TToggleLockState } from '../user-controls/Toggle'
import Toggle from '../user-controls/Toggle'
import DetailTitleRow from './DetailTitleRow'
import './DetailToggle.scss'
import { useDetailClassNames } from './useDetailClassNames'

/**
 * This will render a detail for a form,
 * with a label and a toggle switch
 * for turning a feature on or off.
 */
export function DetailToggle({
  fieldType = 'required',
  label,
  value: stateValue,
  setValue: setState,
  // Optional Properties
  lockState = 'unlocked',
  tooltipDescription = '',
  uniqueClassName = undefined,
  uniqueLabelClassName = undefined,
  uniqueFieldClassName = undefined,
  errorMessage = undefined,
  errorType = 'default',
  disabled = false,
}: TDetailToggle_P): TReactElement | null {
  /* -- COMPUTED -- */
  /**
   * The boolean that determines if the
   * error message should be displayed.
   */
  const displayError: boolean = compute(() => errorMessage !== undefined)
  const { rootClasses, labelClasses, fieldClasses, fieldErrorClasses } =
    useDetailClassNames({
      componentName: 'DetailToggle',
      disabled,
      displayError,
      errorType,
      uniqueClassName,
      uniqueLabelClassName,
      uniqueFieldClassName,
    })
  /* -- RENDER -- */
  return (
    <div className={rootClasses.value}>
      <DetailTitleRow
        label={label}
        labelClassName={labelClasses.value}
        tooltipDescription={tooltipDescription}
        fieldType='required'
        rightContent={
          <div className={fieldClasses.value}>
            <Toggle
              stateValue={stateValue}
              setState={!disabled ? setState : () => {}}
              lockState={lockState}
            />
          </div>
        }
      />
      <div className={fieldErrorClasses.value}>{errorMessage}</div>
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL TOGGLE ---------------------------- */

/**
 * The properties for the Detail Toggle component..
 */
export type TDetailToggle_P = Omit<TDetailRequired_P<boolean>, 'fieldType'> & {
  /**
   * Field type for the detail.
   * @default 'required'
   */
  fieldType?: 'required'
  /**
   * The toggle lock state of the toggle.
   * @default 'unlocked'
   */
  lockState?: TToggleLockState
  /**
   * The description displayed when hovered over.
   * @default ''
   */
  tooltipDescription?: string
  /**
   * Class name to apply to the root element.
   */
  uniqueClassName?: string
}
