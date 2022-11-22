// -- imports --

import './MissionMap.scss'
import React from 'react'
import List from './List'
import strings from '../../modules/toolbox/strings'
import { EAjaxStatus } from '../../modules/toolbox/ajax'
import MoreInformation from './MoreInformation'
import { Mission } from '../../modules/missions'
import { MissionNode } from '../../modules/mission-nodes'
import { Action, EActionPurpose } from './Action'
import { ActionPanel } from './ActionPanel'

/* -- interfaces -- */

interface IMissionMap {
  mission: Mission
  missionAjaxStatus: EAjaxStatus
  handleNodeSelection: (node: MissionNode) => void
  handleMapCreateRequest: (() => void) | null
  handleMapEditRequest: (() => void) | null
  handleMapSaveRequest: (() => void) | null
  editCanBeRequested: boolean
  saveCanBeRequested: boolean
  applyNodeClassName: (node: MissionNode) => string
  renderNodeTooltipDescription: (node: MissionNode) => string
}

interface IMissionMap_S {
  visibleNodes: Array<MissionNode>
  relationships: Array<MissionNodeRelationship>
  lastStructureChangeKey: string
  navigationIsActive: boolean
  mapOffsetX: number
  mapOffsetY: number
  mapScale: number
}

// represents a location on the mission map
interface IMapCoordinates {
  x: number
  y: number
}

// represents a relationship between two
// nodes
class MissionNodeRelationship {
  prerequisite: MissionNode
  unlocks: MissionNode

  constructor(prerequisite: MissionNode, unlocks: MissionNode) {
    this.prerequisite = prerequisite
    this.unlocks = unlocks
  }
}

/* -- constants -- */

const defaultMapScale: number = 0.5
const maxMapScale: number = 2.0
const minMapScale: number = 0.25
const mapXScale: number = 440.0 /*px*/
const mapYScale: number = 110.0 /*px*/
const gridPaddingX: number = 100.0 /*px*/
const gridPaddingY: number = 20.0 /*px*/
const pointerOriginOffset: number = 20 /*px*/
const pointerArrowOffset: number = 30 /*px*/
const mapItemFontSize: number = 20 /*px*/
// const mapCuttoff: number = 1600 /*px*/

/* -- components -- */

export default class MissionMap extends React.Component<
  IMissionMap,
  IMissionMap_S
