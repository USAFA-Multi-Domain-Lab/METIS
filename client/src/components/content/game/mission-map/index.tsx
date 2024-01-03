import ClientMission from 'src/missions'
import './index.scss'
import { useEffect, useMemo, useState } from 'react'
import { Vector1D, Vector2D } from '../../../../../../shared/toolbox/space'
import MissionNode from './objects/MissionNode'
import PanController from './ui/PanController'
import { v4 as generateHash } from 'uuid'
import Scene from './Scene'
import Grid from './objects/Grid'

/**
 * The default, starting x coordinate of the camera.
 */
const DEFAULT_CAMERA_X = 1.5
/**
 * The default, starting y coordinate of the camera.
 */
const DEFAULT_CAMERA_Y = 1.5
/**
 * The default, starting zoom level of the camera.
 */
const DEFAULT_CAMERA_ZOOM = 64

/**
 * Whether the mission map EM grid is enabled.
 */
export const MAP_EM_GRID_ENABLED = false

/**
 * Whether the mission map node grid is enabled.
 */
export const MAP_NODE_GRID_ENABLED = true

/**
 * The heart of METIS, a 2D map of the mission displaying nodes
 * in relation to each other.
 */
export default function MissionMap2({
  mission,
}: TMissionMap2): JSX.Element | null {
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

    let delta: number = event.deltaY ? event.deltaY : event.deltaX * 2.5

    cameraZoom.translate(delta * -0.1)

    //     let map: HTMLDivElement | null = this.rootRef.current
    //
    //     if (map) {
    //       let mapBounds: DOMRect = map.getBoundingClientRect()
    //       let currentMapScale: number = this.state.mapScale
    //       let currentMapOffsetX: number = this.state.mapOffsetX
    //       let currentMapOffsetY: number = this.state.mapOffsetY
    //       let updatedMapOffsetX: number = currentMapOffsetX
    //       let updatedMapOffsetY: number = currentMapOffsetY
    //       let delta: number = event.deltaY ? event.deltaY : event.deltaX * 2.5
    //       let updatedMapScale: number = currentMapScale + delta * 0.001 * -1
    //
    //       updatedMapScale = Math.min(
    //         Math.max(MissionMap.MIN_MAP_SCALE, updatedMapScale),
    //         MissionMap.MAX_MAP_SCALE,
    //       )
    //
    //       if (currentMapScale === updatedMapScale) {
    //         return
    //       }
    //
    //       let currentCursorMapCoordinates: IMapCoordinates =
    //         MissionMap.getMapCoordinates(
    //           event.clientX,
    //           event.clientY,
    //           mapBounds,
    //           currentMapOffsetX,
    //           currentMapOffsetY,
    //           currentMapScale,
    //         )
    //       let updatedCursorMapCoordinates: IMapCoordinates =
    //         MissionMap.getMapCoordinates(
    //           event.clientX,
    //           event.clientY,
    //           mapBounds,
    //           currentMapOffsetX,
    //           currentMapOffsetY,
    //           updatedMapScale,
    //         )
    //       let differenceX: number =
    //         updatedCursorMapCoordinates.x - currentCursorMapCoordinates.x
    //       let differenceY: number =
    //         updatedCursorMapCoordinates.y - currentCursorMapCoordinates.y
    //       updatedMapOffsetX += differenceX
    //       updatedMapOffsetY += differenceY
    //
    //       this.setState({
    //         mapScale: updatedMapScale,
    //         mapOffsetX: updatedMapOffsetX,
    //         mapOffsetY: updatedMapOffsetY,
    //       })
    //     }
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
    <div className='MissionMap2' onWheel={onWheel}>
      <PanController cameraPosition={cameraPosition} />
      <Scene cameraPosition={cameraPosition} cameraZoom={cameraZoom}>
        {/* Scene objects */}
        <Grid type={'em'} enabled={MAP_EM_GRID_ENABLED} />
        <Grid type={'node'} enabled={MAP_NODE_GRID_ENABLED} />
        {nodesJsx}
      </Scene>
    </div>
  )
}

/**
 * Props for `MissionMap2`.
 */
export type TMissionMap2 = {
  /**
   * The mission to display on the map.
   */
  mission: ClientMission
}
