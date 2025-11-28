import { useEffect } from 'react'
import { usePanelContext } from '../Panel'
import PanelTab from './PanelTab'
import './PanelTabBar.scss'

/**
 * A bar in a panel that contains tabs which can be
 * clicked on to switch in between different views.
 */
export default function ({}: TPanelTabBar_P): TReactElement | null {
  /* -- STATE -- */

  const { state, views } = usePanelContext()
  const [_, select] = state.selectedView

  /* -- VALIDATION -- */

  /* -- COMPUTED -- */

  /**
   * The titles passed as an array.
   */
  const titleArray = views.map((view) => view.title)
  const titlesKey = titleArray.join(',')

  /* -- EFFECTS -- */

  // Update the selection to the first title
  // when the component mounts or when the titles
  // change.
  useEffect(() => {
    select(views[0] ?? null)
  }, [titlesKey])

  /* -- RENDER -- */

  // If there are less than 2 titles, do not
  // render the tab bar.
  if (views.length < 2) {
    return null
  }

  return (
    <div className='PanelTabBar'>
      {Array.from(views.values()).map((view) => (
        <PanelTab key={view.title} view={view} />
      ))}
    </div>
  )
}

/**
 * Prop type for `PanelTabBar`.
 */
export interface TPanelTabBar_P {}
