import Tooltip from '@client/components/content/communication/Tooltip'
import { compute } from '@client/toolbox'
import type { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useMapContext } from '../../MissionMap'
import './NodeAlertIndicator.scss'

/**
 * An indicator that can be included as a child of
 * {@link MissionMap} to capture the attention of
 * the user and make them aware of a pending alert
 * that exists on a node. The styling of this indicator
 * will depend on the severity level of the pending alert.
 * @throws If this component is used outside of a
 * {@link MissionMap} context.
 */
export default function NodeAlertIndicator({
  nextPendingAlert = null,
  onClick = () => {},
}: TNodeAlertIndicator_P): TReactElement | null {
  /* -- STATE -- */

  useMapContext() // Ensure that this component is used within a MissionMap context.

  /* -- COMPUTED -- */

  /**
   * Classes to apply to the root element of the component.
   */
  const rootClasses = compute<ClassList>(() => {
    let result = new ClassList('NodeAlertIndicator')

    if (nextPendingAlert) {
      nextPendingAlert.addSeverityLevelClasses(result)
    }

    return result
  })

  /* -- RENDER -- */

  if (!nextPendingAlert) return null

  return (
    <div className={rootClasses.value} onClick={onClick}>
      <div className='Icon'></div>
      <Tooltip description={'ALERT! Click to view.'} />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link NodeAlertIndicator}.
 */
export type TNodeAlertIndicator_P = {
  /**
   * The next pending alert awaiting acknowledgment by the user.
   * If this is null, then the indicator will not be
   * active and will not be rendered.
   * @default null
   */
  nextPendingAlert?: NodeAlert | null
  /**
   * Callback for when the indicator is clicked.
   * @default () => {}
   */
  onClick?: () => void
}
