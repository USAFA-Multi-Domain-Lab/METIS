import type { ClassList } from '@shared/toolbox/html/ClassList'
import { useEffect, useState } from 'react'
import { useMapContext } from '../../../MissionMap'

/**
 * A hook which essentially adds common logic to a
 * mission-map modal component, so that it behaves
 * as expected, triggering the overlay when active,
 * and not rendering anything when active.
 * @param active Whether the modal is currently active.
 * @param rootClasses A class list to apply to the root
 * element of the modal. This class list should applied
 * externally. The only thing this hook will do is add
 * the 'Hidden' class when the modal is inactive.
 */
export function useModalDisplayLogic(
  active: boolean,
  rootClasses: ClassList,
): void {
  const mapContext = useMapContext()
  const { state } = mapContext
  const [_, setModalCount] = state.modalCount
  const [previouslyActive, setPreviouslyActive] = useState<boolean>(false)

  // Switches the overlay active state based on
  // the modal active prop.
  useEffect(() => {
    if (active && !previouslyActive) {
      setPreviouslyActive(true)
      setModalCount((count) => count + 1)
    } else if (!active && previouslyActive) {
      setPreviouslyActive(false)
      setModalCount((count) => count - 1)
    }
  }, [active])

  rootClasses.set('Hidden', !active)
}

/* -- TYPES -- */

/**
 * Props used for basic mission-map modals,
 * which simply toggle their visibility.
 */
export type TModalBasic_P = {
  /**
   * Whether the modal is currently active. If active,
   * the overlay will be enabled and the modal will be
   * rendered on the map. Otherwise, nothing will be
   * rendered, and the overlay will be disabled, allowing
   * users to interact with the map normally.
   */
  active: TReactState<boolean>
}
