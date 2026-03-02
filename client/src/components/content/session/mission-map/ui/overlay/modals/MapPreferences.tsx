import Tooltip from '@client/components/content/communication/Tooltip'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import { useGlobalContext } from '@client/context/global'
import { useObjectFormSync, useRequireLogin } from '@client/toolbox/hooks'
import { ClassList } from '@shared/toolbox/html/ClassList'
import { useModalDisplayLogic, type TModalBasic_P } from '.'
import './MapPreferences.scss'

/**
 * Provides options to the user for customizing the mission map.
 */
export default function MapPreferences(
  props: TMapPreferences_P,
): TReactElement | null {
  /* -- STATE -- */

  const globalContext = useGlobalContext()
  const { handleError } = globalContext.actions
  const { login } = useRequireLogin()
  const { user } = login
  const [active, setActive] = props.active
  const preferencesState = useObjectFormSync(
    user.preferences.missionMap,
    ['panOnIssueSelection'],
    {
      onChange: async (prevState, revert) => {
        try {
          await user.$savePreferences()
        } catch (error) {
          revert()
          handleError({
            message: 'Failed to save map preference changes with server.',
            notifyMethod: 'bubble',
          })
        }
      },
    },
  )
  const [panOnIssueSelection, setPanOnIssueSelection] =
    preferencesState.panOnIssueSelection

  /* -- COMPUTED -- */

  const rootClasses = new ClassList('MapPreferences', 'MapModal')

  /* -- FUNCTIONS -- */

  /**
   * Closes the map preferences modal.
   */
  const onCloseRequest = (): void => {
    setActive(false)
  }

  /* -- EFFECTS -- */

  useModalDisplayLogic(active, rootClasses)

  /* -- RENDER -- */

  // If the map preferences are not visible,
  // do not render.
  // if (!mapPreferencesVisible) return null

  // Render root element.
  return (
    <div className={rootClasses.value}>
      <div className='Heading'>Map Preferences</div>
      <div className='Close'>
        <div className='CloseButton' onClick={onCloseRequest}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
      <DetailToggle
        label={'Pan On Issue Selection'}
        value={panOnIssueSelection}
        setValue={setPanOnIssueSelection}
        tooltipDescription='When enabled, any issue selected in the mission will cause the map to automatically pan to the associated node (Assuming there is an associated node).'
      />
    </div>
  )
}

/* -- TYPES -- */

/**
 * Props for {@link MapPreferences} component.
 */
export interface TMapPreferences_P extends TModalBasic_P {}
