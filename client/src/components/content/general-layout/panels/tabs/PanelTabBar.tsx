import { usePostRenderEffect } from '@client/toolbox/hooks'
import { useEffect, useRef } from 'react'
import { usePanelContext } from '../Panel'
import PanelTab from './PanelTab'
import './PanelTabBar.scss'

/**
 * A bar in a panel that contains tabs which can be
 * clicked on to switch in between different views.
 */
export default function PanelTabBar({}: TPanelTabBar_P): TReactElement | null {
  /* -- STATE -- */

  const { state, views, onViewSelected } = usePanelContext()
  const [selectedView, select] = state.selectedView

  /* -- REFS -- */

  const tabsElm = useRef<HTMLDivElement>(null)

  /* -- COMPUTED -- */

  const titlesKey = views.map((view) => view.title).join(',')

  /* -- EFFECTS -- */

  // Update the selection to the first title
  // when the component mounts or when the titles
  // change.
  useEffect(() => {
    let first = views[0] ?? null
    select(first)
    if (first) onViewSelected?.(first.title)

    // Reset scroll when the set of tabs changes.
    if (tabsElm.current) tabsElm.current.scrollLeft = 0
  }, [titlesKey])

  // Scroll the selected tab into view when selection changes.
  usePostRenderEffect(() => {
    let el = tabsElm.current
    if (!el) return

    let selected = el.querySelector('.PanelTab.Selected')
    selected?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selectedView])

  // Redirect vertical wheel events to horizontal scroll so the user
  // doesn't need to hold Shift.
  useEffect(() => {
    let el = tabsElm.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      el!.scrollLeft += e.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el!.removeEventListener('wheel', onWheel)
  }, [])

  /* -- RENDER -- */

  // If there are less than 2 titles, do not render the tab bar.
  if (views.length < 2) return null

  return (
    <div className='PanelTabBar'>
      <div className='Tabs' ref={tabsElm}>
        {views.map((view) => (
          <PanelTab key={view.title} view={view} />
        ))}
      </div>
    </div>
  )
}

/**
 * Prop type for `PanelTabBar`.
 */
export interface TPanelTabBar_P {}
