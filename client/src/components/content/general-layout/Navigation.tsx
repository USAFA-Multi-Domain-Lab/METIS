import { TGlobalContext } from 'src/context'
import { compute } from 'src/toolbox'
import { TWithKey } from '../../../../../shared/toolbox/objects'
import { ButtonText, TButtonText_P } from '../user-controls/buttons/ButtonText'
import Branding from './Branding'
import './Navigation.scss'

/* -- components -- */

/**
 * A navigation bar to link users to different sections of
 * the application.
 */
export default function Navigation({
  links = [],
  logoLinksHome = true,
  boxShadow = 'alt-3',
}: TNavigation): JSX.Element | null {
  /**
   * The class for the root element.
   */
  const rootClass = compute(() => {
    // Gather details.
    let classList: string[] = ['Navigation', boxShadow]
    // Join and return class list.
    return classList.join(' ')
  })

  return (
    <div className={rootClass}>
      <Branding linksHome={logoLinksHome} />
      <div className='Links'>
        {links.map((link) => (
          <ButtonText {...link} key={link.key} />
        ))}
      </div>
    </div>
  )
}

/* -- functions -- */

/**
 * Creates a navigation link to go home.
 * @param context The global context.
 * @param options Here props for the link can be overwritten with custom values.
 * @returns The navigation link.
 */
export const HomeLink = (
  context: TGlobalContext,
  options: Partial<TWithKey<TButtonText_P>> = {},
): TWithKey<TButtonText_P> => {
  return {
    text: 'Home',
    onClick: () => context.actions.navigateTo('HomePage', {}),
    key: 'home',
    ...options,
  }
}

/**
 * Creates a navigation link to logout the user.
 * @param context The global context.
 * @param options Here props for the link can be overwritten with custom values.
 * @returns The navigation link.
 */
export const LogoutLink = (
  context: TGlobalContext,
  options: Partial<TWithKey<TButtonText_P>> = {},
): TWithKey<TButtonText_P> => {
  return {
    text: 'Log out',
    onClick: context.actions.logout,
    key: 'logout',
    ...options,
  }
}

/* -- types -- */

/**
 * Props for `Navigation` component.
 */
export type TNavigation = {
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
