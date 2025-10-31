import { PAGE_REGISTRY, TPageKey } from 'src/components/pages'
import { useGlobalContext } from 'src/context/global'
import { compute } from 'src/toolbox'
import { useRequireLogin } from 'src/toolbox/hooks'
import { useButtonMenuEngine } from '../user-controls/buttons/ButtonMenu'
import ButtonSvgPanel from '../user-controls/buttons/panels/ButtonSvgPanel'
import ButtonSvgEngine from '../user-controls/buttons/panels/engines'
import { useButtonSvgs } from '../user-controls/buttons/panels/hooks'
import {
  TButtonPanelInput,
  TButtonSvg_PK,
} from '../user-controls/buttons/panels/types'
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
}: TNavigation_P): TReactElement | null {
  const globalContext = useGlobalContext()
  const [devOptionsActive, setDevOptionsActive] = globalContext.devOptionsActive

  useButtonSvgs(buttonEngine, {
    key: 'dev-options',
    type: 'button',
    icon: 'code',
    // todo: Finish building this feature.
    hidden: true,
    // hidden: process.env.NODE_ENV !== 'development',
    onClick: () => {
      setDevOptionsActive(true)
    },
  })

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
 * @returns Creates a button for the navigation
 * which will link to the home page when clicked.
 */
export const HomeButton = (
  options: THomeButtonOptions = {},
): TButtonPanelInput<TButtonSvg_PK> => {
  const { icon = 'home', description = 'Go home' } = options
  return {
    key: icon,
    type: 'button',
    icon,
    description,
    onClick: usePageLink('HomePage', {}),
  }
}

/**
 * @returns Creates a button for the navigation
 * which will present user-profile options when
 * clicked.
 */
export const ProfileButton = (
  options: TLogoutButtonOptions = {},
): TButtonPanelInput<TButtonSvg_PK> => {
  const { middleware = () => Promise.resolve() } = options
  const globalContext = useGlobalContext()
  const login = useRequireLogin()
  const { logout, showButtonMenu } = globalContext.actions

  const buttonMenuEngine = useButtonMenuEngine({
    elements: [
      {
        key: 'username',
        type: 'text',
        value: login.user.username,
        size: 'regular',
        bold: true,
      },
      {
        key: 'full-name',
        type: 'text',
        value: login.user.name,
        size: 'small',
      },
      {
        key: 'logout',
        type: 'button',
        icon: 'logout',
        label: 'Logout',
        onClick: async () => {
          await middleware()
          logout()
        },
      },
    ],
    layout: ['username', 'full-name', '<divider>', '<slot>'],
  })

  return {
    key: 'profile',
    type: 'button',
    icon: 'user',
    description: 'View account details and options',
    onClick: async (event) => {
      showButtonMenu(buttonMenuEngine, {
        positioningTarget: event.target as HTMLDivElement,
      })
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
export type THomeButtonOptions = Pick<
  TButtonPanelInput<TButtonSvg_PK>,
  'icon' | 'description'
>

/**TButtonPanelInput<TButtonSvg_PK>
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
