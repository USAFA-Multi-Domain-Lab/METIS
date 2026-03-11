import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import RichText from '@client/components/content/general-layout/rich-text/RichText'
import type { ClientMission } from '@client/missions/ClientMission'
import { compute } from '@client/toolbox'
import { useEventListener } from '@client/toolbox/hooks'
import { useState } from 'react'
import { useOutputContext } from '../Output'
import './OutputMessage.scss'
import { useOutputRenderer } from './renderers'

/**
 * The actual message displayed in an output.
 */
export default function () {
  /* -- STATE -- */

  const { output } = useOutputContext()
  const { key, renderedMessage } = useOutputRenderer()
  const [timeRemainingFormatted, setTimeRemainingFormatted] = useState<string>(
    output.sourceExecution?.timeRemainingFormatted ?? '',
  )
  const [listenerTarget, setListenerTarget] = useState<ClientMission | null>(
    () => {
      if (
        output.type === 'execution-initiation' &&
        (output.sourceExecution?.timeRemaining ?? 0) > 0
      ) {
        return output.mission
      } else {
        return null
      }
    },
  )

  /* -- COMPUTED -- */

  /**
   * The class name for the root element.
   */
  const rootClassName = compute(() => {
    let classList = ['OutputMessage', `OutputMessage_${output.type}`]
    return classList.join(' ')
  })

  /* -- EFFECTS -- */

  // Sync the time remaining every execution tick
  // so that the countdown display is always accurate.
  // Stop syncing once the execution is complete
  // (time remaining is 0).
  useEventListener(listenerTarget, 'execution-tick', () => {
    setTimeRemainingFormatted(
      output.sourceExecution?.timeRemainingFormatted ?? '',
    )
    if (output.sourceExecution?.timeRemaining === 0) {
      setListenerTarget(null)
    }
  })

  /* -- RENDER -- */

  return (
    <span className={rootClassName}>
      <RichText
        key={key}
        options={{ content: renderedMessage, editable: false }}
      />
      {output.type === 'execution-initiation' && (
        <PropertyBadges>
          <PropertyBadge
            icon={'percent'}
            value={output.sourceAction?.successChanceFormatted}
            description={'Success Chance'}
          />
          <PropertyBadge
            icon={'timer'}
            value={`${timeRemainingFormatted} (${output.sourceAction?.processTimeFormatted})`}
            description={'Execution Time Remaining'}
          />
          <PropertyBadge
            icon={'coins'}
            value={output.sourceAction?.resourceCostFormatted}
            description={'Resource Cost'}
          />
          <PropertyBadge
            active={output.sourceAction?.opensNode}
            icon={'door'}
            value={null}
            description={'Opens Node'}
          />
          <PropertyBadge
            active={output.sourceAction?.type === 'repeatable'}
            icon={'repeat'}
            value={null}
            description={'Repeatable'}
          />
        </PropertyBadges>
      )}
    </span>
  )
}
