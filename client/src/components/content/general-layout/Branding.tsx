import { useGlobalContext } from 'metis/client/context/global'
import { compute } from 'metis/client/toolbox'
import Tooltip from '../communication/Tooltip'
import './Branding.scss'

/* -- components -- */

// This will brand the app with the
// logo.
const Branding = ({ linksHome = true }: TBranding): TReactElement | null => {
  // Gather details.
  const globalContext = useGlobalContext()
  const { navigateTo } = globalContext.actions

  /**
   * The class for the root element of the component.
   */
  const rootClass: string = compute(() => {
    let classes: string[] = ['Branding']

    if (!linksHome) {
      classes.push('Disabled')
    }

    return classes.join(' ')
  })

  return (
    <div
      className={rootClass}
      onClick={() => {
        if (linksHome) {
          navigateTo('HomePage', {})
        }
      }}
    >
      <div className='Emblem'></div>
      <div className='Logo'></div>
      {linksHome ? <Tooltip description={'Go home.'} /> : null}
    </div>
  )
}

/* -- types -- */

/**
 * Props for `Branding` component.
 */
export type TBranding = {
  /**
   * Whether the logo will link to the home page.
   * @default true
   */
  linksHome?: boolean
}

export default Branding
