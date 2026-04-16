import ResourceCostBadges from '@client/components/content/general-layout/property-badges/implementations/ResourceCostBadges'
import PropertyBadge from '@client/components/content/general-layout/property-badges/PropertyBadge'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import RichText from '@client/components/content/general-layout/rich-text/RichText'
import type { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import type { TExecutionCheats } from '@shared/missions/actions/ActionExecution'
import {
  MissionSession,
  type TSessionConfig,
} from '@shared/sessions/MissionSession'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
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
  /* -- COMPUTED -- */

  let descriptionClasses = new ClassList('ActionDescription').set(
    'Hidden',
    !action.description,
  )

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
        />
        <PropertyBadge
          icon={'timer'}
          value={action.processTimeFormatted}
          description={'Process Time'}
          strikethrough={cheats.instantaneous}
          strikethroughReason={'Cheats Applied'}
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
