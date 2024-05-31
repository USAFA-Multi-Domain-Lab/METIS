import './TabBar.scss'

/**
 * A bar with tabs that can be clicked to change the view.
 */
export default function TabBar({ children }: TTabBar_P): JSX.Element | null {
  /* -- STATE -- */

  /* -- COMPUTED -- */

  /* -- FUNCTIONS -- */

  /* -- RENDER -- */

  // Render root JSX.
  return <div className='TabBar'>{children}</div>
}

/**
 * Props for `TabBar`.
 */
export type TTabBar_P = {
  /**
   * Children of the tab bar.
   * @note The intended purpose is to pass `Tab`
   * components here.
   */
  children?: React.ReactNode
}
