import Tooltip from '@client/components/content/communication/Tooltip'
import PropertyBadges from '@client/components/content/general-layout/property-badges/PropertyBadges'
import StatusBar from '@client/components/content/session/StatusBar'
import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import { compute } from '@client/toolbox'
import SessionPage from '../SessionPage'
import { useSessionPageContext } from '../context'
import ResourcePoolBadge from './badges/ResourcePoolBadge'

// ! Styles rendered in SessionPage.scss

/**
 * The top bar to display on the {@link SessionPage} which
 * displays general details about the session.
 */
export default function SessionTopBar({}: TSessionTopBar_P): TReactElement | null {
  /* -- STATE -- */

  const { session, state } = useSessionPageContext()
  const [resourcePools] = state.resourcePools
  const [, setRealmSwitcherOpened] = state.realmSwitcherOpened

  // Engine for the realm switcher button. Rendered only for members with
  // complete visibility (see `canSwitchRealm` below). Clicking it opens the
  // realm-switcher modal.
  const realmSwitcherEngine = useButtonSvgEngine({
    elements: [
      {
        key: 'switch-realm',
        type: 'button',
        icon: 'switch',
        label: session.subscribedRealm.name,
        labelsInTooltip: false,
        description: '**Switch realm**',
        onClick: () => {
          setRealmSwitcherOpened(true)
        },
      },
    ],
    options: {
      revealLabels: true,
    },
  })

  /* -- COMPUTED -- */

  let canSwitchRealm =
    session.state === 'started' &&
    session.member.isAuthorized('completeVisibility') &&
    session.realmBasics.length > 1

  let titleTooltipDescription = compute<string>(() => {
    return (
      `###### Session:\n` +
      `${session.name}\n\t\n` +
      `###### Realm:\n` +
      `${session.subscribedRealm.name}\n\t\n` +
      `###### Session ID:\n` +
      `${session._id}\n\t\n` +
      `###### Mission:\n` +
      `${session.subscribedMission.name}`
    )
  })

  /* -- RENDER -- */

  return (
    <div className='SessionTopBar'>
      <StatusBar />
      <div className='Title'>
        <span className='SessionName'>
          {session.name}
          <Tooltip description={titleTooltipDescription} />
        </span>
        <span className='TitleSeparator'>{'·'}</span>
        <span className='RealmName'>
          {!canSwitchRealm && session.subscribedRealm.name}
          {canSwitchRealm && <ButtonSvgPanel engine={realmSwitcherEngine} />}
        </span>
      </div>
      <div className='Resources'>
        <PropertyBadges>
          {resourcePools.map((pool) => (
            <ResourcePoolBadge
              key={`pool-badge_${pool._id}`}
              pool={pool}
              infiniteResources={session.config.infiniteResources}
              compactFormattingEnabled
            />
          ))}
        </PropertyBadges>
      </div>
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link SessionTopBar}.
 */
export type TSessionTopBar_P = {}
