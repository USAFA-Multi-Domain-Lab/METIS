import ClientMission from 'src/missions'
import './index.scss'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Vector1D, Vector2D } from '../../../../../../shared/toolbox/space'
import MissionNode, { MAX_NODE_NAME_ZOOM } from './objects/MissionNode'
import PanController from './ui/PanController'
import { v4 as generateHash } from 'uuid'
import Scene from './Scene'
import Grid from './objects/Grid'
import Hud from './ui/Hud'
import ClientMissionNode from 'src/missions/nodes'
import Line from './objects/Line'
import { ButtonSVG, EButtonSVGPurpose } from '../../user-controls/ButtonSVG'

/* -- constants -- */

/**
 * The default, starting x coordinate of the camera.
 */
export const DEFAULT_CAMERA_X = ClientMissionNode.COLUMN_WIDTH / -2 - 1

/**
 * The default, starting y coordinate of the camera.
 */
export const DEFAULT_CAMERA_Y = ClientMissionNode.ROW_HEIGHT / -2 - 1

/**
 * The default, starting zoom level of the camera.
 */
export const DEFAULT_CAMERA_ZOOM = 1 / 64 // [numerator]em = [denominator]px

/**
 * The lowest zoom level the camera can be set to.
 */
export const MIN_CAMERA_ZOOM = 1 / 128 // [numerator]em = [denominator]px

/**
 * The highest zoom level the camera can be set to.
 */
export const MAX_CAMERA_ZOOM = 1 / 16 // [numerator]em = [denominator]px

/**
 * The number of zoom stages between the min and max zoom levels (minimum is 2).
 */
export const CAMERA_ZOOM_STAGE_COUNT = 8

/**
 * The zoom level stages between the min and max zoom levels.
 */
