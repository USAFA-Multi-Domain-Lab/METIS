import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import StatusBar from '@client/components/content/session/StatusBar'
import ResourcePoolBadge from '../../../content/general-layout/property-badges/implementations/ResourcePoolBadge'
import SessionPage from '../SessionPage'
import { useSessionPageContext } from '../context'

// ! Styles rendered in SessionPage.scss

/**
 * The top bar to display on the {@link SessionPage} which
 * displays general details about the session.
 */
export default function SessionTopBar({}: TSessionTopBar_P): TReactElement | null {
  /* -- STATE -- */

  const { session, state } = useSessionPageContext()
  const [resourcePools] = state.resourcePools

  /* -- RENDER -- */

  return (
    <div className='SessionTopBar'>
      <div className='Title'>
        Session: <span className='SessionName'>{session.name} </span>
      </div>
      <PropertyBadges>
        {resourcePools.map((pool) => (
          <ResourcePoolBadge
            key={pool._id}
            pool={pool}
            infiniteResources={session.config.infiniteResources}
          />
        ))}
      </PropertyBadges>
      <StatusBar />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link SessionTopBar}.
 */
export type TSessionTopBar_P = {}
