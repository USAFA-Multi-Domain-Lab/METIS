import { ButtonText } from '@client/components/content/user-controls/buttons/ButtonText'
import If from '@client/components/content/util/If'
import { compute } from '@client/toolbox'
import type { NodeAlert } from '@shared/missions/nodes/NodeAlert'
import { ClassList } from '@shared/toolbox/html/ClassList'
import './NodeAlertBox.scss'

/**
 * Displays a node-alert message for a member to see.
 */
export default function NodeAlertBox({
  alert,
  areMoreAlerts,
  next,
  acknowledge,
}: TNodeAlertBox_P): TReactElement | null {
  /* -- STATE -- */

  /**
   * The message to display in the box.
   */
  const message = compute<string>(() => {
    if (alert) {
      return alert.message
    } else {
      return ''
    }
  })

  /* -- COMPUTED -- */

  /**
   * Classes to dynamically apply to the root element.
   */
  const rootClasses = new ClassList('NodeAlertBox').switch(
    {
      info: 'Info',
      suspicious: 'Suspicious',
      warning: 'Warning',
      danger: 'Danger',
      none: 'Hidden',
    },
    alert?.severityLevel ?? 'none',
  )

  /* -- RENDER -- */

  return (
    <div className={rootClasses.value}>
      <div className='AlertHeader'>
        <div className='AlertIcon'></div>
        <div className='AlertTitle'>ALERT</div>
      </div>
      <div className='AlertMessage'>{message}</div>
      <div className='AlertButtons'>
        <If condition={areMoreAlerts}>
          <ButtonText
            text={'Next alert'}
            onClick={() => {
              if (!areMoreAlerts) return
              next()
              // todo: Move this out of this component.
              //               if (!selectedNodeWithWarning) return
              //
              //               let { nextNodeWithWarning } = selectedNodeWithWarning
              //
              //               selectedNodeWithWarning.warningMessage = ''
              //
              //               if (nextNodeWithWarning) {
              //                 nextNodeWithWarning.select()
              //                 nextNodeWithWarning.requestCenterOnMap()
              //               } else {
              //                 mission.select(selectedNodeWithWarning.host)
              //               }
            }}
          />
        </If>
        <ButtonText
          text={'Close'}
          onClick={() => {
            acknowledge()
            // todo: Move this out of this component.
            // if (!selectedNodeWithWarning) return
            // selectedNodeWithWarning.warningMessage = ''
            // mission.select(selectedNodeWithWarning?.host)
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
   * Whether there are more alerts to show
   * after this one.
   */
  areMoreAlerts: boolean
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
