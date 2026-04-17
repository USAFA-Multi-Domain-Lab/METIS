import Tooltip from '../communication/Tooltip'
import './WarningIndicator.scss'

/**
 * Displays an indicator to the user that something
 * is wrong and needs to be addressed.
 */
export default function WarningIndicator({
  active = false,
  description = '',
  onClick = () => {},
}: TWarningIndicator_P): TReactElement {
  if (!active) return <></>

  return (
    <div className='WarningIndicator' onClick={onClick}>
      <div className='WarningIcon'></div>
      <Tooltip description={description} />
    </div>
  )
}

/**
 * Props for `WarningIndicator`.
 */
export type TWarningIndicator_P = {
  /**
   * Whether the warning indicator is currently active
   * and should be displayed.
   * @default false
   */
  active?: boolean
  /**
   * Text that will be displayed in a tooltip to
   * the user when they hover over the indicator
   * @default ''
   */
  description?: string
  /**
   * Callback for when the indicator is clicked.
   * @default () => {}
   */
  onClick?: () => void
}
