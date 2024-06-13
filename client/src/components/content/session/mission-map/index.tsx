import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ClientMission from 'src/missions'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import { compute } from 'src/toolbox'
import { useEventListener } from 'src/toolbox/hooks'
import { v4 as generateHash } from 'uuid'
import Mission from '../../../../../../shared/missions'
import { TWithKey } from '../../../../../../shared/toolbox/objects'
import { Vector1D, Vector2D } from '../../../../../../shared/toolbox/space'
import { TButtonSvg } from '../../user-controls/ButtonSvg'
import Scene from './Scene'
import './index.scss'
import Grid from './objects/Grid'
import Line from './objects/Line'
import MissionNode, { MAX_NODE_CONTENT_ZOOM } from './objects/MissionNode'
import MissionNodeCreator from './objects/MissionNodeCreator'
import MissionPrototype from './objects/MissionPrototype'
import Hud from './ui/Hud'
import PanController from './ui/PanController'
import Overlay from './ui/overlay'
import { TTabBarTab } from './ui/tabs/TabBar'

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
export const CAMERA_ZOOM_STAGES: number[] = compute((): number[] => {
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
})

/**
 * Whether the mission map EM grid is enabled.
 */
export const MAP_EM_GRID_ENABLED = false

/**
 * Whether the mission map node grid is enabled.
 */
export const MAP_NODE_GRID_ENABLED = true

/**
 * The master tab to display on the tab bar.
 */
const MASTER_TAB: TTabBarTab = {
  _id: 'master',
  text: 'Master',
  color: '#ffffff',
}

/* -- components -- */

/**
 * The heart of METIS, a 2D map of the mission displaying nodes
 * in relation to each other.
 */
