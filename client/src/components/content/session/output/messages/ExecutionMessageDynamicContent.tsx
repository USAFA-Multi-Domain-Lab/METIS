import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import ResourceCostBadges from '@client/components/content/general-layout/property-badges/implementations/ResourceCostBadges'
import type { ClientMission } from '@client/missions/ClientMission'
import { useEventListener } from '@client/toolbox/hooks'
import { useState } from 'react'
import { useOutputContext } from '../Output'

/**
 * Variant of {@link OutputMessage} which renders a dynamic output
 * message which displays live data for an action execution.
 */
export default function ExecutionMessageDynamicContent({}: TExecutionInitiationMessage_P): TReactElement | null {
  /* -- STATE -- */

  const { output } = useOutputContext()
  let { sourceExecution, sourceAction } = output

  // Abort if not type 'execution-initiation'.
  if (
    output.type !== 'execution-initiation' ||
    !sourceAction ||
    !sourceExecution
  ) {
    throw new Error(
      `OutputMessage of type "execution-initiation" rendered with incompatible output type "${output.type}".`,
    )
  }

  const [timeRemainingFormatted, setTimeRemainingFormatted] = useState<string>(
    sourceExecution.timeRemainingFormatted,
  )
  const [listenerTarget, setListenerTarget] = useState<ClientMission | null>(
    output.mission,
  )

  /* -- EFFECTS -- */

  // Sync the time remaining every execution tick
  // so that the countdown display is always accurate.
  // Stop syncing once the execution is complete
  // (time remaining is 0).
  useEventListener(listenerTarget, 'execution-tick', () => {
    setTimeRemainingFormatted(sourceExecution.timeRemainingFormatted ?? '')
    if (sourceExecution.timeRemaining === 0) {
      setListenerTarget(null)
    }
  })

  /* -- RENDER -- */

  return (
    <div className='ExecutionMessageDynamicContent'>
      <PropertyBadges>
        <PropertyBadge
          icon={'percent'}
          value={sourceExecution.successChanceFormatted}
          description={'Success Chance'}
        />
        <PropertyBadge
          icon={'timer'}
          value={`${timeRemainingFormatted} (${sourceExecution.processTimeFormatted})`}
          description={'Execution Time Remaining'}
        />
        <ResourceCostBadges
          action={sourceAction}
          effectiveTime={sourceExecution.start}
        />
        <PropertyBadge
          active={sourceAction.opensNode}
          icon={'door'}
          value={null}
          description={'Opens Node'}
        />
        <PropertyBadge
          active={sourceAction.type === 'repeatable'}
          icon={'repeat'}
          value={null}
          description={'Repeatable'}
        />
      </PropertyBadges>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link ExecutionMessageContent}.
 */
export type TExecutionInitiationMessage_P = {}
