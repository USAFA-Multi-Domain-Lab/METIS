import { PAGE_REGISTRY, TPageKey } from 'src/components/pages'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import ButtonSvgPanel from '../user-controls/buttons/v3/ButtonSvgPanel'
import ButtonSvgEngine from '../user-controls/buttons/v3/engines'
import {
  TButtonSvg_Input,
  TButtonSvg_PK,
} from '../user-controls/buttons/v3/types'
import Branding from './Branding'
import './Navigation.scss'

/* -- components -- */

/**
 * A navigation bar to link users to different sections of
 * the application.
 */
export default function Navigation({
  buttonEngine,
  logoLinksHome = true,
}: TNavigation_P): JSX.Element | null {
  /**
   * The class for the root element.
   */
  const rootClass = compute(() => {
    // Gather details.
    let classList: string[] = ['Navigation']
    // Join and return class list.
    return classList.join(' ')
  })

  return (
    <div className={rootClass}>
      <Branding linksHome={logoLinksHome} />
      <ButtonSvgPanel engine={buttonEngine} />
    </div>
  )
}

/* -- FUNTIONS -- */

/**
 * @returns Button input used to create a button
 * which will link to the home page when clicked.
 */
export const HomeButton = (
  options: THomeButtonOptions = {},
): TButtonSvg_Input => {
  const { icon = 'home', description = 'Go home' } = options
  return {
    type: 'button',
    icon,
    description,
    onClick: usePageLink('HomePage', {}),
  }
}

/**
 * @returns Button input used to create a button
 * which will log out the user when clicked.
 */
export const LogoutButton = (
  options: TLogoutButtonOptions = {},
): TButtonSvg_Input => {
  const { middleware = () => Promise.resolve() } = options
  const globalContext = useGlobalContext()
  const { logout } = globalContext.actions

  return {
    type: 'button',
    icon: 'logout',
    description: 'Log out',
    onClick: async () => {
      await middleware()
      logout()
    },
  }
}

/**
 * Can be used for the {@link TButtonSvg_PK.onClick} prop
 * so that a button will link to the given page with the
 * given props.
 * @param pageKey The key of the page to which the button
 * will link.
 * @param pageProps The props to pass to the page.
 * @returns A function that, when called, will navigate
 * to the page with the given props.
 */
export function usePageLink<
  TKey extends TPageKey,
  TComponent extends (typeof PAGE_REGISTRY)[TKey],
  TProps extends Parameters<TComponent>[0] extends {}
    ? Parameters<TComponent>[0]
    : {},
>(pageKey: TKey, pageProps: TProps) {
  const globalContext = useGlobalContext()
  const { navigateTo } = globalContext.actions

  return () => {
    navigateTo(pageKey, pageProps)
  }
}

/* -- types -- */

/**
 * Props for {@link Navigation} component.
 */
export type TNavigation_P = {
  /**
   * The button engine to use to display buttons in
   * the engine.
   */
  buttonEngine: ButtonSvgEngine
  /**
   * Whether the logo will link to the home page.
   * @default true
   */
  logoLinksHome?: boolean
}

/**
 * Options for creating a home button.
 */
export type THomeButtonOptions = Pick<TButtonSvg_Input, 'icon' | 'description'>

/**
 * Options for creating a logout button.
 */
export type TLogoutButtonOptions = {
  /**
   * An async function that will be called before the
   * logout action is performed. If this function does
   * not resolve, the logout action will not be performed.
   */
  middleware?: () => Promise<void>
}
