import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ClientMission from 'src/missions'
import ClientMissionForce from 'src/missions/forces'
import ClientMissionNode from 'src/missions/nodes'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import {
  useDefaultProps,
  useEventListener,
  withPreprocessor,
} from 'src/toolbox/hooks'
import { v4 as generateHash } from 'uuid'
import { Vector1D, Vector2D } from '../../../../../../shared/toolbox/space'
import ButtonSvgEngine from '../../user-controls/buttons/v3/engines'
import {
  useButtonSvgLayout,
  useButtonSvgs,
} from '../../user-controls/buttons/v3/hooks'
import './MissionMap.scss'
import Scene from './Scene'
import Grid from './objects/Grid'
import Line from './objects/Line'
import PrototypeSlot from './objects/PrototypeSlot'
import {
  MAX_NODE_CONTENT_ZOOM,
  MapNode,
  TMapCompatibleNode,
} from './objects/nodes'
import Hud from './ui/Hud'
import PanController from './ui/PanController'
import Overlay from './ui/overlay'
import { TTabBarTab } from './ui/tabs/TabBar'

/* -- CONSTANTS -- */

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
 * The tab to display when no tabs exist.
 */
const INVALID_TAB: TTabBarTab = {
  _id: 'invalid-tabs',
  text: 'Invalid Tab',
  color: '#ffffff',
}

/**
 * The master tab to display on the tab bar.
 */
const MASTER_TAB: TTabBarTab = {
  _id: 'master',
  text: 'Master',
  color: '#ffffff',
}

/* -- CONTEXT -- */

/**
 * Context for the mission map, which will help distribute
 * mission map properties to its children.
 */
const MapContext = React.createContext<TMapContextData | null>(null)

/**
 * Hook used by mission-map-related components to access
 * the mission-map context.
 */
export const useMapContext = () => {
  const context = useContext(MapContext) as TMapContextData | null
  if (!context) {
    throw new Error('useMapContext must be used within an map provider')
  }
  return context
}

/* -- COMPONENTS -- */

/**
 * The heart of METIS, a 2D map of the mission displaying nodes
 * in relation to each other.
 */
