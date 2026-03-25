import Tooltip from '@client/components/content/communication/Tooltip'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import StatusBar from '@client/components/content/session/StatusBar'
import { compute } from '@client/toolbox'
import ResourcePoolBadge from '../../../content/general-layout/property-badges/implementations/ResourcePoolBadge'
import SessionPage from '../SessionPage'
import { useSessionPageContext } from '../context'

// ! Styles rendered in SessionPage.scss

/**
 * The top bar to display on the {@link SessionPage} which
 * displays general details about the session.
 */
export default function SessionTopBar({}: TSessionTopBar_P): TReactElement | null {
  const { session, state } = useSessionPageContext()
  const [resourcePools] = state.resourcePools
  let titleTooltipDescription = compute<string>(() => {
    return (
      `###### Session:\n` +
      `${session.name}\n\t\n` +
      `###### Session ID:\n` +
      `${session._id}\n\t\n` +
      `###### Mission:\n` +
      `${session.mission.name}`
    )
  })

  return (
    <div className='SessionTopBar'>
      <div className='Title'>
        Session: <span className='SessionName'>{session.name} </span>
        <Tooltip description={titleTooltipDescription} />
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
