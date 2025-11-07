import Tooltip from '@client/components/content/communication/Tooltip'
import { DetailToggle } from '@client/components/content/form/DetailToggle'
import { useGlobalContext } from '@client/context/global'
import { useObjectFormSync, useRequireLogin } from '@client/toolbox/hooks'
import { useMapContext } from '../../../MissionMap'
import './MapPreferences.scss'

/**
 * Provides options to the user for customizing the mission map.
 */
export default function MapPreferences(): TReactElement | null {
  /* -- STATE -- */

  const mapContext = useMapContext()
  const globalContext = useGlobalContext()
  const { handleError } = globalContext.actions
  const { login } = useRequireLogin()
  const { user } = login
  const [mapPreferencesVisible, setMapPreferencesVisible] =
    mapContext.state.mapPreferencesVisible
  const preferencesState = useObjectFormSync(
    user.preferences.missionMap,
    ['panOnDefectSelection'],
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
  const [panOnDefectSelection, setPanOnDefectSelection] =
    preferencesState.panOnDefectSelection

  /* -- FUNCTIONS -- */

  /**
   * Closes the map preferences modal.
   */
  const onCloseRequest = (): void => {
    // Set the map preferences visible state to false.
    setMapPreferencesVisible(false)
  }

  /* -- RENDER -- */

  // If the map preferences are not visible,
  // do not render.
  if (!mapPreferencesVisible) return null

  // Render root element.
  return (
    <div className='MapPreferences MapModal'>
      <div className='Heading'>Map Preferences</div>
      <div className='Close'>
        <div className='CloseButton' onClick={onCloseRequest}>
          x
          <Tooltip description='Close window.' />
        </div>
      </div>
      <DetailToggle
        label={'Pan On Defect Selection'}
        value={panOnDefectSelection}
        setValue={setPanOnDefectSelection}
        tooltipDescription='When enabled, any defect selected in the mission will cause the map to automatically pan to the associated node (Assuming there is an associated node).'
      />
    </div>
  )
}
