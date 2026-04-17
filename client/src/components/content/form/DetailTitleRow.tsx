import { compute } from '@client/toolbox'
import type { ReactNode } from 'react'
import Tooltip from '../communication/Tooltip'

/**
 * The standard title row rendered at the top of every detail component.
 * Displays the label, an optional tooltip icon, an optional indicator,
 * and any supplemental controls passed as `children`.
 */
export default function DetailTitleRow({
  label,
  labelClassName,
  tooltipDescription,
  fieldType,
  children,
  rightContent,
}: TDetailTitleRow_P): TReactElement {
  /**
   * The class name for the tooltip info icon.
   */
  const infoClassName: string = compute(() =>
    tooltipDescription ? 'DetailInfo' : 'Hidden',
  )
  /**
   * The class name for the optional indicator.
   */
  const optionalClassName: string = compute(() =>
    fieldType === 'optional' ? 'Optional' : 'Hidden',
  )

  /* -- RENDER -- */
  return (
    <div className='TitleRow'>
      <div className='TitleColumnOne'>
        <div className={labelClassName}>{label}</div>
        <sup className={infoClassName}>
          i
          <Tooltip description={tooltipDescription} />
        </sup>
        {children}
      </div>
      {rightContent !== undefined ? (
        <div className='TitleColumnTwo'>{rightContent}</div>
      ) : (
        <div className={`TitleColumnTwo ${optionalClassName}`}>optional</div>
      )}
    </div>
  )
}

/* ---------------------------- TYPES FOR DETAIL TITLE ROW ---------------------------- */

/**
 * The props for the {@link DetailTitleRow} component.
 */
export type TDetailTitleRow_P = {
  /**
   * The label text for the detail.
   */
  label: string
  /**
   * The class name for the label element.
   * @note Computed by the parent to incorporate error state
   * and any unique class names.
   */
  labelClassName: string
  /**
   * The description shown in the tooltip when hovering over the info icon.
   * An empty string hides the tooltip icon entirely.
   */
  tooltipDescription: string
  /**
   * Whether the detail is required or optional.
   * Determines if the "optional" indicator is shown in `TitleColumnTwo`.
   */
  fieldType: 'required' | 'optional'
  /**
   * Additional content rendered inside `TitleColumnOne`, after the tooltip icon.
   * @note Used for supplemental controls such as a shortcuts link or a warning icon.
   */
  children?: ReactNode
  /**
   * When provided, replaces the default "optional" text inside `TitleColumnTwo`.
   * @note Used when a detail embeds its field control inside the title row itself,
   * as `DetailToggle` does.
   */
  rightContent?: ReactNode
}
