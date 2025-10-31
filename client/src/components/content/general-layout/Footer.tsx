import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { TWithKey } from '../../../../../shared/toolbox/objects'
import Tooltip from '../communication/Tooltip'
import { DetailToggle } from '../form/DetailToggle'
import { TButtonText_P } from '../user-controls/buttons/ButtonText'
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

  /* -- computed -- */

  /**
   * The class for the version display.
   */
  const versionClass = compute(() => {
    // Gather details.
    let classList: string[] = ['Version']

    // Add 'Navigates' class if user is authorized.
    if (login?.user.isAuthorized('changelog_read')) {
      classList.push('Navigates')
    }

    // Join and return class list.
    return classList.join(' ')
  })

  /* -- functions -- */

  /**
   * Switches to the changelog page.
   */
  const viewChangelog = (): void => {
    if (login?.user.isAuthorized('changelog_read')) {
      navigateTo('ChangelogPage', {})
    }
  }

  /* -- render -- */

  return (
    <div className='Footer' draggable={false}>
      <div className={versionClass} onClick={viewChangelog} draggable={false}>
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
      <a
        href='https://www.midjourney.com/'
        className='Credit'
        draggable={false}
      >
        Photo by Midjourney
      </a>
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