export default function MissionMap({
  mission,
  overlayContent,
  customButtons = [],
  onNodeSelect,
  applyNodeTooltip,
}: TMissionMap): JSX.Element | null {
  /* -- variables -- */

  /**
   * Whether to disable the zooming functionality of the map
   * via the mouse wheel or track pad.
   */
  const disableZoom: boolean = !!overlayContent

  /* -- refs -- */

  /**
   * Ref for the root element of the mission map.
   */
  const rootRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)

  /**
   * Ref for the scene element of the mission map.
   */
  const sceneRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)

  /* -- state -- */

  /**
   * Counter that is incremented whenever the component
   * needs to be re-rendered.
   */
  const [_, setForcedUpdateTracker] = useState<string>('initial')

  /**
   * The current structure change key for the mission.
   */
  const [structureChangeKey, setStructureChangeKey] = useState<string>(
    mission.structureChangeKey,
  )

  /**
   * The currently selected force.
   * @note If null, the master tab is selected.
   */
  const [selectedForce, setForce] = useState<ClientMissionForce | null>(null)

  /**
   * The selected tab in the HUD.
   */
  const [tabIndex, setTabIndex] = useState<number>(0)

  /**
   * Force the component to re-render.
   */
  const forceUpdate = useCallback(() => {
    setForcedUpdateTracker(generateHash())
  }, [])

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

  /* -- hooks -- */

  // Create an event listener to handle when the mission
  // structure changes by forcing a state update.
  useEventListener(mission, 'structure-change', () => {
    // Update the structure change key.
    setStructureChangeKey(mission.structureChangeKey)

    // If new nodes were revealed...
    if (
      rootRef.current &&
      mission.lastOpenedNode &&
      mission.lastOpenedNode.hasChildren
    ) {
      // Grab the map bounds.
      let mapBounds: DOMRect = rootRef.current.getBoundingClientRect()
      // Get the camera position x in terms of
      // of nodes.
      let viewNodeX =
        (cameraPosition.x - ClientMissionNode.COLUMN_WIDTH / 2) /
        ClientMissionNode.COLUMN_WIDTH
      // Get the width of the what's visible in the
      // scene in terms of nodes.
      let sceneNodeW =
        (mapBounds.width * cameraZoom.x) / ClientMissionNode.COLUMN_WIDTH
      // Get the x position of the right-portion of what's
      // visible in the scene in terms of nodes.
      let sceneNodeX2 = viewNodeX + sceneNodeW
      // Get the span of what's visible in the scene in terms
      // of nodes.
      let nodeDifference =
        mission.lastOpenedNode.prototype.depth + 1 - sceneNodeX2
      // Convert difference to EM units.
      let emDifference = nodeDifference * ClientMissionNode.COLUMN_WIDTH

      // If there is a positive difference, translate.
      if (emDifference > 0) {
        // Get the destination.
        let destination = cameraPosition.clone().translateX(emDifference)
        // Pan smoothly to the destination.
        panSmoothly(destination)
      }
    }
  })

  // Listener for selection events within a mission. This
  // will update the selected force in the state.
  useEventListener(
    mission,
    'selection',
    () => {
      // Get force.
      let force = ClientMission.getForceFromSelection(mission.selection)

      // Ensure selected tab index corresponds with
      // the selection in the mission.
      let forceId = force?._id ?? MASTER_TAB._id
      tabs.forEach((tab, index) => {
        if (tab._id === forceId && index !== tabIndex) {
          setTabIndex(index)
        }
      })

      // Set force.
      setForce(force)
    },
    [selectedForce],
  )

  /**
   * Updates the mission selection when the tab index changes.
   */
  useEffect(() => {
    // Get force from the tab ID.
    let force = mission.getForce(selectedTab._id)

    // If a force is found, select it in the mission.
    if (force) {
      mission.select(force)
    }
    // Else deselect all, showing the master tab.
    else {
      mission.deselect()
    }
  }, [tabIndex])

  /* -- functions -- */

  /**
   * Handles a mouse wheel event on the map.
   */
  const onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    // If zooming is disabled, abort.
    if (disableZoom) return

    // Prevent default behavior.
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

    // Pre-transform the scene to make the zoom
    // feel snappier.
    if (!sceneRef.current) return
    sceneRef.current.style.transform = `translate(${-cameraPosition.x}em, ${-cameraPosition.y}em)`
    sceneRef.current.style.fontSize = `${1 / cameraZoom.x}px`
  }

  /**
   * Pre-translates the scene to the camera position in the
   * state. This makes the panning appear snappier.
   */
  const preTranslateScene = (): void => {
    // If the scene element exists, pre translate it.
    if (sceneRef.current) {
      // Set the scene element's position to the
      // negative of the camera position.
      sceneRef.current.style.transform = `translate(${-cameraPosition.x}em, ${-cameraPosition.y}em)`
    }
  }

  /**
   * Pans the camera gradually to the given destination.
   * @param destination The destination for the panning.
   */
  const panSmoothly = (destination: Vector2D): void => {
    // Determine the difference between the camera
    // position and the destination.
    let difference = Vector2D.difference(destination, cameraPosition)
    // Determine the change in position that
    // must occur this frame in the transition.
    let delta = difference.scaleByFactor(0.1)

    // Enforce cuttoff points so that the transition
    // doesn't exponentially slow down with no end.
    if (Math.abs(delta.x) < 0.003) {
      cameraPosition.x = destination.x
    }
    if (Math.abs(delta.y) < 0.003) {
      cameraPosition.y = destination.y
    }

    // If the camera is at the destination, end
    // the loop.
    if (cameraPosition.locatedAt(destination)) {
      return
    }

    // Translate by delta.
    cameraPosition.translateBy(delta)

    // Set a timeout for the next frame.
    setTimeout(() => panSmoothly(destination), 5)
  }

  /* -- computed -- */

  /**
   * The tabs to display in the tab bar.
   */
  const tabs = compute(() => {
    // Define tab list with master tab.
    let tabs: TTabBarTab[] = [MASTER_TAB]

    // Add force tabs.
    mission.forces.forEach((force) => {
      tabs.push({
        _id: force._id,
        text: force.name,
        color: force.color,
      })
    })

    // Return tabs.
    return tabs
  })

  /**
   * The currently selected tab.
   */
  const selectedTab: TTabBarTab = compute(() => {
    return tabs[tabIndex]
  })

  /**
   * The data for the buttons displayed on the HUD.
   */
  const buttons = compute((): TWithKey<TButtonSvg>[] => {
    let zoomInStages: number[] = [...CAMERA_ZOOM_STAGES].reverse()
    let zoomOutStages: number[] = [...CAMERA_ZOOM_STAGES]

    // Return buttons.
    return [
      // Add custom buttons.
      ...customButtons,

      {
        icon: 'zoom-in',
        key: 'zoom-in',
        onClick: () => {
          // Loop through the zoom in stages and
          // set the camera zoom to the first stage
          // that is less than the current zoom.
          for (let stage of zoomInStages) {
            if (stage < cameraZoom.x) {
              cameraZoom.x = stage
              break
            }
          }
        },
        tooltipDescription:
          'Zoom in. \n*Scrolling on the map will also zoom in and out.*',
        cursor: 'zoom-in',
      },
      {
        icon: 'zoom-out',
        key: 'zoom-out',
        onClick: () => {
          // Loop through the zoom out stages and
          // set the camera zoom to the first stage
          // that is greater than the current zoom.
          for (let stage of zoomOutStages) {
            if (stage > cameraZoom.x) {
              cameraZoom.x = stage
              break
            }
          }
        },
        tooltipDescription:
          'Zoom out. \n*Scrolling on the map will also zoom in and out.*',
        cursor: 'zoom-out',
      },
      {
        icon: 'question',
        key: 'question',
        onClick: () => {},
        tooltipDescription:
          '##### Mission Map\n' +
          'This map is a layout of the nodes in the mission and their order of progression (left to right). \n' +
          '\t\n' +
          'The lines indicate how the nodes relate to one another and help display their order of progression. \n' +
          '\t\n' +
          'The children of a node are revealed when certain criteria are met (e.g. an action is successfully executed on a node). \n' +
          '\t\n' +
          '##### Controls:\n' +
          '`Click+Drag` *Pan.*\n' +
          '\t\n' +
          '`Scroll` *Zoom in/out.*\n',
        cursor: 'help',
      },
    ]
  })

  /**
   * The class name for the root element.
   */
  const rootClassName: string = compute(() => {
    let classList = ['MissionMap']

    // Add the creation mode class if the mission
    // is in creation mode.
    if (mission.creationMode) {
      classList.push('CreationMode')
    }

    return classList.join(' ')
  })

  /**
   * Callback for when a request to add a new tab
   * (force) is made.
   */
  const onTabAdd = compute(() => {
    // If the mission has reached the maximum number
    // of forces, return null, disabling the add button.
    if (mission.forces.length >= Mission.MAX_FORCE_COUNT) return null

    // Return default callback.
    return () => {
      mission.createForce()
    }
  })

  /* -- render -- */

  /**
   * The JSX for the relationship lines drawn between nodes.
   * @memoized
   */
  const linesJsx = useMemo((): JSX.Element[] => {
    if (selectedForce === null) {
      return mission.relationshipLines.map((lineData) => {
        return <Line {...lineData} />
      })
    } else {
      return selectedForce.relationshipLines.map((lineData) => {
        return <Line {...lineData} />
      })
    }
  }, [
    // ! Recomputes when:
    // The mission changes.
    mission,
    // Change in the node structure of
    // the mission.
    structureChangeKey,
    // The selected force changes.
    selectedForce,
  ])

  /**
   * The JSX for the node objects rendered in the scene.
   * @memoized
   */
  const nodesJsx = useMemo((): JSX.Element[] => {
    if (selectedForce === null) {
      return mission.prototypes.map((prototype) => {
        // Construct the onSelect callback for
        // the specific prototype using the generic
        // onSelect callback passed in props.
        // let onSelect = onNodeSelect ? () => onNodeSelect(prototype) : undefined
        // let applyTooltip = applyNodeTooltip
        //   ? () => applyNodeTooltip(prototype)
        //   : undefined

        // Return the JSX for the prototype.
        return (
          <MissionPrototype
            key={prototype._id}
            prototype={prototype}
            cameraZoom={cameraZoom}
            // onSelect={onSelect}
            // applyTooltip={applyTooltip}
          />
        )
      })
    } else {
      return selectedForce.nodes.map((node) => {
        // Construct the onSelect callback for
        // the specific node using the generic
        // onNodeSelect callback passed in props.
        let onSelect = onNodeSelect ? () => onNodeSelect(node) : undefined
        let applyTooltip = applyNodeTooltip
          ? () => applyNodeTooltip(node)
          : undefined

        // Return the JSX for the node.
        return (
          <MissionNode
            key={node._id}
            node={node}
            cameraZoom={cameraZoom}
            onSelect={onSelect}
            applyTooltip={applyTooltip}
          />
        )
      })
    }
  }, [
    // ! Recomputes when:
    // The mission changes.
    mission,
    // Change in the node structure of
    // the mission.
    structureChangeKey,
    // Whether the camera zoom crosses the threshold where
    // the node names should be displayed/hidden.
    cameraZoom.x > MAX_NODE_CONTENT_ZOOM,
    // The custom buttons change.
    customButtons,
    // The selected force changes.
    selectedForce,
  ])

  /**
   * The JSX for the node creator objects rendered in the scene.
   * @memoized
   */
  const nodeCreatorsJsx = useMemo((): JSX.Element[] => {
    return mission.nodeCreators.map((creator) => (
      <MissionNodeCreator key={creator.nodeId} creator={creator} />
    ))
  }, [
    // ! Recomputes when:
    // The mission changes.
    mission,
    // Change in the node structure of
    // the mission.
    structureChangeKey,
    // Whether the camera zoom crosses the threshold where
    // the node names should be displayed/hidden.
    cameraZoom.x > MAX_NODE_CONTENT_ZOOM,
    // The custom buttons change.
    customButtons,
  ])

  /**
   * JSX for an overlay that is displayed only if content is
   * passed in the props for the map.
   */
  const overlayJsx = compute((): JSX.Element | null => {
    // If there is no overlay content, return null.
    if (!overlayContent) return null

    // Otherwise, render the overlay.
    return <Overlay>{overlayContent}</Overlay>
  })

  // Render root JSX.
  return (
    <div className={rootClassName} ref={rootRef} onWheel={onWheel}>
      <PanController
        cameraPosition={cameraPosition}
        cameraZoom={cameraZoom}
        onPan={preTranslateScene}
      />
      <Scene
        cameraPosition={cameraPosition}
        cameraZoom={cameraZoom}
        ref={sceneRef}
      >
        {/* Scene objects */}
        <Grid type={'em'} enabled={MAP_EM_GRID_ENABLED} />
        <Grid type={'node'} enabled={MAP_NODE_GRID_ENABLED} />
        {linesJsx}
        {nodesJsx}
        {nodeCreatorsJsx}
      </Scene>
      <Hud
        mission={mission}
        tabs={tabs}
        tabIndex={tabIndex}
        buttons={buttons}
        setTabIndex={setTabIndex}
        onTabAdd={onTabAdd}
      />
      {overlayJsx}
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
 * Props for `MissionMap`.
 */
export type TMissionMap = {
  /**
   * The mission to display on the map.
   */
  mission: ClientMission
  /**
   * Custom buttons to display in the button panel alongside
   * the default buttons.
   * @default []
   */
  customButtons?: TWithKey<TButtonSvg>[]
  /**
   * Content to display in the overlay.
   * @note If undefined, the overlay will not be displayed.
   * @default undefined
   */
  overlayContent?: React.ReactNode
  /**
   * Handles when a node is selected.
   * @param node The node that was selected.
   * @default undefined
   */
  onNodeSelect?: (node: ClientMissionNode) => void
  /**
   * Applies a tooltip to the given node.
   * @param node The node to apply the tooltip to.
   * @returns The tooltip description to display.
   * @default undefined
   */
  applyNodeTooltip?: (node: ClientMissionNode) => string
}
