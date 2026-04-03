import { DetailLocked } from '@client/components/content/form/DetailLocked'
import { DetailNumber } from '@client/components/content/form/DetailNumber'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import type { ClientResourcePool } from '@client/missions/forces/ClientResourcePool'
import { useObjectFormSync } from '@client/toolbox/hooks'

// ! Styling in Entry.scss.

/**
 * This will render the editable fields for a single resource pool, embedded
 * within the {@link ForceEntry} component.
 */
export default function ResourcePoolSubentry({
  pool,
}: TResourcePoolSubentry_P): TReactElement {
  /* -- STATE -- */

  const { onChange, viewMode } = useMissionPageContext()
  const {
    initialBalance: [initialBalance, setInitialBalance],
    allowNegative: [allowNegative, setAllowNegative],
    excluded: [excluded, setExcluded],
  } = useObjectFormSync(pool, ['initialBalance', 'allowNegative', 'excluded'], {
    onChange: () => onChange(pool),
  })

  /* -- RENDER -- */

  return (
    <div className='ResourcePoolSubentry Subentry'>
      <DetailLocked label={'Resource'} value={pool.resource.name} />
      <DetailNumber
        fieldType='required'
        label={'Initial Amount'}
        value={initialBalance}
        setValue={setInitialBalance}
        integersOnly={true}
        disabled={viewMode === 'preview'}
      />
      <DetailToggle
        label={'Allow Negative'}
        value={allowNegative}
        setValue={setAllowNegative}
        tooltipDescription={`If enabled, the ${pool.name} resource pool can go below zero.`}
        disabled={viewMode === 'preview'}
      />
      <DetailToggle
        label={'Exclude from Force'}
        value={excluded}
        setValue={setExcluded}
        tooltipDescription={`If enabled, the ${pool.name} resource pool will be hidden during sessions and its associated costs will not be applied or displayed.`}
        disabled={viewMode === 'preview'}
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * The props for the {@link ResourcePoolSubentry} component.
 */
type TResourcePoolSubentry_P = {
  /**
   * The resource pool to be edited.
   */
  pool: ClientResourcePool
}
