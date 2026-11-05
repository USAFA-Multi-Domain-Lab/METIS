import { useResizeObserver } from '@client/toolbox/hooks'
import type { Vector1D } from '@shared/toolbox/numbers/vectors/Vector1D'
import type { Vector2D } from '@shared/toolbox/numbers/vectors/Vector2D'
import { useCallback, useRef, useState } from 'react'
import type { TMapBounds, TMapSize } from './map-math'
import {
  boundsContain,
  boundsOverlap,
  calculateRenderedBounds,
  calculateViewBounds,
  getLineBounds,
  getNodeBounds,
} from './map-math'
import type { TLine_P } from './objects/Line'
import type { TMapCompatibleNode } from './objects/nodes'

/* -- CONSTANTS -- */

/**
 * How many times wider than the view the rendered bounds can get before they
 * are rebuilt. Fresh bounds are twice the view's width, so this is only passed
 * by zooming in, and the gap between the two stops a rebuild on every step.
 */
const RENDERED_BOUNDS_MAX_RATIO = 3

/* -- HOOK -- */

/**
 * Limits what a mission map renders to the objects in or near the view, since
 * the browser's cost of a zoom or a selection grows with every mounted object.
 * @param root The root element of the map, used to measure its size.
 * @param cameraPosition The position of the camera on the map.
 * @param cameraZoom The zoom level of the camera on the map.
 * @returns The tools for culling the map.
 */
export function useMapCulling(
  root: React.RefObject<HTMLElement | null>,
  cameraPosition: Vector2D,
  cameraZoom: Vector1D,
): TMapCulling {
  /* -- STATE -- */

  /**
   * The size of the map in pixels. This starts at the size of the window, which
   * can only overestimate the view, until the map's size has been measured.
   */
  const mapSize = useRef<TMapSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  /**
   * The area of the scene whose objects are rendered, in EM units.
   */
  const [renderedBounds, setRenderedBounds] = useState<TMapBounds>(() =>
    calculateRenderedBounds(cameraPosition, cameraZoom, mapSize.current),
  )

  /**
   * The latest {@link renderedBounds}. The camera's change handlers are created
   * once, so they can't read the state.
   */
  const renderedBoundsRef = useRef<TMapBounds>(renderedBounds)

  /* -- FUNCTIONS -- */

  /**
   * @see {@link TMapCulling.updateRenderedBounds}
   */
  const updateRenderedBounds = (): void => {
    let view = calculateViewBounds(cameraPosition, cameraZoom, mapSize.current)
    let current = renderedBoundsRef.current
    let currentWidth = current.right - current.left
    let viewWidth = view.right - view.left
    let oversized = currentWidth > viewWidth * RENDERED_BOUNDS_MAX_RATIO

    if (oversized || !boundsContain(current, view)) {
      let next = calculateRenderedBounds(
        cameraPosition,
        cameraZoom,
        mapSize.current,
      )
      renderedBoundsRef.current = next
      setRenderedBounds(next)
    }
  }

  /**
   * @see {@link TMapCulling.isNodeRendered}
   */
  const isNodeRendered = useCallback(
    (node: TMapCompatibleNode): boolean => {
      return boundsOverlap(renderedBounds, getNodeBounds(node))
    },
    [renderedBounds],
  )

  /**
   * @see {@link TMapCulling.isLineRendered}
   */
  const isLineRendered = useCallback(
    (line: TLine_P): boolean => {
      return boundsOverlap(renderedBounds, getLineBounds(line))
    },
    [renderedBounds],
  )

  /* -- EFFECTS -- */

  // Keep the map's size up to date, which also
  // replaces the estimate it starts with.
  useResizeObserver(root, (width, height) => {
    mapSize.current = { width, height }
    updateRenderedBounds()
  })

  return { mapSize, updateRenderedBounds, isNodeRendered, isLineRendered }
}

/* -- TYPES -- */

/**
 * The tools returned by {@link useMapCulling}.
 */
export type TMapCulling = {
  /**
   * The size of the map in pixels.
   */
  mapSize: React.RefObject<TMapSize>
  /**
   * Moves the rendered bounds to the camera if the view has reached their
   * edge, or if zooming in has left them much larger than the view. Otherwise,
   * this does nothing, which is what keeps panning free of React updates.
   * @note The camera's change handlers keep the copy from the first render, so
   * this must only rely on refs and state setters.
   */
  updateRenderedBounds: () => void
  /**
   * @param node The node in question.
   * @returns Whether the node should be rendered.
   * @note This changes identity when the rendered bounds move, so it can be
   * used as a memo dependency.
   */
  isNodeRendered: (node: TMapCompatibleNode) => boolean
  /**
   * @param line The line in question.
   * @returns Whether the line should be rendered.
   * @note This changes identity when the rendered bounds move, so it can be
   * used as a memo dependency.
   */
  isLineRendered: (line: TLine_P) => boolean
}
