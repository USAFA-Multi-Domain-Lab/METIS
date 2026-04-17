import Markdown, {
  MarkdownTheme,
} from '@client/components/content/general-layout/Markdown'
import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import If from '@client/components/content/util/If'
import { compute } from '@client/toolbox'
import type { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useMapContext } from '../../MissionMap'
import './NodeAlertBox.scss'

/**
 * Displays a pending node alert message for a member to see.
 * @throws If this component is used outside of a
 * {@link MissionMap} context.
 */
export default function NodeAlertBox({
  alert,
  areMorePendingAlerts,
  next,
  acknowledge,
}: TNodeAlertBox_P): TReactElement | null {
  /* -- STATE -- */

  useMapContext() // Ensure that this component is used within a MissionMap context.

  /* -- COMPUTED -- */

  /**
   * The severity level of the alert, which indicates the
   * importance the alert has and may give the user an
   * idea of how to respond.
   * @note This will be 'none' if there is no alert. Normally,
   * an alert can't have a severity level of 'none', so its
   * really a component-specific state.
   */
  const severityLevel = alert?.severityLevel ?? 'none'

  /**
   * The message to display in the box.
   */
  const message = alert?.message ?? ''

  /**
   * Classes to dynamically apply to the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    let results = new ClassList('NodeAlertBox').set('Hidden', !alert)
    alert?.addSeverityLevelClasses(results)
    return results
  })

  /* -- RENDER -- */

  return (
    <div
      className={rootClasses.value}
      onWheel={(event) => {
        event.stopPropagation()
      }}
    >
      <div className='AlertHeader'>
        <div className='AlertIcon Icon'></div>
        <div className='AlertTitle'>{severityLevel}</div>
      </div>
      <div className='AlertMessage'>
        <Markdown markdown={message} theme={MarkdownTheme.ThemeSecondary} />
      </div>
      <div className='AlertButtons'>
        <If condition={areMorePendingAlerts}>
          <ButtonText
            text={'Next alert'}
            onClick={() => {
              if (!areMorePendingAlerts) return
              next()
            }}
          />
        </If>
        <ButtonText
          text={'Close'}
          onClick={() => {
            acknowledge()
          }}
        />
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link NodeAlertBox}.
 */
export type TNodeAlertBox_P = {
  /**
   * The alert to display in the box.
   * If null, the box will not be shown.
   */
  alert: NodeAlert | null
  /**
   * Whether there are more pending alerts to show
   * after this one.
   */
  areMorePendingAlerts: boolean
  /**
   * A callback for when the user requests
   * to see the next alert.
   */
  next: () => void
  /**
   * A callback for when the user dismisses
   * the alert.
   */
  acknowledge: () => void
}
