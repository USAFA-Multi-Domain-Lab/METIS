import ResourceCostBadges from '@client/components/content/general-layout/property-badges/implementations/ResourceCostBadges'
import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import RichText from '@client/components/content/general-layout/rich-text/RichText'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { useEventListener } from '@client/toolbox/hooks'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import type { TActionModifier } from '@shared/missions/actions/MissionAction'
import {
  MissionSession,
  type TSessionConfig,
} from '@shared/sessions/MissionSession'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { useState } from 'react'
import './ActionProperties.scss'

/**
 * Displays the properties of the given action.
 */
export default function ActionProperties({
  action,
  cheats = MissionSession.NO_CHEATS,
  config = MissionSession.DEFAULT_CONFIG,
  showDescription = true,
}: TActionProperties_P): TReactElement | null {
  /* -- STATE -- */

  const [recentModifiers, setRecentModifiers] = useState<
    Array<TActionModifier>
  >([])

  /* -- COMPUTED -- */

  let descriptionClasses = new ClassList('ActionDescription').set(
    'Hidden',
    !action.description,
  )
  let successChanceUpdated = recentModifiers.some(
    (modifier) => modifier.type === 'success-chance',
  )
  let processTimeUpdated = recentModifiers.some(
    (modifier) => modifier.type === 'process-time',
  )

  /* -- EFFECTS -- */

  // Handle new modifiers being added while the action properties are being displayed.
  useEventListener(action, 'new-modifier', () => {
    // Get the new modifier. We'll track it if it isn't a
    // resource-cost modifier. Resource cost modifiers are
    // handled by the ResourceCostBadges component.
    let newModifier = ArrayToolbox.lastOf(action.modifiers)!
    if (newModifier.type === 'resource-cost') return

    // Track recent modifier to apply an animation to
    // draw the attention of the user.
    setRecentModifiers((previousRecentModifiers) => {
      // Clear the recent modifiers after a delay, ending the
      // animation in the GUI.
      setTimeout(() => {
        setRecentModifiers((previousRecentModifiers) => {
          return previousRecentModifiers.filter(
            (modifier) => modifier !== newModifier,
          )
        })
      }, 500)
      return [...previousRecentModifiers, newModifier]
    })
  })

  /* -- RENDER -- */

  // Render the root component.
  return (
    <div className='ActionProperties'>
      <PropertyBadges>
        {showDescription && (
          <div className={descriptionClasses.value}>
            <RichText
              options={{ content: action.description, editable: false }}
            />
          </div>
        )}
        <PropertyBadge
          icon={'percent'}
          value={action.successChanceFormatted}
          description={'Success Chance'}
          strikethrough={cheats.guaranteedSuccess}
          strikethroughReason={'Cheats Applied'}
          updated={successChanceUpdated}
        />
        <PropertyBadge
          icon={'timer'}
          value={action.processTimeFormatted}
          description={'Process Time'}
          strikethrough={cheats.instantaneous}
          strikethroughReason={'Cheats Applied'}
          updated={processTimeUpdated}
        />
        <ResourceCostBadges action={action} cheats={cheats} config={config} />
        <PropertyBadge
          active={action.opensNode}
          icon={'door'}
          value={null}
          description={'Opens Node'}
        />
        <PropertyBadge
          active={action.type === 'repeatable'}
          icon={'repeat'}
          value={null}
          description={StringToolbox.toTitleCase(action.type)}
        />
      </PropertyBadges>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link ActionProperties} component.
 */
export type TActionProperties_P = {
  /**
   * The action of which to display properties.
   */
  action: ClientMissionAction
  /**
   * The cheats that will be applied to the action.
   * @default @see {@link MissionSession.NO_CHEATS}
   */
  cheats?: TExecutionCheats
  /**
   * The session configuration.
   * @default @see {@link MissionSession.DEFAULT_CONFIG}
   */
  config?: TSessionConfig
  /**
   * Whether to show the action description above
   * the execution-specific properties.
   */
  showDescription?: boolean
}
