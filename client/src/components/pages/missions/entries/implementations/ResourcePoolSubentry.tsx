import { DetailNumber } from '@client/components/content/form/DetailNumber'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import './ResourcePoolSubentry.scss'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { useObjectFormSync } from '@client/toolbox/hooks'
import type { TMetisClientComponents } from '@client/index'
import type { ResourcePool } from '@shared/missions/forces/ResourcePool'

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
    initialAmount: [initialAmount, setInitialAmount],
    allowNegative: [allowNegative, setAllowNegative],
  } = useObjectFormSync(pool, ['initialAmount', 'allowNegative'], {
    onChange: () => onChange(pool),
  })

  /* -- RENDER -- */

  return (
    <div className='ResourcePoolSubentry'>
      <h3 className='ResourcePoolSubentryHeading'>{pool.name}</h3>
      <DetailNumber
        fieldType='required'
        label={`${pool.name} Initial Amount`}
        value={initialAmount}
        setValue={setInitialAmount}
        integersOnly={true}
        disabled={viewMode === 'preview'}
      />
      <DetailToggle
        label={`Allow Negative ${pool.name}`}
        value={allowNegative}
        setValue={setAllowNegative}
        tooltipDescription={`If enabled, the ${pool.name} resource pool can go below zero.`}
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
  pool: ResourcePool<TMetisClientComponents>
}