export const CAMERA_ZOOM_STAGES: number[] = ((): number[] => {
  // Results
  let stages: number[] = []
  // Get the reciprocal of the min and max zoom levels.
  let minReciprocal: number = 1 / MAX_CAMERA_ZOOM
  let maxReciprocal: number = 1 / MIN_CAMERA_ZOOM
  // The number of steps required to get
  // from the min to the max zoom level.
  let stepCount: number = Math.max(CAMERA_ZOOM_STAGE_COUNT - 1, 0)
  // The amount by which to increment the zoom level,
  // uses reciprocals to make the zoom level increase
  // more evenly.
  let stageDelta: number = (minReciprocal - maxReciprocal) / stepCount
  // The current value being evaluated by
  // the algorithm, starting at the reciprocal
  // of the max zoom.
  let cursor: number = maxReciprocal

  // Loop through and push stages.
  while (cursor >= minReciprocal) {
    // Push the recriprocal of the cursor,
    // to get the proper zoom level.
    stages.push(1 / cursor)
    // Increment the cursor.
    cursor += stageDelta
  }

  // Return results.
  return stages
})()

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
  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>): void => {
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
      let clientMouseCoords: Vector2D = new Vector2D(
        event.clientX,
        event.clientY,
      )
      let mapBounds: DOMRect = rootElm.getBoundingClientRect()
      let deltaZoom = delta * 0.000075

      // Get the position of the mouse in the scene
      // before the zoom.
      let prevSceneMouseCoords: Vector2D = calcSceneMouseCoords(
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
      let newSceneMouseCoords: Vector2D = calcSceneMouseCoords(
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
    },
    [],
  )

  /* -- render -- */

  /**
   * The JSX for the relationship lines drawn between nodes.
   * @memoized
   */
  const linesJsx = useMemo((): JSX.Element[] => {
    return mission.relationshipLines.map((lineData) => {
      return <Line {...lineData} />
    })
  }, [mission.structureChangeKey])

  /**
   * The JSX for the node objects rendered in the scene.
   * @memoized
   */
  const nodesJsx = useMemo((): JSX.Element[] => {
    return mission.nodes.map((node) => {
      return (
        <MissionNode key={node.nodeID} node={node} cameraZoom={cameraZoom} />
      )
    })
  }, [
    // Change in the node structure of
    // the mission.
    mission.structureChangeKey,
    // Change in camera position.
    cameraPosition.toString(),
    // Whether the camera zoom crosses the threshold where
    // the node names should be displayed/hidden.
    cameraZoom.x > MAX_NODE_NAME_ZOOM,
  ])

  /**
   * The data for the buttons displayed on the HUD.
   * @memoized
   */
  const buttons = useMemo((): ButtonSVG[] => {
    let zoomInStages: number[] = [...CAMERA_ZOOM_STAGES].reverse()
    let zoomOutStages: number[] = [...CAMERA_ZOOM_STAGES]

    /**
     * Gets the center of the map in scene coordinates.
     */
    const calcSceneCoordsAtMapCenter = (): Vector2D => {
      // Get bounds of map.
      let mapBounds: DOMRect | undefined =
        rootRef.current?.getBoundingClientRect()

      // If the root element doesn't exist, warn
      // and abort.
      if (!mapBounds) {
        throw new Error('Could not access root element for MissionMap.')
      }

      // Return the center of the map.
      return new Vector2D(mapBounds.width / 2, mapBounds.height / 2)
        .scaleBy(cameraZoom)
        .translateBy(cameraPosition)
    }

    // Return buttons.
    return [
      new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.ZoomIn,
        handleClick: () => {
          // Get the position in the scene centered
          // on the map before the zoom.
          let sceneCenterBefore: Vector2D = calcSceneCoordsAtMapCenter()

          // Loop through the zoom in stages and
          // set the camera zoom to the first stage
          // that is less than the current zoom.
          for (let stage of zoomInStages) {
            if (stage < cameraZoom.x) {
              cameraZoom.x = stage
              break
            }
          }

          // Get the position in the scene centered
          // on the map after the zoom.
          let sceneCenterAfter: Vector2D = calcSceneCoordsAtMapCenter()

          // Translate the camera position by the difference
          // in the scene center position. This will make the
          // zoom zoom out from the center of the map instead
          // of the top-left corner.
          cameraPosition.translateBy(
            Vector2D.difference(sceneCenterBefore, sceneCenterAfter),
          )
        },
        tooltipDescription:
          'Zoom in. \n*Scrolling on the map will also zoom in and out.*',
      }),
      new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.ZoomOut,
        handleClick: () => {
          // Get the position in the scene centered
          // on the map before the zoom.
          let sceneCenterBefore: Vector2D = calcSceneCoordsAtMapCenter()

          // Loop through the zoom out stages and
          // set the camera zoom to the first stage
          // that is greater than the current zoom.
          for (let stage of zoomOutStages) {
            if (stage > cameraZoom.x) {
              cameraZoom.x = stage
              break
            }
          }

          // Get the position in the scene centered
          // on the map after the zoom.
          let sceneCenterAfter: Vector2D = calcSceneCoordsAtMapCenter()

          // Translate the camera position by the difference
          // in the scene center position. This will make the
          // zoom zoom out from the center of the map instead
          // of the top-left corner.
          cameraPosition.translateBy(
            Vector2D.difference(sceneCenterBefore, sceneCenterAfter),
          )
        },
        tooltipDescription:
          'Zoom out. \n*Scrolling on the map will also zoom in and out.*',
      }),
    ]
  }, undefined)

  // Render root JSX.
  return (
    <div className='MissionMap2' ref={rootRef} onWheel={onWheel}>
      <PanController cameraPosition={cameraPosition} cameraZoom={cameraZoom} />
      <Scene cameraPosition={cameraPosition} cameraZoom={cameraZoom}>
        {/* Scene objects */}
        <Grid type={'em'} enabled={MAP_EM_GRID_ENABLED} />
        <Grid type={'node'} enabled={MAP_NODE_GRID_ENABLED} />
        {linesJsx}
        {nodesJsx}
      </Scene>
      <Hud mission={mission} buttons={buttons} />
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
function calcSceneMouseCoords(
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
