import { DetailNumber } from '@client/components/content/form/DetailNumber'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import type { ClientActionCost } from '@client/missions/actions/ClientActionCost'
import { ClientMissionAction } from '@client/missions/actions/ClientMissionAction'
import { useObjectFormSync } from '@client/toolbox/hooks'
import Entry from '../Entry'

// ! Styling in Entry.scss.

/**
 * A subentry which can be entered in a {@link Entry}
 * to view/edit a single {@link ClientActionCost} for a
 * mission action.
 */
export default function ActionCostSubentry({
  cost,
}: TActionCostSubentry_P): TReactElement {
  /* -- STATE -- */

  const { viewMode, onChange } = useMissionPageContext()
  const {
    baseAmount: [baseAmount, setBaseAmount],
    hidden: [hidden, setHidden],
  } = useObjectFormSync(cost, ['baseAmount', 'hidden'], {
    onChange: () => onChange(cost),
  })

  /* -- RENDER -- */

  return (
    <div className='ActionCostSubentry Subentry'>
      <DetailNumber
        fieldType='required'
        label={`${cost.resource.name} Cost`}
        value={baseAmount}
        setValue={setBaseAmount}
        minimum={ClientMissionAction.RESOURCE_COST_MIN}
        integersOnly={true}
        disabled={viewMode === 'preview'}
      />
      <DetailToggle
        fieldType='required'
        label='Hide'
        tooltipDescription={`If enabled, the ${cost.resource.name} resource cost will be hidden from the executor.`}
        value={hidden}
        setValue={setHidden}
        disabled={viewMode === 'preview'}
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * The props for the {@link ActionCostSubentry} component.
 */
type TActionCostSubentry_P = {
  /**
   * The action resource cost to be view/edited.
   */
  cost: ClientActionCost
}
