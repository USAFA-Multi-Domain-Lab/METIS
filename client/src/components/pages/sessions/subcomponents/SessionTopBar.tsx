import Tooltip from '@client/components/content/communication/Tooltip'
import StatusBar from '@client/components/content/session/StatusBar'
import { compute } from '@client/toolbox'
import SessionPage from '../SessionPage'
import { useSessionPageContext } from '../context'
import ResourcePoolBadgeRow from './badges/ResourcePoolBadgeRow'

// ! Styles rendered in SessionPage.scss

/**
 * The top bar to display on the {@link SessionPage} which
 * displays general details about the session.
 */
export default function SessionTopBar({}: TSessionTopBar_P): TReactElement | null {
  /* -- STATE -- */

  const { session, state } = useSessionPageContext()
  const [resourcePools] = state.resourcePools

  /* -- COMPUTED -- */

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
  let rowCount = Math.ceil(resourcePools.length / 4)

  /* -- RENDER -- */

  return (
    <div className='SessionTopBar'>
      <StatusBar />
      <div className='Title'>
        Session: <span className='SessionName'>{session.name} </span>
        <Tooltip description={titleTooltipDescription} />
      </div>
      <div className='Resources'>
        {new Array(rowCount).fill(0).map((_, index) => (
          <ResourcePoolBadgeRow
            key={`pool-badge-row_${index}`}
            rowNumber={index + 1}
          />
        ))}
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link SessionTopBar}.
 */
export type TSessionTopBar_P = {}
