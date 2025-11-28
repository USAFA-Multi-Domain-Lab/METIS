import { useGlobalContext } from '@client/context/global'
import { compute } from '@client/toolbox'
import { ClassList } from '@shared/toolbox/html/ClassList'
import type { TWithKey } from '@shared/toolbox/objects/ObjectToolbox'
import Tooltip from '../communication/Tooltip'
import { DetailToggle } from '../form/DetailToggle'
import { type TButtonText_P } from '../user-controls/buttons/ButtonText'
import DevOnly from '../util/DevOnly'
import './Footer.scss'

/* -- components -- */

/**
 * A basic footer display on pages.
 */
export default function Footer({}: TFooter): TReactElement | null {
  // Gather details.
  const globalContext = useGlobalContext()
  const { navigateTo } = globalContext.actions
  const [login] = globalContext.login
  const [info] = globalContext.info
  const [debugMode, setDebugMode] = globalContext.debugMode

  /* -- COMPUTED -- */

  /**
   * The class for the version display.
   */
  const versionClass = compute(() => {
    return new ClassList('Version').set(
      'Navigates',
      login?.user.isAuthorized('changelog_read'),
    )
  })

  /* -- FUNCTIONS -- */

  /**
   * Switches to the changelog page.
   */
  const viewChangelog = (): void => {
    if (login?.user.isAuthorized('changelog_read')) {
      navigateTo('DocPage', { source: 'changelog' })
    }
  }

  /**
   * Switches to the credits page.
   */
  const viewCredits = (): void => {
    navigateTo('DocPage', { source: 'credits' })
  }

  /* -- RENDER -- */

  return (
    <div className='Footer' draggable={false}>
      <div
        className={versionClass.value}
        onClick={viewChangelog}
        draggable={false}
      >
        {info.versionFormatted}
        <Tooltip description={'View changelog.'} />
      </div>
      <div className='FooterControls'>
        <DevOnly>
          <DetailToggle
            label='Debug Mode'
            value={debugMode}
            setValue={setDebugMode}
          />
        </DevOnly>
      </div>
      <div
        className={'Credits Navigates'}
        onClick={viewCredits}
        draggable={false}
      >
        Credits
      </div>
    </div>
  )
}

/* -- types -- */

/**
 * Props for `Navigation` component.
 */
export type TFooter = {
  /**
   * The links to include in the navigation.
   * @default []
   */
  links?: TWithKey<TButtonText_P>[]
  /**
   * Whether the logo will link to the home page.
   * @default true
   */
  logoLinksHome?: boolean
  /**
   * The box shadow used as a background for the navigation.
   * @default 'alt-2'
   */
  boxShadow?: TNavBoxShadow
}

/**
 * Box shadow options for the navigation.
 */
export type TNavBoxShadow = 'alt-3' | 'alt-6' | 'alt-7'
