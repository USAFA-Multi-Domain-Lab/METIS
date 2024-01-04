import ClientMission from 'src/missions'
import './index.scss'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Vector1D, Vector2D } from '../../../../../../shared/toolbox/space'
import MissionNode from './objects/MissionNode'
import PanController from './ui/PanController'
import { v4 as generateHash } from 'uuid'
import Scene from './Scene'
import Grid from './objects/Grid'
import Hud from './ui/Hud'

/* -- constants -- */

/**
 * The default, starting x coordinate of the camera.
 */
const DEFAULT_CAMERA_X = -1.5
/**
 * The default, starting y coordinate of the camera.
 */
const DEFAULT_CAMERA_Y = -1.5
/**
 * The default, starting zoom level of the camera.
 */
const DEFAULT_CAMERA_ZOOM = 1 / 64 // [numerator]em = [denominator]px

/**
 * The lowest zoom level the camera can be set to.
 */
const MIN_CAMERA_ZOOM = 1 / 128 // [numerator]em = [denominator]px

/**
 * The highest zoom level the camera can be set to.
 */
const MAX_CAMERA_ZOOM = 1 / 16 // [numerator]em = [denominator]px

/**
 * Whether the mission map EM grid is enabled.
 */
export const MAP_EM_GRID_ENABLED = false

/**
 * Whether the mission map node grid is enabled.
 */
export const MAP_NODE_GRID_ENABLED = true

/* -- components -- */

/**
 * The heart of METIS, a 2D map of the mission displaying nodes
 * in relation to each other.
 */
export default function MissionMap2({
  mission,
}: TMissionMap2): JSX.Element | null {
  /* -- refs -- */

  /**
   * Ref for the root element of the mission map.
   */
  const rootRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)

  /* -- state -- */
  /**
   * Counter that is incremented whenever the component
   * needs to be re-rendered.
   */
  const [_, setForcedUpdateTracker] = useState<string>('initial')

  /**
   * Force the component to re-render.
   */
  function forceUpdate(): void {
    setForcedUpdateTracker(generateHash())
  }

  /**
   * The position to display the camera at. Changed by panning.
   */
  const [cameraPosition] = useState<Vector2D>(
    new Vector2D(DEFAULT_CAMERA_X, DEFAULT_CAMERA_Y, {
      onChange: () => forceUpdate(),
    }),
  )
  /**
   * The zoom level of the camera. Changed by zooming with a mouse or trackpad.
   */
  const [cameraZoom] = useState<Vector1D>(
    new Vector1D(DEFAULT_CAMERA_ZOOM, { onChange: () => forceUpdate() }),
  )

  /* -- hooks (continued) -- */

  // Add a structure change listener to the mission
  // passed in props anytime a new mission object
  // is passed.
  useEffect(() => {
    mission.addStructureListener(() => forceUpdate())
  }, [mission])

  /* -- functions -- */

  /**
   * Handles a mouse wheel event on the map.
   */
  const onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    event.preventDefault()

    // Get root element.
    let rootElm: HTMLDivElement | null = rootRef.current

    // If the root element doesn't exist, warn
    // and abort.
    if (!rootElm) {
      console.warn('Could not access root element for MissionMap.')
      return
    }

    // Gather details.
    let delta: number = event.deltaY ? event.deltaY : event.deltaX * 2.5
    let clientMouseCoords: Vector2D = new Vector2D(event.clientX, event.clientY)
    let mapBounds: DOMRect = rootElm.getBoundingClientRect()
    let deltaZoom = delta * 0.000075

    // Get the position of the mouse in the scene
    // before the zoom.
    let prevSceneMouseCoords: Vector2D = getSceneMouseCoords(
      mapBounds,
      clientMouseCoords,
      cameraPosition,
      cameraZoom,
    )

    // Translate the camera zoom by the determined
    // delta zoom, then clamp it to the min and max
    // zoom levels.
    cameraZoom.translate(deltaZoom).clamp(MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM)

    // Get the position of the mouse in the scene
    // after the zoom.
    let newSceneMouseCoords: Vector2D = getSceneMouseCoords(
      mapBounds,
      clientMouseCoords,
      cameraPosition,
      cameraZoom,
    )

    // Determine the difference between the mouse
    // position before and after the zoom.
    let difference: Vector2D = Vector2D.difference(
      prevSceneMouseCoords,
      newSceneMouseCoords,
    )

    // Translate the camera position by the difference
    // in mouse position.
    cameraPosition.translateBy(difference)
  }

  /* -- render -- */

  /**
   * The JSX for the node objects rendered in the scene.
   * @memoized
   */
  const nodesJsx = useMemo((): JSX.Element[] => {
    return mission.nodes.map((node) => {
      return <MissionNode key={node.nodeID} node={node} />
    })
  }, [mission.structureChangeKey, cameraPosition.toString()])

  // Render root JSX.
  return (
    <div className='MissionMap2' ref={rootRef} onWheel={onWheel}>
      <PanController cameraPosition={cameraPosition} cameraZoom={cameraZoom} />
      <Scene cameraPosition={cameraPosition} cameraZoom={cameraZoom}>
        {/* Scene objects */}
        <Grid type={'em'} enabled={MAP_EM_GRID_ENABLED} />
        <Grid type={'node'} enabled={MAP_NODE_GRID_ENABLED} />
        {nodesJsx}
      </Scene>
      <Hud />
    </div>
  )
}

/* -- functions -- */

/**
 * @param mapBounds The bounds of the map element in the DOM.
 * @param clientMouseCoords The clientX and clientY of the window.
 * @param cameraPosition The position of the camera on the map.
 * @param cameraZoom The zoom level of the camera on the map.
 * @returns The coordinates on the map where the cursor currently is, accounts for the camera position and zooming.
 */
function getSceneMouseCoords(
  mapBounds: DOMRect,
  clientMouseCoords: Vector2D,
  cameraPosition: Vector2D,
  cameraZoom: Vector1D,
): Vector2D {
  // Calculate the coordinates of the mouse relative to the
  // map bounds, rather than the client window.
  let mapMouseCoords: Vector2D = clientMouseCoords
    .clone()
    .translate(-mapBounds.x, -mapBounds.y)

  // Calculate the coordinates of the mouse relative to the
  // scene, with the camera position and zoom taken into account.
  let sceneMouseCoords: Vector2D = mapMouseCoords
    .clone()
    // Scale the mouse coordinates by the inverse of the camera zoom
    // to convert the mouse coordinates from screen pixel units to scene
    // units.
    .scaleBy(cameraZoom)
    // Translate the mouse coordinates by the camera position to
    // determine the true position of the mouse in the scene.
    .translateBy(cameraPosition)

  // Return the result.
  return sceneMouseCoords
}

/* -- types -- */

/**
 * Props for `MissionMap2`.
 */
export type TMissionMap2 = {
  /**
   * The mission to display on the map.
   */
  mission: ClientMission
}