> {
  /* -- static functions -- */

  // gets the coordinates on the map where
  // the cursor currently is, accounts for
  // the mapScale and the offset from panning.
  static getMapCoordinates(
    clientX: number,
    clientY: number,
    mapBounds: DOMRect,
    mapUnscaledOffsetX: number,
    mapUnscaledOffsetY: number,
    mapScale: number,
  ): IMapCoordinates {
    let mapOffsetX = mapUnscaledOffsetX * mapScale
    let mapOffsetY = mapUnscaledOffsetY * mapScale
    let mapCoordinates: IMapCoordinates = {
      x: (clientX - mapOffsetX - mapBounds.x - mapBounds.width / 2) / mapScale,
      y: (clientY - mapOffsetY - mapBounds.y - mapBounds.height / 2) / mapScale,
    }
    return mapCoordinates
  }

  // takes an already mapped node, and
  // renders its tooltip.
  static renderMappedNodeTooltipDescription_default = (
    node: MissionNode,
  ): string => {
    let nodeTitle: string = node.name
    let nodeTypeInfo: string = ''
    let scoreInfo: string = ''
    let prompt: string = ''

    // Prompt construction.
    prompt = '##### View this node.'

    return `#### ${nodeTitle}\n${strings.limit(
      node.name, // ! This should be description
      160,
    )}\n${nodeTypeInfo}${scoreInfo}\n${prompt}`
  }

  /* -- fields -- */

  map: React.RefObject<HTMLDivElement> = React.createRef()

  /* -- getters -- */

  // inherited
  get defaultState(): IMissionMap_S {
    let mission: Mission = this.props.mission

    return {
      visibleNodes: [],
      relationships: [],
      lastStructureChangeKey: mission.structureChangeKey,
      navigationIsActive: false,
      mapOffsetX: 0,
      mapOffsetY: mapYScale * -3.5,
      mapScale: defaultMapScale,
    }
  }

  // inherited
  static defaultProps = {
    handleMapCreateRequest: null,
    handleMapEditRequest: null,
    handleMapSaveRequest: null,
    editCanBeRequested: true,
    saveCanBeRequested: true,
    applyMappedNodeClassName: () => '',
    renderMappedNodeTooltipDescription:
      MissionMap.renderMappedNodeTooltipDescription_default,
  }

  /* -- initialize -- */

  constructor(props: IMissionMap) {
    super(props)

    this.state = {
      ...this.defaultState,
    }
  }

  // inherited
  componentDidMount(): void {
    let mission: Mission = this.props.mission
    let map: HTMLDivElement | null = this.map.current

    window.addEventListener('wheel', this.preventMapZoomInterference, {
      passive: false,
    })
    mission.addStructureChangeHandler(this.forceUpdate)

    if (map !== null) {
      new ResizeObserver(this.forceUpdate).observe(map)
    }

    this.updateRelationships()
  }

  // inherited
  componentWillUnmount(): void {
    let mission: Mission = this.props.mission

    window.removeEventListener('wheel', this.preventMapZoomInterference)
    mission.removeStructureChangeHandler(this.forceUpdate)
  }

  /* -- functions | state-purposed -- */

  // inherited
  componentDidUpdate(previousProps: IMissionMap): void {
    if (
      previousProps.mission !== this.props.mission ||
      previousProps.missionAjaxStatus !== this.props.missionAjaxStatus ||
      this.state.lastStructureChangeKey !==
        this.props.mission.structureChangeKey
    ) {
      this.updateRelationships()
    }

    if (previousProps.mission !== this.props.mission) {
      previousProps.mission.removeStructureChangeHandler(this.forceUpdate)
      this.props.mission.addStructureChangeHandler(this.forceUpdate)
    }
  }

  // inherited
  forceUpdate = () => super.forceUpdate()

  // returns whether this node is linked with any
  // other node in the state
  nodeHasMappedRelationship(node: MissionNode): boolean {
    let relationships: MissionNodeRelationship[] = this.state.relationships
    for (let relationship of relationships) {
      if (
        `${relationship.prerequisite.nodeID}` === `${node.nodeID}` ||
        `${relationship.unlocks.nodeID}` === `${node.nodeID}`
      ) {
        return true
      }
    }
    return false
  }

  // loops through all mapped nodes and
  // determines the relationships between
  // the nodes and their prerequisites.
  // updates the state with these values so
  // when rendering the pointers, these values
  // are at the ready.
  updateRelationships = (
    parentNode: MissionNode = this.props.mission.rootNode,
    visibleNodes: Array<MissionNode> = [],
    relationships: Array<MissionNodeRelationship> = [],
  ): void => {
    let mission: Mission = this.props.mission
    let rootNode: MissionNode = mission.rootNode

    let childNodes: Array<MissionNode> = parentNode.childNodes

    for (let childNode of childNodes) {
      if (parentNode.nodeID !== rootNode.nodeID) {
        let relationship: MissionNodeRelationship = new MissionNodeRelationship(
          parentNode,
          childNode,
        )
        relationships.push(relationship)
      }
      visibleNodes.push(childNode)

      if (childNode.isExpanded) {
        this.updateRelationships(childNode, visibleNodes, relationships)
      }
    }

    this.setState({
      visibleNodes,
      relationships,
      lastStructureChangeKey: mission.structureChangeKey,
    })
  }

  // This prevents map zoom interference from
  // document scrolling.
  preventMapZoomInterference = (event: WheelEvent): void => {
    let map: HTMLDivElement | null = this.map.current
    if (
      map?.parentElement?.querySelector('.MissionMap:hover') &&
      event.shiftKey
    ) {
      event.preventDefault()
    }
  }

  // called when there is mouse movement inside the
  // map bounds. used to pan when mouse is held down.
  handleMapMouseMovement = (event: React.MouseEvent<HTMLDivElement>): void => {
    let navigationIsActive: boolean = this.state.navigationIsActive

    if (navigationIsActive) {
      let map: HTMLDivElement | null = this.map.current

      if (map) {
        let mapScale: number = this.state.mapScale
        let mapOffsetX: number =
          this.state.mapOffsetX + event.movementX / mapScale
        let mapOffsetY: number =
          this.state.mapOffsetY + event.movementY / mapScale

        // mapOffsetX = Math.min(mapOffsetX, mapCuttoff)
        // mapOffsetX = Math.max(mapOffsetX, -mapCuttoff)
        // mapOffsetY = Math.min(mapOffsetY, mapCuttoff)
        // mapOffsetY = Math.max(mapOffsetY, -mapCuttoff)

        this.setState((previousState: IMissionMap_S) => {
          return {
            mapOffsetX,
            mapOffsetY,
          }
        })
      }
    }
  }

  // called when the mouse wheel is trigged while
  // inside the map bounds. zooms the view in and
  // out.
  handleMapZoom = (event: React.WheelEvent<HTMLDivElement>): void => {
    event.preventDefault()

    // This cancels the zoom if the shift
    // key is not pressed.
    // if (!event.shiftKey) {
    //   return
    // }

    let map: HTMLDivElement | null = this.map.current
    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let currentMapScale: number = this.state.mapScale
      let currentMapOffsetX: number = this.state.mapOffsetX
      let currentMapOffsetY: number = this.state.mapOffsetY
      let updatedMapOffsetX: number = currentMapOffsetX
      let updatedMapOffsetY: number = currentMapOffsetY
      let delta: number = event.deltaY ? event.deltaY : event.deltaX * 2.5
      let updatedMapScale: number = currentMapScale + delta * 0.001

      updatedMapScale = Math.min(
        Math.max(minMapScale, updatedMapScale),
        maxMapScale,
      )

      if (currentMapScale === updatedMapScale) {
        return
      }
      let currentCursorMapCoordinates: IMapCoordinates =
        MissionMap.getMapCoordinates(
          event.clientX,
          event.clientY,
          mapBounds,
          currentMapOffsetX,
          currentMapOffsetY,
          currentMapScale,
        )
      let updatedCursorMapCoordinates: IMapCoordinates =
        MissionMap.getMapCoordinates(
          event.clientX,
          event.clientY,
          mapBounds,
          currentMapOffsetX,
          currentMapOffsetY,
          updatedMapScale,
        )
      let differenceX: number =
        updatedCursorMapCoordinates.x - currentCursorMapCoordinates.x
      let differenceY: number =
        updatedCursorMapCoordinates.y - currentCursorMapCoordinates.y
      updatedMapOffsetX += differenceX
      updatedMapOffsetY += differenceY
      this.setState({
        mapScale: updatedMapScale,
        mapOffsetX: updatedMapOffsetX,
        mapOffsetY: updatedMapOffsetY,
      })
    }
  }

  // called when the zoom in button is clicked.
  handleZoomInRequest = (): void => {
    let mapScale: number = this.state.mapScale
    if (mapScale < defaultMapScale) {
      mapScale += 0.125
    } else {
      mapScale += 0.25
    }
    mapScale = Math.min(Math.max(minMapScale, mapScale), maxMapScale)
    this.setState({ mapScale })
  }

  // called when the zoom in button is clicked.
  handleZoomOutRequest = (): void => {
    let mapScale: number = this.state.mapScale
    if (mapScale > defaultMapScale) {
      mapScale -= 0.25
    } else {
      mapScale -= 0.125
    }
    mapScale = Math.min(Math.max(minMapScale, mapScale), maxMapScale)
    this.setState({ mapScale })
  }

  /* -- functions | render -- */

  // renders a pointer that marks the progression
  // from one node to another.
  renderPointer(relationship: MissionNodeRelationship): JSX.Element | null {
    let map: HTMLDivElement | null = this.map.current

    if (map) {
      let mapScale: number = this.state.mapScale
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapOffsetX: number = this.state.mapOffsetX
      let mapOffsetY: number = this.state.mapOffsetY
      let prerequisiteX: number | null = relationship.prerequisite.mapX
      let prerequisiteY: number | null = relationship.prerequisite.mapY
      let unlocksX: number | null = relationship.unlocks.mapX
      let unlocksY: number | null = relationship.unlocks.mapY
      if (
        prerequisiteX !== null &&
        prerequisiteY !== null &&
        unlocksX !== null &&
        unlocksY !== null
      ) {
        // calculates the start and end coordinates
        // for the line element used as a pointer.
        let x0: number = 0
        let y0: number = 0
        let x1: number = mapOffsetX
        let y1: number = mapOffsetY
        let x2: number = mapOffsetX
        let y2: number = mapOffsetY
        x1 += prerequisiteX * mapXScale
        y1 += prerequisiteY * mapYScale
        x2 += unlocksX * mapXScale
        y2 += unlocksY * mapYScale
        x1 *= mapScale
        y1 *= mapScale
        x2 *= mapScale
        y2 *= mapScale
        x1 += mapBounds.width / 2
        x2 += mapBounds.width / 2
        y1 += mapBounds.height / 2
        y2 += mapBounds.height / 2
        x0 = x1
        y0 = y1
        // the pointer needs to have its start
        // and end offset so that the pointer doesn't
        // intersect the node and prerequisite elements.
        // if the node is above the prerequisite, the
        // start of the pointer needs to be below the
        // node element and above the prerequisite
        // element so it doesn't pass through and collide
        // with either element.
        // if (y1 > y2) {
        //   y1 -= (mapYScale / 2) * mapScale
        //   y2 += (mapYScale / 2) * mapScale - 0.001
        // } else if (y1 < y2) {
        //   y1 += (mapYScale / 2) * mapScale
        //   y2 -= (mapYScale / 2) * mapScale - 0.001
        // }
        if (x1 > x2) {
          x1 -= (mapXScale / 2) * mapScale
          x2 += (mapXScale / 2) * mapScale - 0.001
          // if (Math.abs(x1 - x2) > 1) {
          x1 += (gridPaddingX - pointerOriginOffset) * mapScale
          x2 -= (gridPaddingX - pointerArrowOffset) * mapScale
          // }
        } else if (x1 < x2) {
          x1 += (mapXScale / 2) * mapScale
          x2 -= (mapXScale / 2) * mapScale - 0.001
          // if (Math.abs(x1 - x2) > 1) {
          x1 -= (gridPaddingX - pointerOriginOffset) * mapScale
          x2 += (gridPaddingX - pointerArrowOffset) * mapScale
          // }
        }
        // if (Math.abs(x1 - x2) < 1 && Math.abs(y1 - y2) > 1) {
        //   if (x1 > x2) {
        //     x2 -= (mapXScale / 3) * mapScale
        //   } else if (x1 < x2) {
        //     x2 += (mapXScale / 3) * mapScale
        //   }
        // } else if (Math.abs(y1 - y2) < 1 && Math.abs(x1 - x2) > 1) {
        //   if (y1 > y2) {
        //     y2 -= (mapYScale / 3) * mapScale
        //   } else if (y1 < y2) {
        //     y2 += (mapYScale / 3) * mapScale
        //   }
        // }
        let key = `unlocks-${relationship.unlocks.nodeID}_prereq-${relationship.prerequisite.nodeID}`
        let strokeWidth: number = 4 * mapScale
        let includeOrigin = Math.abs(x1 - x2) > 1 || Math.abs(y1 - y2) > 1
        let includeVerticalLine: boolean = y1 != y2

        return (
          <g key={key}>
            <line
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              strokeWidth={strokeWidth}
              // markerStart={includeOrigin ? `url(#pointer-start)` : undefined}
            />
            {includeVerticalLine ? (
              <line
                x1={x1}
                y1={y1}
                x2={x1}
                y2={y2}
                strokeWidth={strokeWidth}
                markerStart={includeOrigin ? `url(#pointer-start)` : undefined}
              />
            ) : null}
            <line
              x1={x1}
              y1={y2}
              x2={x2}
              y2={y2}
              strokeWidth={strokeWidth}
              // markerStart={includeOrigin ? `url(#pointer-start)` : undefined}
              markerEnd={`url(#pointer-end)`}
            />
          </g>
        )
      }
    }
    return null
  }

  // renders all the pointers that mark the
  // progression of the nodes in the mission.
  renderPointers(): Array<JSX.Element | null> {
    let pointers: Array<JSX.Element | null> = []
    let map: HTMLDivElement | null = this.map.current
    let relationships: MissionNodeRelationship[] = this.state.relationships
    if (map) {
      // loops through each relationship between
      // node and prerequisite and renders
      // an arrow/pointer for each one.
      for (let relationship of relationships) {
        pointers.push(this.renderPointer(relationship))
      }
    }
    return pointers
  }

  // renders the action panel for the map,
  // allowing the user to perform certain
  // actions on the map.
  renderMapActionPanel(styling: React.CSSProperties): JSX.Element | null {
    let mapScale: number = this.state.mapScale
    let handleMapCreateRequest = this.props.handleMapCreateRequest
    let handleMapEditRequest = this.props.handleMapEditRequest
    let handleMapSaveRequest = this.props.handleMapSaveRequest
    let editCanBeRequested: boolean = this.props.editCanBeRequested
    let saveCanBeRequested: boolean = this.props.saveCanBeRequested
    let actionsUniqueClassName: string = 'map-actions'

    let availableActions = {
      zoomIn: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.ZoomIn,
        handleClick: this.handleZoomInRequest,
        tooltipDescription:
          'Zoom in. \n*[Shift + Scroll] on the map will also zoom in and out.*',
      }),
      zoomOut: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.ZoomOut,
        handleClick: this.handleZoomOutRequest,
        tooltipDescription:
          'Zoom out. \n*[Shift + Scroll] on the map will also zoom in and out.*',
      }),
      add: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Add,
        handleClick: handleMapCreateRequest ? handleMapCreateRequest : () => {},
        tooltipDescription: 'Create a new node.',
      }),
      edit: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Reorder,
        handleClick: handleMapEditRequest ? handleMapEditRequest : () => {},
        tooltipDescription: 'Edit the structure and order of nodes.',
        disabled: !editCanBeRequested,
      }),
      save: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Save,
        handleClick: () => {
          if (handleMapSaveRequest) {
            handleMapSaveRequest()
          }
        },
        tooltipDescription: 'Save changes.',
        disabled: !saveCanBeRequested,
      }),
    }
    let activeActions: Action[] = []

    activeActions.push(availableActions.zoomIn)
    activeActions.push(availableActions.zoomOut)

    if (handleMapCreateRequest !== null) {
      activeActions.push(availableActions.add)
    }

    if (handleMapEditRequest !== null) {
      activeActions.push(availableActions.edit)
    }

    if (handleMapSaveRequest !== null) {
      activeActions.push(availableActions.save)
    }

    if (mapScale === maxMapScale) {
      actionsUniqueClassName += ' map-is-zoomed-in'
    }

    if (mapScale === minMapScale) {
      actionsUniqueClassName += ' map-is-zoomed-out'
    }

    if (activeActions.length > 0) {
      return (
        <ActionPanel
          actions={activeActions}
          linkBack={null}
          styling={styling}
          uniqueClassName={actionsUniqueClassName}
        />
      )
    } else {
      return null
    }
  }

  // renders the help element for the map,
  // providing instructions to the user
  // on how to use the map
  renderHelp(styling: React.CSSProperties): JSX.Element | null {
    return (
      <div className='help' style={styling}>
        <MoreInformation
          tooltipDescription={
            '##### Mission Map\n' +
            'This map is a layout of the nodes in the mission and ' +
            'their order of progression. Arrows indicate ' +
            'the order nodes should be completed, with divergent arrows ' +
            'indicating a branch in the mission, with a choice of a path to go down.\n' +
            '##### Controls:\n\n' +
            '`Click+Drag` *Pan.*\n' +
            '`Shift+Scroll` *Zoom in/out.*\n'
          }
        />
      </div>
    )
  }

  // applys an addon class name to the node
  // passed from the mapped node list.
  applyMappedNodeClassName = (node: MissionNode) => {
    let className: string = ''

    let classNameExternalAddon: string = this.props.applyNodeClassName(node)

    switch (node.color) {
      case 'green':
        className = 'green'
        break
      case 'pink':
        className = 'pink'
        break
      case 'yellow':
        className = 'yellow'
        break
      case 'blue':
        className = 'blue'
        break
      case 'purple':
        className = 'purple'
        break
      case 'red':
        className = 'red'
        break
      case 'khaki':
        className = 'khaki'
        break
      case 'orange':
        className = 'orange'
        break
      default:
        className = 'default'
        break
    }

    if (classNameExternalAddon.length > 0) {
      className += ` ${classNameExternalAddon}`
    }

    return className
  }

  // inherited
  render(): JSX.Element {
    let mission: Mission = this.props.mission
    let missionAjaxStatus: EAjaxStatus = this.props.missionAjaxStatus
    let visibleNodes: Array<MissionNode> = this.state.visibleNodes
    let navigationIsActive: boolean = this.state.navigationIsActive
    let mapScale: number = this.state.mapScale
    let map: HTMLDivElement | null = this.map.current
    let mapStyling: React.CSSProperties = {}
    let mapNavigationStyling: React.CSSProperties = {}
    let mapActionPanelStyling: React.CSSProperties = {}
    let mapPromptStyling: React.CSSProperties = {}
    let mapPointerStyling: React.CSSProperties = {}
    let mapHelpStyling: React.CSSProperties = {}
    let mapFieldEntryStyling: React.CSSProperties = {}
    let mapPointerViewBox: string = ''
    let mapClassName: string = 'MissionMap'

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapOffsetX = this.state.mapOffsetX
      let mapOffsetY = this.state.mapOffsetY

      mapStyling.backgroundPosition = `calc(50% + ${
        mapOffsetX * mapScale
      }px) calc(50% + ${mapOffsetY * mapScale}px)`
      mapStyling.backgroundSize = `${mapXScale * mapScale}px ${
        mapYScale * mapScale
      }px`
      mapNavigationStyling.marginBottom = `-${mapBounds.height}px`
      mapHelpStyling.marginBottom = mapNavigationStyling.marginBottom
      mapFieldEntryStyling.marginBottom = mapNavigationStyling.marginBottom
      mapFieldEntryStyling.paddingTop = `${mapBounds.height / 2 - 225}px`
      // mapPointerStyling.top = `${mapBounds.y + pageScrollY}px`
      // mapPointerStyling.left = `${mapBounds.x}px`
      mapPointerStyling.bottom = `${mapBounds.height}px`
      mapPointerStyling.width = `${mapBounds.width}px`
      mapPointerStyling.height = `${mapBounds.height}px`
      mapPointerViewBox = `0 0 ${mapBounds.width} ${mapBounds.height}`
      // mapActionPanelStyling.left = `${mapBounds.x}px`
      mapActionPanelStyling.top = `${mapBounds.height - 62}px`
      mapPromptStyling.top = `${mapBounds.top + 25}px`
      mapPromptStyling.right = `calc(100vw - ${mapBounds.right - 25}px)`
    }
    if (navigationIsActive) {
      mapClassName += ' active-navigation'
    }

    return (
      <div
        className={mapClassName}
        ref={this.map}
        onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
          event.preventDefault()
        }}
        // -- MAP PANNING --
        onMouseMove={this.handleMapMouseMovement}
        // -- MAP ZOOM --
        onWheel={this.handleMapZoom}
        style={mapStyling}
      >
        {
          // -- MAP NAVIGATION / MOVEMENT --
        }
        <div
          className='navigation'
          style={mapNavigationStyling}
          onDragStart={(event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault()
          }}
          onMouseDown={() => {
            this.setState({ navigationIsActive: true })
          }}
          onMouseUp={() => {
            this.setState({ navigationIsActive: false })
          }}
          onMouseLeave={() => {
            this.setState({ navigationIsActive: false })
          }}
          onContextMenu={(event: React.MouseEvent) => {
            event.preventDefault()
          }}
        ></div>
        {
          // -- HELP -- //
        }
        {this.renderHelp(mapHelpStyling)}
        {
          // -- MAP ACTION PANEL --
        }
        {this.renderMapActionPanel(mapActionPanelStyling)}
        {
          // -- MAPPED NODES --
        }
        <List<MissionNode>
          items={visibleNodes}
          itemsPerPage={null}
          getItemDisplay={(node: MissionNode) => {
            let fontSize: number = mapItemFontSize * mapScale
            let height: number = (mapYScale - gridPaddingY * 2) * mapScale
            let scoreWidth: number = 25 * mapScale
            let lineHeight: number = height * 0.34

            // Dynamic Class Names
            let loadingClassName: string = 'loading'
            let iconClassName: string = ''

            // Logic to handle if the loading bar is displayed or not.
            if (!node.executing) {
              loadingClassName += ' hide'
            }

            // Logic to handle nodes that are executable and nodes that
            // are devices.
            if (node.device && node.executable) {
              iconClassName = 'device'
            } else if (node.executable && !node.device) {
              iconClassName = 'executable'
            }

            return (
              <>
                <div
                  className={loadingClassName}
                  style={{
                    height: `${height}px`,
                  }}
                ></div>
                <div
                  className='wrapper'
                  style={{
                    height: `${height - 5}px`,
                  }}
                >
                  <div
                    className='title'
                    style={{
                      width: `calc(100% - ${scoreWidth}px)`,
                      fontSize: `${fontSize}px`,
                      lineHeight: `${lineHeight}px`,
                    }}
                  >
                    {node.name}
                  </div>
                  <div className={iconClassName}></div>
                </div>
              </>
            )
          }}
          searchableProperties={['nodeID']}
          availableProperties={[
            {
              id: 'final-node',
              emoji: '🏆',
              description:
                'This node is a final node. If this node or any one final node is completed, the mission is completed for the student.',
            },
          ]}
          noItemsDisplay={null}
          handleSelection={this.props.handleNodeSelection}
          renderTooltipDescription={this.props.renderNodeTooltipDescription}
          ajaxStatus={missionAjaxStatus}
          listSpecificItemClassName={'mapped-node'}
          applyClassNameAddon={this.applyMappedNodeClassName}
          applyElementID={(node: MissionNode) => `mapped-node_${node.nodeID}`}
          // -- NODE POSITIONING --
          applyStyling={(node: MissionNode) => {
            let styling: React.CSSProperties = {}
            let map: HTMLDivElement | null = this.map.current
            if (map) {
              let mapScale: number = this.state.mapScale
              let mapBounds: DOMRect = map.getBoundingClientRect()
              let mapOffsetX: number = this.state.mapOffsetX
              let mapOffsetY: number = this.state.mapOffsetY
              let offsetX: number = mapOffsetX
              let offsetY: number = mapOffsetY
              let nodeX: number | null = node.mapX
              let nodeY: number | null = node.mapY
              let x: number = offsetX
              let y: number = offsetY
              if (nodeX !== null && nodeY !== null) {
                x += nodeX * mapXScale
                y += nodeY * mapYScale
              }
              let styling_top: number = y
              let styling_left: number = x
              let styling_width: number = mapXScale - gridPaddingX * 2
              let styling_height: number = mapYScale - gridPaddingY * 2
              let styling_fontSize: number = mapItemFontSize
              let styling_lineHeight: number = mapItemFontSize
              // let styling_paddingVertical: number =
              //   (styling_height - mapItemFontSize) / 2
              // let styling_paddingHorizontal: number = 12.5
              let styling_marginTop: number = -styling_height
              styling_top *= mapScale
              styling_left *= mapScale
              styling_width *= mapScale
              styling_height *= mapScale
              styling_fontSize *= mapScale
              styling_lineHeight *= mapScale
              // styling_paddingVertical *= mapScale
              // styling_paddingHorizontal *= mapScale
              styling_marginTop *= mapScale
              styling_top += mapBounds.height / 2
              styling_top -= styling_height / 2
              styling.top = `${styling_top}px`
              styling.left = `${styling_left}px`
              styling.width = `${styling_width}px`
              styling.height = `${styling_height}px`
              styling.fontSize = `${styling_fontSize}px`
              styling.lineHeight = `${styling_lineHeight}px`
              // styling.padding = `${styling_paddingVertical}px ${styling_paddingHorizontal}px`
              styling.padding = '0'
              styling.marginBottom = `${styling_marginTop}px`
            }
            return styling
          }}
          headingText={mission.name}
          alwaysUseBlanks={false}
        />

        {
          // -- POINTERS -- //
        }
        <svg
          className='pointers'
          style={mapPointerStyling}
          viewBox={mapPointerViewBox}
        >
          <defs>
            <marker
              id={`pointer-end`}
              markerWidth='7'
              markerHeight='7'
              refX='3.5'
              refY='3.5'
              orient='auto'
            >
              <polygon points='0 0, 7 3.5, 0 7, 3.5 3.5' />
            </marker>
            <marker
              id={`pointer-start`}
              markerWidth='8'
              markerHeight='8'
              refX='4'
              refY='4'
              orient='auto'
            >
              <circle cx={4} cy={4} r={1.75} />
            </marker>
          </defs>
          {this.renderPointers()}
        </svg>
      </div>
    )
  }
}
