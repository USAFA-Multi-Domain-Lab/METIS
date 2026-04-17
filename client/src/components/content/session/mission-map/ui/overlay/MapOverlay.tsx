import { ClassList } from '@shared/toolbox/html/ClassList'
import './MapOverlay.scss'

/**
 * An overlay to display on top of the mission map
 * which prevents normal interaction with the map
 * while modals are open.
 */
export default function MapOverlay({
  active,
}: TMapOverlay_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * Dynamic list of classes to apply to the root element.
   */
  const rootClasses = new ClassList('MapOverlay').set('Hidden', !active)

  /* -- RENDER -- */

  return <div className={rootClasses.value}></div>
}

/**
 * Props for {@link MapOverlay} component.
 */
export type TMapOverlay_P = {
  /**
   * Whether the overlay is currently active
   * and currently should be displayed.
   */
  active: boolean
}