export default function MissionMap(props: TMissionMap_P): JSX.Element | null {
  /* -- PROPS -- */

  const defaultedProps = useDefaultProps(props, {
    overlayContent: null,
    buttonEngine: ButtonSvgEngine.use(),
    tabs: [],
    showMasterTab: true,
    tabAddEnabled: true,
    onTabAdd: null,
    onNodeSelect: null,
    onPrototypeSelect: null,
    applyNodeTooltip: null,
  })
  const {
    mission,
    overlayContent,
    tabs,
    buttonEngine,
    showMasterTab,
    onNodeSelect,
    onPrototypeSelect,
    applyNodeTooltip,
    tabAddEnabled,
    onTabAdd,
  } = defaultedProps

  /* -- STATE -- */

  const elements: TMissionMap_E = {
    root: useRef<HTMLDivElement>(null),
    scene: useRef<HTMLDivElement>(null),
  }

  const state: TMissionMap_S = {
    selectedForce: defaultedProps.selectedForce,
    tabIndex: withPreprocessor(
      useState<number>(0),
      (newValue): TReactSetterArg<number> => {
        // If the same tab is selected twice, reselect
        // the given force.
        if (tabIndex === newValue) mission.select(selectedForce ?? mission)
        return newValue
      },
    ),
  }

  const [selectedForce, selectForce] = state.selectedForce
  const [tabIndex, setTabIndex] = state.tabIndex

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
    new Vector1D(DEFAULT_CAMERA_ZOOM, {
      onChange: () => {
        buttonEngine.setDisabled('zoom-out', cameraZoom.x === MAX_CAMERA_ZOOM)
        buttonEngine.setDisabled('zoom-in', cameraZoom.x === MIN_CAMERA_ZOOM)
      },
    }),
  )

  /**
   * The provider for the map context.
   */
  const Provider = MapContext.Provider as React.Provider<TMapContextData>

  /* -- COMPUTED -- */

  /**
   * Whether to disable the zooming functionality of the map
   * via the mouse wheel or track pad.
   */
  const disableZoom: boolean = !!overlayContent

  /**
   * The current value to provide to all child
   * components of the map.
   */
  const contextValue: TMapContextData = {
    ...defaultedProps,
    elements,
    state,
  }

  /* -- FUNCTIONS -- */

  /**
   * Pre-translates the scene to the camera position in the
   * state. This makes the panning appear snappier.
   */
  const preTranslateScene = (): void => {
    // If the scene element exists, pre translate it.
    if (elements.scene.current) {
      // Set the scene element's position to the
      // negative of the camera position.
      elements.scene.current.style.transform = `translate(${-cameraPosition.x}em, ${-cameraPosition.y}em)`
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

  /**
   * Handles a mouse wheel event on the map.
   */
  const onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    // If zooming is disabled, abort.
    if (disableZoom) return

    // Prevent default behavior.
    event.preventDefault()

    // Get root element.
    let rootElm: HTMLDivElement | null = elements.root.current

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
    if (!elements.scene.current) return
    elements.scene.current.style.transform = `translate(${-cameraPosition.x}em, ${-cameraPosition.y}em)`
    elements.scene.current.style.fontSize = `${1 / cameraZoom.x}px`
  }

  /**
   * Callback for when the zoom-in button
   * is clicked.
   */
  const onClickZoomIn = (): void => {
    const zoomInStages: number[] = [...CAMERA_ZOOM_STAGES].reverse()
    // Loop through the zoom in stages and
    // set the camera zoom to the first stage
    // that is less than the current zoom.
    for (let stage of zoomInStages) {
      if (stage < cameraZoom.x) {
        cameraZoom.x = stage
        break
      }
    }
  }

  /**
   * Callback for when the zoom-out button
   * is clicked.
   */
  const onClickZoomOut = (): void => {
    const zoomOutStages: number[] = [...CAMERA_ZOOM_STAGES]
    // Loop through the zoom out stages and
    // set the camera zoom to the first stage
    // that is greater than the current zoom.
    for (let stage of zoomOutStages) {
      if (stage > cameraZoom.x) {
        cameraZoom.x = stage
        break
      }
    }
  }

  /* -- HOOKS -- */

  // Create an event listener to handle when the mission
  // structure changes by forcing a state update.
  useEventListener(mission, 'autopan', () => {
    // If new nodes were revealed...
    if (
      elements.root.current &&
      mission.lastOpenedNode &&
      mission.lastOpenedNode.hasChildren
    ) {
      // Grab the map bounds.
      let mapBounds: DOMRect = elements.root.current.getBoundingClientRect()
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
      // Get the child node closest to the last opened node
      // along the x-axis.
      // ** This is necessary because child nodes can have
      // ** different depths due to the child node's prototype
      // ** having depth padding that's greater than 0.
      let closestChildNode = mission.lastOpenedNode.children.reduce(
        (closest, current) => {
          let currentDepth = current.prototype.depth
          let closestDepth = closest.prototype.depth
          return currentDepth < closestDepth ? current : closest
        },
      )
      // Get the span of what's visible in the scene in terms
      // of nodes.
      let nodeDifference = closestChildNode.prototype.depth + 1 - sceneNodeX2
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

  // Create an event listener to handle when the mission
  // structure changes by forcing a state update.
  useEventListener(mission, 'structure-change', () =>
    setStructureChangeKey(mission.structureChangeKey),
  )

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
      tabsComputed.forEach((tab, index) => {
        if (tab._id === forceId && index !== tabIndex) {
          setTabIndex(index)
        }
      })

      // Set force.
      selectForce(force)
    },
    [selectedForce, tabs],
  )

  // Initialize buttons for the map.
  useButtonSvgs(
    buttonEngine,
    {
      icon: 'zoom-in',
      onClick: onClickZoomIn,
      description:
        'Zoom in. \n*Scrolling on the map will also zoom in and out.*',
      cursor: 'zoom-in',
    },
    {
      icon: 'zoom-out',
      onClick: onClickZoomOut,
      description:
        'Zoom out. \n*Scrolling on the map will also zoom in and out.*',
      cursor: 'zoom-out',
    },
    {
      icon: 'question',
      description:
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
  )
  useButtonSvgLayout(buttonEngine, '<slot>', 'zoom-in', 'zoom-out', 'question')

  /**
   * Updates the mission selection when the tab index changes.
   */
  useEffect(() => {
    // Get force from the tab ID.
    let force = mission.getForceById(selectedTab._id)

    // If a force is found, select it in the mission.
    if (force) {
      mission.select(force)
    }
    // Else deselect all, showing the master tab.
    else {
      mission.deselect()
    }
  }, [tabIndex])

  /* -- COMPUTED -- */

  /**
   * The tabs to display in the tab bar.
   */
  const tabsComputed = compute(() => {
    let results: TTabBarTab[] = []

    // If the master tab is marked as shown,
    // add it to the tabs.
    if (showMasterTab) {
      results.push(MASTER_TAB)
    }

    // Add custom tabs.
    if (tabs.length > 0) {
      results.push(...tabs)
    }

    // Return tabs.
    return results
  })

  /**
   * The currently selected tab.
   */
  const selectedTab: TTabBarTab = compute(() => {
    if (tabsComputed.length === 0) return INVALID_TAB
    else return tabsComputed[tabIndex]
  })

  /**
   * The class name for the root element.
   */
  const rootClassName: string = compute(() => {
    let classList = ['MissionMap']

    // Add the creation mode class if the mission
    // is in creation mode.
    if (mission.transformation) {
      classList.push('Transformation')
    }
    // Add has slots class if the mission has
    // prototype slots.
    if (mission.prototypeSlots.length > 0) {
      classList.push('HasSlots')
    }

    return classList.join(' ')
  })

  /* -- RENDER -- */

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
    /**
     * Renders the given nodes into JSX.
     * @param nodes The nodes to render.
     * @param onSelect Callback for when a node is selected.
     * @param applyTooltip Callback for applying a tooltip to a node.
     */
    const render = <TNode extends TMapCompatibleNode>(
      nodes: TNode[],
      onSelect: ((node: TNode) => void) | null,
      applyTooltip: ((node: TNode) => string) | null,
    ): JSX.Element[] => {
      return nodes.map((node) => {
        return (
          <MapNode
            key={node._id}
            node={node}
            cameraZoom={cameraZoom}
            onSelect={onSelect}
            applyTooltip={applyTooltip}
          />
        )
      })
    }

    // If a force is selected, render the nodes
    // for that force. Otherwise, render the prototypes.
    if (selectedForce) {
      return render(selectedForce.nodes, onNodeSelect, applyNodeTooltip)
    } else {
      return render(mission.prototypes, onPrototypeSelect, null)
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
    buttonEngine.panelElements,
    // The selected force changes.
    selectedForce,
  ])

  /**
   * The JSX for the prototype slot objects rendered in the scene.
   * @memoized
   */
  const slotsJsx = useMemo((): JSX.Element[] => {
    return mission.prototypeSlots.map((slot) => (
      <PrototypeSlot key={`${slot.relative._id}${slot.relation}`} {...slot} />
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
    buttonEngine.panelElements,
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
    <Provider value={contextValue}>
      <div className={rootClassName} ref={elements.root} onWheel={onWheel}>
        <PanController
          cameraPosition={cameraPosition}
          cameraZoom={cameraZoom}
          onPan={preTranslateScene}
        />
        <Scene
          cameraPosition={cameraPosition}
          cameraZoom={cameraZoom}
          ref={elements.scene}
        >
          {/* Scene objects */}
          <Grid type={'em'} enabled={MAP_EM_GRID_ENABLED} />
          <Grid type={'node'} enabled={MAP_NODE_GRID_ENABLED} />
          {linesJsx}
          {nodesJsx}
          {slotsJsx}
        </Scene>
        <Hud
          tabs={tabsComputed}
          tabIndex={tabIndex}
          setTabIndex={setTabIndex}
        />
        {overlayJsx}
      </div>
    </Provider>
  )
}

/* -- FUNCTIONS -- */

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

/* -- TYPES -- */

/**
 * Elements that need to be referenced throughout the
 * component tree of {@link MissionMap}.
 */
export type TMissionMap_E = {
  /**
   * The root element of the map.
   */
  root: React.RefObject<HTMLDivElement>
  /**
   * The scene element of the map.
   */
  scene: React.RefObject<HTMLDivElement>
}

/**
 * Props for `MissionMap`.
 */
export type TMissionMap_P = {
  /**
   * The mission to display on the map.
   */
  mission: ClientMission
  /**
   * Engine to power buttons in the map title bar.
   * @note This defaults to an internally managed engine.
   */
  buttonEngine?: ButtonSvgEngine
  /**
   * The tabs to display on the tab bar.
   * @default []
   */
  tabs?: TTabBarTab[]
  /**
   * Content to display in the overlay.
   * @default null
   */
  overlayContent?: React.ReactNode
  /**
   * Whether to show the master tab.
   * @default true
   */
  showMasterTab?: boolean
  /**
   * The React state for tracking the currently selected force.
   * @note If undefined, the state will be created internally.
   */
  selectedForce: TReactState<ClientMissionForce | null>
  /**
   * Whether the add button in the tab bar
   * is enabled.
   * @default true
   * @note Only relevant if a callback for `onTabAdd`
   * is provided.
   */
  tabAddEnabled?: boolean
  /**
   * Handles when a tab is added.
   * @param tab The tab that was added.
   * @default null
   */
  onTabAdd?: (() => void) | null
  /**
   * Handles when a prototype is selected.
   * @param prototype The prototype that was selected.
   * @default null
   */
  onPrototypeSelect?: ((prototype: ClientMissionPrototype) => void) | null
  /**
   * Handles when a node is selected.
   * @param node The node that was selected.
   * @default null
   */
  onNodeSelect?: ((node: ClientMissionNode) => void) | null
  /**
   * Applies a tooltip to the given node.
   * @param node The node to apply the tooltip to.
   * @returns The tooltip description to display.
   * @default null
   */
  applyNodeTooltip?: ((node: ClientMissionNode) => string) | null
}

/**
 * Consolidated, high-level state for `MissionMap`.
 */
export type TMissionMap_S = {
  /**
   * The currently selected tab.
   */
  tabIndex: TReactState<number>
  /**
   * The currently selected force.
   */
  selectedForce: TReactState<ClientMissionForce | null>
}

/**
 * The map context data provided to all children
 * of {@link MissionMap}.
 */
export type TMapContextData = Required<TMissionMap_P> & {
  /**
   * The state for the output.
   */
  state: TMissionMap_S
  /**
   * The elements that need to be referenced throughout
   * the component tree.
   */
  elements: TMissionMap_E
}
