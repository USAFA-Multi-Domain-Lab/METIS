/* -- imports -- */

import './MissionMap.scss'
import React from 'react'
import List from '../general-layout/List'
import StringToolbox from '../../../../../shared/toolbox/strings'
import { EAjaxStatus } from '../../../../../shared/toolbox/ajax'
import MoreInformation from '../communication/MoreInformation'
import {
  ButtonSVG,
  EButtonSVGPurpose,
  IButtonSVG,
} from '../user-controls/ButtonSVG'
import { ButtonSVGPanel } from '../user-controls/ButtonSVGPanel'
import { SingleTypeObject } from '../../../../../shared/toolbox/objects'
import ClientMission from 'src/missions'
import ClientMissionNode, { ENodeTargetRelation } from 'src/missions/nodes'
import NodeCreator from 'src/missions/nodes/creator'
import ClientActionExecution from 'src/missions/actions/executions'
import memoize from 'memoize-one'
import { Vector2D } from '../../../../../shared/toolbox/space'

// represents a relationship between two
// nodes
class MissionNodeRelationship {
  prerequisite: IMissionMappable
  unlocks: IMissionMappable

  constructor(prerequisite: IMissionMappable, unlocks: IMissionMappable) {
    this.prerequisite = prerequisite
    this.unlocks = unlocks
  }
}

/* -- components -- */

export default class MissionMap extends React.Component<
  TMissionMap,
  TMissionMap_S
> {
  /* -- properties -- */

  /**
   * Ref for the root mission map element.
   */
  private rootRef: React.RefObject<HTMLDivElement> = React.createRef()

  /**
   * The default state for the component.
   */
  public get defaultState(): TMissionMap_S {
    let mission: ClientMission = this.props.mission

    return {
      nodes: [],
      mainRelationships: [],
      nodeCreatorRelationships: [],
      lastStructureChangeKey: mission.structureChangeKey,
      lastExpandedNode: mission.lastOpenedNode,
      panningIsActive: false,
      mapOffsetX: MissionMap.BASE_GRID_PADDING_X / 2,
      mapOffsetY: MissionMap.BASE_MAP_Y_SCALE * 2,
      mapScale: MissionMap.DEFAULT_MAP_SCALE,
      nodeDepth: mission.depth,
    }
  }

  /**
   * Whether creation mode is active, and if nodes are
   * pending to be added by the user.
   */
  private get creationModeActive(): boolean {
    return this.props.mission.nodeCreationTarget !== null
  }

  /* -- initialize -- */

  public constructor(props: TMissionMap) {
    super(props)

    this.state = {
      ...this.defaultState,
    }
  }

  // Overridden
  public componentDidMount(): void {
    let mission: ClientMission = this.props.mission
    let map: HTMLDivElement | null = this.rootRef.current

    window.addEventListener('wheel', this.preventMapZoomInterference, {
      passive: false,
    })
    mission.addStructureListener(this.forceUpdate)

    if (map !== null) {
      new ResizeObserver(this.forceUpdate).observe(map)
    }

    this.updateAllRelationships()
  }

  // Overridden
  public componentWillUnmount(): void {
    let mission: ClientMission = this.props.mission

    window.removeEventListener('wheel', this.preventMapZoomInterference)
    mission.removeStructureListener(this.forceUpdate)
  }

  /* -- functions | memoized -- */

  /**
   * Applies view culling to nodes so that nodes that
   * are not visible are not rendered.
   * @param nodes The nodes to cull.
   * @param boundsX The x position of the map element bounds in the DOM.
   * @param boundsY The y position of the map element bounds in the DOM.
   * @param boundsWidth The width of the map element bounds in the DOM.
   * @param boundsHeight The height of the map element bounds in the DOM.
   * @param scale The scale of the map in the state.
   * @param offsetX The offset x of the map in the state.
   * @param offsetY The offset y of the map in the state.
   * @memoized
   */
  private cullNodes = memoize(
    (
      nodes: ClientMissionNode[],
      boundsX: number,
      boundsY: number,
      boundsWidth: number,
      boundsHeight: number,
      scale: number,
      offsetX: number,
      offsetY: number,
    ): ClientMissionNode[] => {
      // Gather details.
      let culledNodes: ClientMissionNode[] = []
      // The bounds of the map in cell units.
      let cellBounds: DOMRect = new DOMRect(
        (boundsX - offsetX) / MissionMap.BASE_MAP_X_SCALE,
        (boundsY - offsetY) / MissionMap.BASE_MAP_Y_SCALE,
        boundsWidth / MissionMap.BASE_MAP_X_SCALE / scale,
        boundsHeight / MissionMap.BASE_MAP_Y_SCALE / scale,
      )

      console.log(
        'cellBounds:',
        cellBounds.x,
        cellBounds.y,
        cellBounds.width,
        cellBounds.height,
      )

      console.log(
        'first-node:',
        this.props.mission.rootNode.childNodes[0].position.x,
        this.props.mission.rootNode.childNodes[0].position.y,
      )
      return nodes
    },
  )

  /* -- functions | state-purposed -- */

  // Overridden
  public componentDidUpdate(
    previousProps: TMissionMap,
    previousState: TMissionMap_S,
  ): void {
    if (
      previousProps.mission !== this.props.mission ||
      previousProps.missionAjaxStatus !== this.props.missionAjaxStatus ||
      this.state.lastStructureChangeKey !==
        this.props.mission.structureChangeKey
    ) {
      this.updateAllRelationships()
      this.revealNewNodes()
      this.revealNewNodeCreators()
    }

    if (previousProps.mission !== this.props.mission) {
      previousProps.mission.removeStructureListener(this.forceUpdate)
      this.props.mission.addStructureListener(this.forceUpdate)
    }

    if (this.state.nodeDepth < this.props.mission.depth) {
      this.setState({ nodeDepth: this.props.mission.depth }, () => {
        this.revealNewNodes()
      })
    }
  }

  // Overridden
  // This is done to use forceUpdate easily in callbacks.
  public forceUpdate = () => super.forceUpdate()

  // This will pan the offset to a new
  // value gradually.
  panSmoothly = (targetMapOffset: IMapCoordinates): void => {
    let currentMapOffset: IMapCoordinates = {
      x: this.state.mapOffsetX,
      y: this.state.mapOffsetY,
    }
    let differenceX: number = targetMapOffset.x - currentMapOffset.x
    let differenceY: number = targetMapOffset.y - currentMapOffset.y
    let deltaX: number = differenceX / 5
    let deltaY: number = differenceY / 5

    if (Math.abs(deltaX) < 4) {
      deltaX = differenceX
    }
    if (Math.abs(deltaY) < 4) {
      deltaY = differenceY
    }

    let updatedMapOffset: IMapCoordinates = {
      x: currentMapOffset.x + deltaX,
      y: currentMapOffset.y + deltaY,
    }

    this.setState(
      {
        mapOffsetX: updatedMapOffset.x,
        mapOffsetY: updatedMapOffset.y,
      },
      () => {
        if (
          targetMapOffset.x !== updatedMapOffset.x ||
          targetMapOffset.y !== updatedMapOffset.y
        ) {
          setTimeout(() => this.panSmoothly(targetMapOffset), 5)
        }
      },
    )
  }

  // returns whether this node is linked with any
  // other node in the state
  nodeHasMappedRelationship(node: ClientMissionNode): boolean {
    let relationships: MissionNodeRelationship[] = this.state.mainRelationships
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

  // This updates all relationships for
  // the mission.
  updateAllRelationships = (): void => {
    let mission: ClientMission = this.props.mission

    this.updateMainRelationships()
    this.updateNodeCreatorRelationships()
    this.setState({ lastStructureChangeKey: mission.structureChangeKey })
  }

  // loops through all mapped nodes and
  // determines the relationships between
  // the nodes and their prerequisites.
  // updates the state with these values so
  // when rendering the pointers, these values
  // are at the ready.
  updateMainRelationships = (
    parentNode: ClientMissionNode = this.props.mission.rootNode,
    visibleNodes: Array<ClientMissionNode> = [],
    relationships: Array<MissionNodeRelationship> = [],
  ): void => {
    let mission: ClientMission = this.props.mission
    let rootNode: ClientMissionNode = mission.rootNode
    let nodeCreationTarget: ClientMissionNode | null =
      mission.nodeCreationTarget

    let childNodes: Array<ClientMissionNode> = parentNode.childNodes

    for (let childNode of childNodes) {
      if (
        parentNode.nodeID !== rootNode.nodeID &&
        parentNode.nodeID !== nodeCreationTarget?.nodeID &&
        // parentNode.nodeID !== nodeCreationTarget?.parentNode?.nodeID &&
        childNode.nodeID !== nodeCreationTarget?.nodeID
      ) {
        let relationship: MissionNodeRelationship = new MissionNodeRelationship(
          parentNode,
          childNode,
        )
        relationships.push(relationship)
      }
      visibleNodes.push(childNode)

      this.updateMainRelationships(childNode, visibleNodes, relationships)
    }

    if (parentNode.nodeID === rootNode.nodeID) {
      this.setState({
        nodes: visibleNodes,
        mainRelationships: relationships,
      })
    }
  }

  // This loops through all node creators
  // in the mission, and creates relationships
  // between them and the appropriate nodes
  // in the mission.
  updateNodeCreatorRelationships = (): void => {
    let relationships: Array<MissionNodeRelationship> = []
    let mission: ClientMission = this.props.mission
    let rootNode: ClientMissionNode = mission.rootNode
    let nodeCreationTarget: ClientMissionNode | null =
      mission.nodeCreationTarget
    let nodeCreators: Array<NodeCreator> = mission.nodeCreators
    let previousSiblingOfTargetCreator: NodeCreator | undefined
    let followingSiblingOfTargetCreator: NodeCreator | undefined
    let parentOfTargetOnlyCreator: NodeCreator | undefined
    let betweenTargetAndChildrenCreator: NodeCreator | undefined

    if (nodeCreationTarget !== null) {
      for (let nodeCreator of nodeCreators) {
        switch (nodeCreator.creationTargetRelation) {
          case ENodeTargetRelation.PreviousSiblingOfTarget:
            previousSiblingOfTargetCreator = nodeCreator
            break
          case ENodeTargetRelation.FollowingSiblingOfTarget:
            followingSiblingOfTargetCreator = nodeCreator
            break
          case ENodeTargetRelation.ParentOfTargetOnly:
            parentOfTargetOnlyCreator = nodeCreator
            break
          case ENodeTargetRelation.BetweenTargetAndChildren:
            betweenTargetAndChildrenCreator = nodeCreator
            break
        }
      }

      if (
        previousSiblingOfTargetCreator &&
        followingSiblingOfTargetCreator &&
        parentOfTargetOnlyCreator &&
        betweenTargetAndChildrenCreator
      ) {
        if (
          nodeCreationTarget.parentNode &&
          nodeCreationTarget.parentNode.nodeID !== rootNode.nodeID
        ) {
          relationships.push(
            new MissionNodeRelationship(
              nodeCreationTarget.parentNode,
              parentOfTargetOnlyCreator,
            ),
          )
          relationships.push(
            new MissionNodeRelationship(
              nodeCreationTarget.parentNode,
              previousSiblingOfTargetCreator,
            ),
          )
          relationships.push(
            new MissionNodeRelationship(
              nodeCreationTarget.parentNode,
              followingSiblingOfTargetCreator,
            ),
          )
        }
        relationships.push(
          new MissionNodeRelationship(
            parentOfTargetOnlyCreator,
            nodeCreationTarget,
          ),
        )
        relationships.push(
          new MissionNodeRelationship(
            nodeCreationTarget,
            betweenTargetAndChildrenCreator,
          ),
        )
        for (let child of nodeCreationTarget.childNodes) {
          relationships.push(
            new MissionNodeRelationship(betweenTargetAndChildrenCreator, child),
          )
        }
      }
    }

    this.setState({
      nodeCreatorRelationships: relationships,
    })
  }

  // This will reveal new nodes that have
  // been just unlocked.
  revealNewNodes = (): void => {
    let mission: ClientMission = this.props.mission
    let map: HTMLDivElement | null = this.rootRef.current
    let mapScale: number = this.state.mapScale
    let mapOffsetX: number = this.state.mapOffsetX
    let mapOffsetY: number = this.state.mapOffsetY
    let mapXScale: number = MissionMap.BASE_MAP_X_SCALE
    let gridPaddingX: number = MissionMap.BASE_GRID_PADDING_X

    if (
      this.state.lastExpandedNode !== mission.lastOpenedNode &&
      mission.lastOpenedNode !== null &&
      map
    ) {
      let mapBounds: DOMRect = map.getBoundingClientRect()

      let mapWidthInNodes: number = mapBounds.width / mapScale / mapXScale
      let mapOffsetXInNodes: number = -1 * (mapOffsetX / mapXScale)
      let nodeDepthShown: number = mapWidthInNodes + mapOffsetXInNodes - 1
      let nodeDepthRevealed: number = mission.lastOpenedNode.depth + 1
      let correctionDifferenceInNodes: number =
        nodeDepthShown - nodeDepthRevealed
      let correctionDifference: number =
        correctionDifferenceInNodes * mapXScale - gridPaddingX / 2

      if (correctionDifference < 0) {
        mapOffsetX += correctionDifference
      }

      this.setState({ lastExpandedNode: mission.lastOpenedNode }, () =>
        this.panSmoothly({ x: mapOffsetX, y: mapOffsetY }),
      )
    }
  }

  // This will reveal new node creators
  // that have been newly generated in a
  // node.
  revealNewNodeCreators = (): void => {
    let mission: ClientMission = this.props.mission
    let map: HTMLDivElement | null = this.rootRef.current
    let mapScale: number = this.state.mapScale
    let mapOffsetX: number = this.state.mapOffsetX
    let mapOffsetY: number = this.state.mapOffsetY
    let mapXScale: number = MissionMap.BASE_MAP_X_SCALE
    let gridPaddingX: number = MissionMap.BASE_GRID_PADDING_X

    if (map) {
      let greatestNodeCreatorDepth: number = -1

      for (let nodeCreator of mission.nodeCreators) {
        if (greatestNodeCreatorDepth < nodeCreator.depth) {
          greatestNodeCreatorDepth = nodeCreator.depth
        }
      }

      let mapBounds: DOMRect = map.getBoundingClientRect()

      let mapWidthInNodes: number = mapBounds.width / mapScale / mapXScale
      let mapOffsetXInNodes: number = -1 * (mapOffsetX / mapXScale)
      let nodeDepthShown: number = mapWidthInNodes + mapOffsetXInNodes - 1
      let nodeDepthRevealed: number = greatestNodeCreatorDepth
      let correctionDifferenceInNodes: number =
        nodeDepthShown - nodeDepthRevealed
      let correctionDifference: number =
        correctionDifferenceInNodes * mapXScale - gridPaddingX / 2

      if (correctionDifference < 0) {
        mapOffsetX += correctionDifference
      }

      this.panSmoothly({ x: mapOffsetX, y: mapOffsetY })
    }
  }

  // This prevents map zoom interference from
  // document scrolling.
  preventMapZoomInterference = (event: WheelEvent): void => {
    let map: HTMLDivElement | null = this.rootRef.current
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
    let navigationIsActive: boolean = this.state.panningIsActive

    if (navigationIsActive) {
      let map: HTMLDivElement | null = this.rootRef.current

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

        this.setState((previousState: TMissionMap_S) => {
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

    let map: HTMLDivElement | null = this.rootRef.current

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let currentMapScale: number = this.state.mapScale
      let currentMapOffsetX: number = this.state.mapOffsetX
      let currentMapOffsetY: number = this.state.mapOffsetY
      let updatedMapOffsetX: number = currentMapOffsetX
      let updatedMapOffsetY: number = currentMapOffsetY
      let delta: number = event.deltaY ? event.deltaY : event.deltaX * 2.5
      let updatedMapScale: number = currentMapScale + delta * 0.001 * -1

      updatedMapScale = Math.min(
        Math.max(MissionMap.MIN_MAP_SCALE, updatedMapScale),
        MissionMap.MAX_MAP_SCALE,
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
    if (mapScale < MissionMap.DEFAULT_MAP_SCALE) {
      mapScale += 0.125
    } else {
      mapScale += 0.25
    }
    mapScale = Math.min(
      Math.max(MissionMap.MIN_MAP_SCALE, mapScale),
      MissionMap.MAX_MAP_SCALE,
    )
    this.setState({ mapScale })
  }

  // called when the zoom in button is clicked.
  handleZoomOutRequest = (): void => {
    let mapScale: number = this.state.mapScale
    if (mapScale > MissionMap.DEFAULT_MAP_SCALE) {
      mapScale -= 0.25
    } else {
      mapScale -= 0.125
    }
    mapScale = Math.min(
      Math.max(MissionMap.MIN_MAP_SCALE, mapScale),
      MissionMap.MAX_MAP_SCALE,
    )
    this.setState({ mapScale })
  }

  // This is called when a node is selected.
  handleNodeSelection = (newlySelectedNode: ClientMissionNode) => {
    let currentlySelectedNode: ClientMissionNode | null =
      this.props.selectedNode
    let allowCreationMode: boolean = this.props.allowCreationMode

    if (
      currentlySelectedNode === null ||
      currentlySelectedNode.nodeID !== newlySelectedNode.nodeID ||
      !allowCreationMode
    ) {
      if (
        currentlySelectedNode !== null &&
        currentlySelectedNode.nodeID !== newlySelectedNode.nodeID
      ) {
        this.deactivateNodeCreation()
      }
      this.props.handleNodeSelection(newlySelectedNode)
    }
  }

  // This is called when a node is requested to
  // be created.
  handleNodeCreationRequest = (nodeCreator: NodeCreator): void => {
    let node: ClientMissionNode = nodeCreator.create()
    this.props.handleNodeCreation(node)
  }

  // This is called to reveal the node creators
  // for the selectedNode.
  activateNodeCreation = (): void => {
    let mission: ClientMission = this.props.mission
    let selectedNode: ClientMissionNode | null = this.props.selectedNode

    mission.nodeCreationTarget = selectedNode
  }

  // This is called to hide the node creators
  // for the selectedNode.
  deactivateNodeCreation = (): void => {
    this.props.mission.nodeCreationTarget = null
  }

  /* -- functions | render -- */

  // renders the action panel for the map,
  // allowing the user to perform certain
  // actions on the map.
  renderMapActionPanel(styling: React.CSSProperties): JSX.Element | null {
    let mapScale: number = this.state.mapScale
    let handleMapEditRequest = this.props.handleMapEditRequest
    let handleMapSaveRequest = this.props.handleMapSaveRequest
    let handleNodePathExitRequest = this.props.handleNodePathExitRequest
    let allowCreationMode: boolean = this.props.allowCreationMode
    let creationModeActive: boolean = this.creationModeActive
    let grayOutEditButton: boolean = this.props.grayOutEditButton
    let grayOutSaveButton: boolean = this.props.grayOutSaveButton
    let grayOutExitNodePathButton: boolean =
      this.props.grayOutExitNodePathButton
    let actionsUniqueClassName: string = 'map-actions'

    let availableActions = {
      zoomIn: new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.ZoomIn,
        handleClick: this.handleZoomInRequest,
        tooltipDescription:
          'Zoom in. \n*[Scroll] on the map will also zoom in and out.*',
      }),
      zoomOut: new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.ZoomOut,
        handleClick: this.handleZoomOutRequest,
        tooltipDescription:
          'Zoom out. \n*[Scroll] on the map will also zoom in and out.*',
      }),
      // create: new ButtonSVG({
      //   ...ButtonSVG.defaultProps,
      //   purpose: EButtonSVGPurpose.Add,
      //   handleClick: () => {},
      //   tooltipDescription:
      //     'Enter creation mode. This will allow new nodes to be created.',
      //   disabled: grayOutCreateButton,
      // }),
      // create_exit: new ButtonSVG({
      //   ...ButtonSVG.defaultProps,
      //   purpose: EButtonSVGPurpose.Cancel,
      //   handleClick: () => {},
      //   tooltipDescription: 'Exit creation mode.',
      //   disabled: grayOutCreateButton,
      // }),
      edit: new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Reorder,
        handleClick: handleMapEditRequest ? handleMapEditRequest : () => {},
        tooltipDescription: 'Edit the structure and order of nodes.',
        disabled: grayOutEditButton,
      }),
      save: new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Save,
        handleClick: () => {
          if (handleMapSaveRequest) {
            handleMapSaveRequest()
          }
        },
        tooltipDescription: 'Save changes.',
        disabled: grayOutSaveButton,
      }),
      exitNodePath: new ButtonSVG({
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Cancel,
        handleClick: () => {
          if (handleNodePathExitRequest) {
            handleNodePathExitRequest()
          }
        },
        tooltipDescription: 'Exit the node path that has been highlighted.',
        disabled: grayOutExitNodePathButton,
      }),
    }
    let activeActions: ButtonSVG[] = []

    activeActions.push(availableActions.zoomIn, availableActions.zoomOut)

    // if (allowCreationMode) {
    //   if (!creationModeActive) {
    //     activeActions.push(availableActions.create)
    //   } else {
    //     activeActions.push(availableActions.create_exit)
    //   }
    // }

    if (handleMapEditRequest !== null) {
      activeActions.push(availableActions.edit)
    }

    if (handleMapSaveRequest !== null) {
      activeActions.push(availableActions.save)
    }

    // if (handleNodePathExitRequest !== null) {
    //   activeActions.push(availableActions.exitNodePath)
    // }

    if (mapScale === MissionMap.MAX_MAP_SCALE) {
      actionsUniqueClassName += ' map-is-zoomed-in'
    }

    if (mapScale === MissionMap.MIN_MAP_SCALE) {
      actionsUniqueClassName += ' map-is-zoomed-out'
    }

    if (activeActions.length > 0) {
      return (
        <ButtonSVGPanel
          buttons={activeActions}
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
            '`Scroll` *Zoom in/out.*\n'
          }
        />
      </div>
    )
  }

  // This will apply the styling to a node,
  // rendering it with the correct position
  // and scale on the map.
  applyNodeStyling = (node: IMissionMappable) => {
    let selectedNode: ClientMissionNode | null = this.props.selectedNode
    let styling: React.CSSProperties = {}
    let map: HTMLDivElement | null = this.rootRef.current

    if (map) {
      let mapScale: number = this.state.mapScale
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapXScale: number = MissionMap.BASE_MAP_X_SCALE
      let mapYScale: number = MissionMap.BASE_MAP_Y_SCALE
      let gridPaddingX: number = MissionMap.BASE_GRID_PADDING_X
      let gridPaddingY: number = MissionMap.BASE_GRID_PADDING_Y
      let mapOffsetX: number = this.state.mapOffsetX
      let mapOffsetY: number = this.state.mapOffsetY
      let offsetX: number = mapOffsetX
      let offsetY: number = mapOffsetY
      let nodeX: number = node.position.x
      let nodeY: number = node.position.y
      let x: number = offsetX
      let y: number = offsetY

      // This will position the node at the
      // correct coordinates.
      x += nodeX * mapXScale
      y += nodeY * mapYScale

      // This adjusts the x to center the node
      // in its cell.
      x += gridPaddingX

      // This adjusts the y to center the node
      // in its cell, unless its the selected
      // node. Then the node will take up the
      // full height of the cell instead.
      if (node.nodeID !== selectedNode?.nodeID) {
        y += gridPaddingY
      }

      let styling_top: number = y
      let styling_left: number = x
      let styling_width: number = mapXScale
      let styling_height: number = mapYScale

      // This will adjust the width of the
      // node to give it padding in its cell.
      styling_width -= gridPaddingX * 2

      // This will adjust the height of the
      // node to give it padding in its cell,
      // but only if its not the selected node.
      if (node.nodeID !== selectedNode?.nodeID) {
        styling_height -= gridPaddingY * 2
      }

      let styling_fontSize: number = MissionMap.MAP_ITEM_FONT_SIZE
      let styling_lineHeight: number = MissionMap.MAP_ITEM_FONT_SIZE
      let styling_marginTop: number = -styling_height

      styling_top *= mapScale
      styling_left *= mapScale
      styling_width *= mapScale
      styling_height *= mapScale
      styling_fontSize *= mapScale
      styling_lineHeight *= mapScale
      styling_marginTop *= mapScale

      styling.top = `${styling_top}px`
      styling.left = `${styling_left}px`
      styling.width = `${styling_width}px`
      styling.height = `${styling_height}px`
      styling.fontSize = `${styling_fontSize}px`
      styling.lineHeight = `${styling_lineHeight}px`
      styling.padding = '0'
      styling.marginBottom = `${styling_marginTop}px`
    }
    return styling
  }

  // This will create the display text for a node.
  renderNodeDisplay = (
    node: IMissionMappable,
    buttons: Array<IButtonSVG> = [],
  ): JSX.Element => {
    let selectedNode: ClientMissionNode | null = this.props.selectedNode
    let execution: ClientActionExecution | null = node.execution
    let mapScale: number = this.state.mapScale
    let titleFontSize: number = MissionMap.MAP_ITEM_FONT_SIZE * mapScale
    let mapXScale: number = MissionMap.BASE_MAP_X_SCALE
    let mapYScale: number = MissionMap.BASE_MAP_Y_SCALE
    let gridPaddingX: number = MissionMap.BASE_GRID_PADDING_X
    let gridPaddingY: number = MissionMap.BASE_GRID_PADDING_Y
    let width: number = (mapXScale - gridPaddingX * 2) * mapScale
    let wrapperHeight: number = (mapYScale - gridPaddingY * 2) * mapScale
    let progressBarHeight: number = wrapperHeight - 2
    let progressBarMarginLeft: number = 2
    let progressBarMarginBottom: number = -progressBarHeight
    let progressBarWidthOffset: number = -4
    let progressBarWidth: number | null = width + progressBarWidthOffset
    let titleWidthSubtrahend: number = width * 0.1
    let titleLineHeight: number = wrapperHeight * 0.34
    let buttonMarginTop = wrapperHeight * -0.175
    let buttonMarginSides = wrapperHeight * 0.05
    let buttonWidth: number = wrapperHeight * 0.575
    let buttonHeight: number = wrapperHeight * 0.575
    let buttonFontSize: number = titleFontSize * 2
    let buttonLineHeight: number = buttonHeight * 0.9
    let titleHeight: string = '100%'
    let iconHeight: string = '100%'

    // Dynamic Class Names
    let progressBarClassName: string = 'ProgressBar'
    let buttonUniqueClassName: string = ''

    // This will shift the title line
    // height if the node is selected.
    if (node.nodeID === selectedNode?.nodeID) {
      titleLineHeight *= 2
      wrapperHeight *= 1.595
      titleHeight = '50%'
      iconHeight = '50%'
    }

    // Logic to show icon if needed.
    if (node.device || node.executable) {
      titleWidthSubtrahend += width * 0.15
    }

    // If the node is currently being executed,
    // multipy the width by the completion percentage
    // of the execution.
    if (execution) {
      progressBarWidth *= execution.completionPercentage
    }

    // Determine styles.
    let progressBarStyle: React.CSSProperties = {
      marginLeft: `${progressBarMarginLeft}px`,
      marginBottom: `${progressBarMarginBottom}px`,
      height: `${progressBarHeight}px`,
      width: `${progressBarWidth}px`,
    }
    let buttonStyle: React.CSSProperties = {
      marginTop: ``,
      margin: `${buttonMarginTop}px ${buttonMarginSides}px 0`,
      width: `${buttonWidth}px`,
      height: `${buttonHeight}px`,
      fontSize: `${buttonFontSize}px`,
      lineHeight: `${buttonLineHeight}px`,
    }

    return (
      <>
        <div
          className={progressBarClassName}
          style={progressBarStyle}
          onClick={() => {}}
          ref={this.props.elementRef}
        ></div>
        <div
          className='wrapper'
          style={{
            height: `${wrapperHeight - 5}px`,
            border: `2px solid ${node.color}`,
          }}
        >
          <div
            className='title'
            style={{
              width: `calc(100% - ${titleWidthSubtrahend}px)`,
              fontSize: `${titleFontSize}px`,
              lineHeight: `${titleLineHeight}px`,
              height: `${titleHeight}`,
            }}
          >
            {node.name}
          </div>
          <div className={'Icon'} style={{ height: `${iconHeight}` }}></div>
          {buttons.map((button: IButtonSVG): JSX.Element | null => {
            return (
              <ButtonSVG
                {...button}
                style={{ ...button.style, ...buttonStyle }}
                uniqueClassName={`${button.uniqueClassName} ${buttonUniqueClassName}`}
                key={button.componentKey}
              />
            )
          })}
        </div>
      </>
    )
  }

  /**
   * Apply an addon class name to the node passed from the mapped node list.
   * @param node The node to apply the class name to.
   * @returns the class name to apply to the node.
   */
  private applyMappedNodeClassList = (node: ClientMissionNode): string => {
    // Gather information.
    let classList: string[] = []
    let selectedNode: ClientMissionNode | null = this.props.selectedNode

    // Apply device class name.
    if (node.device) {
      classList.push('Device')
    }

    // Apply executable class name.
    if (node.executable) {
      classList.push('Executable')
    }

    // Apply success/failure class name.
    if (node.executionState === 'successful') {
      classList.push('Succeeded')
    } else if (node.executionState === 'failed') {
      classList.push('Failed')
    }

    // Push class names returned from `applyNodeClassList`.
    classList.push(...this.props.applyNodeClassList(node))

    // If selected, push the 'Selected' class name.
    if (node.nodeID === selectedNode?.nodeID) {
      classList.push('Selected')
    }

    // If the node is pending open, push the 'PendingOpen' class name.
    if (node.pendingOpen) {
      classList.push('PendingOpen')
    }

    // If the node is pending execution initiation, push the 'PendingExecInit'
    // class name.
    if (node.pendingExecInit) {
      classList.push('PendingExecInit')
    }

    // If the node is currently being executed, push the 'Executing' class name.
    if (node.executing) {
      classList.push('Executing')
    }

    // Return class list joined.
    return classList.join(' ')
  }

  // This will constructor the buttons
  // available for a given node.
  constructNodeButtons(node: ClientMissionNode): Array<IButtonSVG> {
    let mission: ClientMission = this.props.mission
    let selectedNode: ClientMissionNode | null = this.props.selectedNode
    let allowCreationMode: boolean = this.props.allowCreationMode
    let grayOutDeselectNodeButton: boolean =
      this.props.grayOutDeselectNodeButton
    let grayOutAddNodeButton: boolean = this.props.grayOutAddNodeButton
    let grayOutDeleteNodeButton: boolean = this.props.grayOutDeleteNodeButton
    let creationModeActive: boolean = this.creationModeActive
    let handleNodeDeselection = this.props.handleNodeDeselection
    let handleNodeDeletionRequest = this.props.handleNodeDeletionRequest

    let availableNodeButtons: SingleTypeObject<IButtonSVG> = {
      deselect: {
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Cancel,
        componentKey: 'node-button-deselect',
        tooltipDescription: 'Deselect this node (Closes panel view also).',
        disabled: grayOutDeselectNodeButton,
        handleClick: () => {
          if (handleNodeDeselection !== null) {
            handleNodeDeselection()
          }
        },
      },
      add: {
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Add,
        componentKey: 'node-button-add',
        tooltipDescription: 'Create an adjacent node on the map.',
        disabled: grayOutAddNodeButton,
        handleClick: this.activateNodeCreation,
      },
      add_cancel: {
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Cancel,
        componentKey: 'node-button-add-cancel',
        tooltipDescription: 'Cancel node creation.',
        disabled: grayOutAddNodeButton,
        handleClick: this.deactivateNodeCreation,
      },
      remove: {
        ...ButtonSVG.defaultProps,
        purpose: EButtonSVGPurpose.Remove,
        componentKey: 'node-button-remove',
        tooltipDescription: 'Delete this node.',
        disabled: grayOutDeleteNodeButton,
        handleClick: () => {
          if (handleNodeDeletionRequest !== null) {
            handleNodeDeletionRequest(node)
          }
        },
      },
    }
    let activeNodeButtons: Array<IButtonSVG> = []

    // This will add all the appropriate
    // buttons to the active node buttons,
    // based on the current state of the map.
    if (node.nodeID === selectedNode?.nodeID) {
      if (handleNodeDeselection !== null && !creationModeActive) {
        activeNodeButtons.push(availableNodeButtons.deselect)
      }
      if (allowCreationMode) {
        if (!creationModeActive) {
          activeNodeButtons.push(availableNodeButtons.add)
        } else {
          activeNodeButtons.push(availableNodeButtons.add_cancel)
        }
      }
      if (handleNodeDeletionRequest !== null && !creationModeActive) {
        activeNodeButtons.push(availableNodeButtons.remove)
      }
    }

    return activeNodeButtons
  }

  // This renders the list of nodes in the
  // mission.
  renderNodes(): JSX.Element | null {
    let mission: ClientMission = this.props.mission
    let missionAjaxStatus: EAjaxStatus = this.props.missionAjaxStatus
    let { nodes, mapScale, mapOffsetX, mapOffsetY } = this.state
    let culledNodes: Array<ClientMissionNode> = nodes
    let map: HTMLDivElement | null = this.rootRef.current
    let listStyling: React.CSSProperties = {}

    // If map is found in the DOM.
    if (map) {
      // Get map bounds.
      let mapBounds: DOMRect = map.getBoundingClientRect()

      // Apply list margin styling.
      listStyling.marginBottom = `-${mapBounds.height}px`

      // Cull nodes.
      this.cullNodes(
        culledNodes,
        mapBounds.x,
        mapBounds.y,
        mapBounds.width,
        mapBounds.height,
        mapScale,
        mapOffsetX,
        mapOffsetY,
      )
    }

    // Apply list top styling.
    listStyling.top = `4.5px`

    return (
      <List<ClientMissionNode>
        items={culledNodes}
        itemsPerPage={null}
        renderItemDisplay={(node: ClientMissionNode) =>
          this.renderNodeDisplay(node, this.constructNodeButtons(node))
        }
        searchableProperties={['nodeID']}
        noItemsDisplay={null}
        handleSelection={this.handleNodeSelection}
        renderTooltipDescription={this.props.renderNodeTooltipDescription}
        ajaxStatus={missionAjaxStatus}
        listSpecificItemClassName={'mapped-node'}
        applyClassNameAddon={this.applyMappedNodeClassList}
        listStyling={listStyling}
        applyElementID={(node: IMissionMappable) =>
          `mapped-node_${node.nodeID}`
        }
        // -- NODE POSITIONING --
        applyItemStyling={this.applyNodeStyling}
        headingText={mission.name}
        alwaysUseBlanks={false}
      />
    )
  }

  // This renders the node creators list,
  // if node creation is active.
  renderNodeCreators(): JSX.Element | null {
    let mission: ClientMission = this.props.mission
    let missionAjaxStatus: EAjaxStatus = this.props.missionAjaxStatus
    let map: HTMLDivElement | null = this.rootRef.current
    let listStyling: React.CSSProperties = {}

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      listStyling.marginBottom = `-${mapBounds.height}px`
      listStyling.bottom = `15px`
    }

    if (mission.nodeCreationTarget !== null) {
      return (
        <List<NodeCreator>
          items={mission.nodeCreators}
          itemsPerPage={null}
          renderItemDisplay={this.renderNodeDisplay}
          searchableProperties={['nodeID']}
          noItemsDisplay={null}
          handleSelection={this.handleNodeCreationRequest}
          renderTooltipDescription={() => 'Create a node here.'}
          ajaxStatus={missionAjaxStatus}
          listSpecificItemClassName={'node-creator'}
          // applyClassNameAddon={}
          applyElementID={(node: IMissionMappable) =>
            `node-creator_${node.nodeID}`
          }
          listStyling={listStyling}
          // -- NODE POSITIONING --
          applyItemStyling={this.applyNodeStyling}
          headingText={mission.name}
          alwaysUseBlanks={false}
        />
      )
    } else {
      return null
    }
  }

  // renders a pointer that marks the progression
  // from one node to another.
  renderPointer(relationship: MissionNodeRelationship): JSX.Element | null {
    let map: HTMLDivElement | null = this.rootRef.current

    if (map) {
      let mapScale: number = this.state.mapScale
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapXScale: number = MissionMap.BASE_MAP_X_SCALE
      let mapYScale: number = MissionMap.BASE_MAP_Y_SCALE
      let gridPaddingX: number = MissionMap.BASE_GRID_PADDING_Y
      let mapOffsetX: number = this.state.mapOffsetX
      let mapOffsetY: number = this.state.mapOffsetY
      let prerequisiteX: number | null = relationship.prerequisite.position.x
      let prerequisiteY: number | null = relationship.prerequisite.position.y
      let unlocksX: number | null = relationship.unlocks.position.x
      let unlocksY: number | null = relationship.unlocks.position.y

      if (
        prerequisiteX !== null &&
        prerequisiteY !== null &&
        unlocksX !== null &&
        unlocksY !== null
      ) {
        // calculates the start and end coordinates
        // for the line element used as a pointer.
        let x0: number = mapOffsetX + mapXScale / 2
        let x1: number = mapOffsetX + mapXScale / 2
        let x2: number = mapOffsetX + mapXScale / 2

        let y0: number = mapOffsetY + mapYScale / 2
        let y1: number = mapOffsetY + mapYScale / 2
        let y2: number = mapOffsetY + mapYScale / 2

        x0 += prerequisiteX * mapXScale
        x1 += prerequisiteX * mapXScale
        x2 += unlocksX * mapXScale

        x0 *= mapScale
        x1 *= mapScale
        x2 *= mapScale

        y0 += prerequisiteY * mapYScale
        y1 += prerequisiteY * mapYScale
        y2 += unlocksY * mapYScale

        y0 *= mapScale
        y1 *= mapScale
        y2 *= mapScale

        x1 += (mapXScale / 2) * mapScale
        x2 -= (mapXScale / 2) * mapScale - 0.001
        x2 += gridPaddingX * mapScale
        // x2 += (gridPaddingX - pointerArrowOffset) * mapScale

        let key = `unlocks-${relationship.unlocks.nodeID}_prereq-${relationship.prerequisite.nodeID}`
        let startStrokeWidth: number = 4 * mapScale
        let verticalLineStrokeWidth: number = 4 * mapScale
        let endStrokeWidth: number = 4 * mapScale
        let includeOrigin = Math.abs(x1 - x2) > 1 || Math.abs(y1 - y2) > 1
        let includeVerticalLine: boolean = y1 != y2
        let numberOfChildren: number =
          relationship.prerequisite.childNodes.length

        if (numberOfChildren > 1) {
          endStrokeWidth = 5 * mapScale
          verticalLineStrokeWidth = 5 * mapScale
        } else if (numberOfChildren > 1 && mapScale < 0.28) {
          endStrokeWidth = 6 * mapScale
          startStrokeWidth = 3 * mapScale
        } else if (numberOfChildren === 1) {
          startStrokeWidth += 0.5
          endStrokeWidth += 0.5
        }

        return (
          <g key={key}>
            <line
              x1={x0}
              y1={y0}
              x2={x1 + 0.4}
              y2={y1}
              strokeWidth={startStrokeWidth}
              // markerStart={includeOrigin ? `url(#pointer-start)` : undefined}
            />
            {includeVerticalLine ? (
              <line
                x1={x1}
                y1={y1 - 0.5}
                x2={x1}
                y2={y2 + 1}
                strokeWidth={verticalLineStrokeWidth}
                markerStart={includeOrigin ? `url(#pointer-start)` : undefined}
              />
            ) : null}
            <line
              x1={x1}
              y1={y2}
              x2={x2}
              y2={y2}
              strokeWidth={endStrokeWidth}
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
  renderPointers(): JSX.Element | null {
    let mission: ClientMission = this.props.mission
    let pointers: Array<JSX.Element | null> = []
    let map: HTMLDivElement | null = this.rootRef.current
    let relationships: MissionNodeRelationship[] = [
      ...this.state.mainRelationships,
      ...this.state.nodeCreatorRelationships,
    ]
    let mapPointerStyling: React.CSSProperties = {}
    let mapPointerViewBox: string = ''

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()

      // loops through each relationship between
      // node and prerequisite and renders
      // an arrow/pointer for each one.
      for (let relationship of relationships) {
        pointers.push(this.renderPointer(relationship))
      }

      mapPointerStyling.width = `${mapBounds.width}px`
      mapPointerStyling.height = `${mapBounds.height}px`
      mapPointerViewBox = `0 0 ${mapBounds.width} ${mapBounds.height}`

      if (mission.nodeCreationTarget === null) {
        mapPointerStyling.bottom = `16px`
      } else {
        mapPointerStyling.bottom = `35px`
      }
    }

    return (
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
            {/* 
              The endpoint arrows
              <polygon points='0 0, 7 3.5, 0 7, 3.5 3.5' /> 
            */}
          </marker>
          <marker
            id={`pointer-start`}
            markerWidth='8'
            markerHeight='8'
            refX='4'
            refY='4'
            orient='auto'
          >
            {/*
              Junction points
              <circle cx={4} cy={4} r={1.75} /> 
             */}
          </marker>
        </defs>
        {pointers}
      </svg>
    )
  }

  // Overridden
  public render(): JSX.Element {
    let navigationIsActive: boolean = this.state.panningIsActive
    let creationModeActive: boolean = this.creationModeActive
    let mapScale: number = this.state.mapScale
    let map: HTMLDivElement | null = this.rootRef.current
    let mapStyling: React.CSSProperties = {}
    let mapNavigationStyling: React.CSSProperties = {}
    let mapActionPanelStyling: React.CSSProperties = {}
    let mapPromptStyling: React.CSSProperties = {}
    let mapHelpStyling: React.CSSProperties = {}
    let mapFieldEntryStyling: React.CSSProperties = {}
    let mapClassName: string = 'MissionMap'

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapXScale: number = MissionMap.BASE_MAP_X_SCALE
      let mapYScale: number = MissionMap.BASE_MAP_Y_SCALE
      let mapOffsetX = this.state.mapOffsetX
      let mapOffsetY = this.state.mapOffsetY

      mapStyling.backgroundPosition = `calc(${mapOffsetX * mapScale}px) calc(${
        mapOffsetY * mapScale
      }px)`
      mapStyling.backgroundSize = `${mapXScale * mapScale}px ${
        mapYScale * mapScale
      }px`
      mapNavigationStyling.marginBottom = `-${mapBounds.height}px`
      mapHelpStyling.marginBottom = mapNavigationStyling.marginBottom
      mapFieldEntryStyling.marginBottom = mapNavigationStyling.marginBottom
      mapFieldEntryStyling.paddingTop = `${mapBounds.height / 2 - 225}px`
      mapActionPanelStyling.top = `${mapBounds.height - 62}px`
      mapPromptStyling.top = `${mapBounds.top + 25}px`
      mapPromptStyling.right = `calc(100vw - ${mapBounds.right - 25}px)`
    }
    if (navigationIsActive) {
      mapClassName += ' active-navigation'
    }
    if (creationModeActive) {
      mapClassName += ' creation-mode'
    }

    return (
      <div
        className={mapClassName}
        ref={this.rootRef}
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
            this.setState({ panningIsActive: true })
          }}
          onMouseUp={() => {
            this.setState({ panningIsActive: false })
          }}
          onMouseLeave={() => {
            this.setState({ panningIsActive: false })
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
          // -- NODES --
        }
        {this.renderNodes()}
        {
          // -- NODE CREATORS --
        }
        {this.renderNodeCreators()}
        {
          // -- POINTERS -- //
        }
        {this.renderPointers()}
      </div>
    )
  }

  /**
   * The map scale set when the map is first rendered.
   */
  public static readonly DEFAULT_MAP_SCALE: number = 0.5

  /**
   * The maximum map scale permitted.
   */
  public static readonly MAX_MAP_SCALE: number = 2.0

  /**
   * The minimum map scale permitted.
   */
  public static readonly MIN_MAP_SCALE: number = 0.25

  /**
   * The width in pixels of a grid space on the map when the scale is 1.0.
   */
  public static readonly BASE_MAP_X_SCALE: number = 440.0 /*px*/

  /**
   * The height in pixels of a grid space on the map when the scale is 1.0.
   */
  public static readonly BASE_MAP_Y_SCALE: number = 110.0 /*px*/

  /**
   * The width in pixels of the padding on the left and right of a grid space on
   * the map when the scale is 1.0.
   */
  public static readonly BASE_GRID_PADDING_X: number = 100.0 /*px*/

  /**
   * The height in pixels of the padding on the top and bottom of a grid space on
   * the map when the scale is 1.0.
   */
  public static readonly BASE_GRID_PADDING_Y: number = 20.0 /*px*/

  /**
   * The height in pixels of the padding on the top and bottom of a grid space on the map when the scale is 1.0 and a node is selected.
   */
  public static readonly SELECTED_NODE_PADDING_Y: number = 40.0 /*px*/

  /**
   * The font size in pixels of the text on the map when the scale is 1.0.
   */
  public static readonly MAP_ITEM_FONT_SIZE: number = 20 /*px*/

  /* -- static -- */

  /**
   * @param clientX The value of clientX of the window.
   * @param clientY The value of clientY of the window.
   * @param mapBounds The bounds of the map element in the DOM.
   * @param mapUnscaledOffsetX The X offset due to panning before taking scale into account.
   * @param mapUnscaledOffsetY The Y offset due to panning before taking scale into account.
   * @param mapScale The scale of the map.
   * @returns The coordinates on the map where the cursor currently is, accounts for the mapScale and the offset from panning.
   */
  private static getMapCoordinates(
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
      x: (clientX - mapOffsetX - mapBounds.x) / mapScale,
      y: (clientY - mapOffsetY - mapBounds.y) / mapScale,
    }
    return mapCoordinates
  }

  /**
   * Renders the tooltip description for a mapped node.
   */
  private static renderMappedNodeTooltipDescription_default = (
    node: ClientMissionNode,
  ): string => {
    let nodeTitle: string = node.name
    let nodeTypeInfo: string = ''
    let scoreInfo: string = ''
    let prompt: string = ''

    // Prompt construction.
    prompt = '##### View this node.'

    return `#### ${nodeTitle}\n${StringToolbox.limit(
      node.name, // ! This should be description
      160,
    )}\n${nodeTypeInfo}${scoreInfo}\n${prompt}`
  }

  // Overridden
  public static defaultProps = {
    selectedNode: null,
    handleNodeCreation: () => {},
    handleNodeDeselection: null,
    handleNodeDeletionRequest: null,
    handleMapEditRequest: null,
    handleMapSaveRequest: null,
    handleNodePathExitRequest: null,
    allowCreationMode: false,
    grayOutEditButton: false,
    grayOutSaveButton: false,
    grayOutDeselectNodeButton: false,
    grayOutExitNodePathButton: false,
    grayOutAddNodeButton: false,
    grayOutDeleteNodeButton: false,
    elementRef: React.createRef(),
    applyNodeClassList: () => '',
    renderNodeTooltipDescription:
      MissionMap.renderMappedNodeTooltipDescription_default,
  }
}

/* -- types -- */

/**
 * Props for `MissionMap`.
 */
export type TMissionMap = {
  mission: ClientMission
  missionAjaxStatus: EAjaxStatus
  selectedNode: ClientMissionNode | null
  handleNodeSelection: (node: ClientMissionNode) => void
  handleNodeCreation: (node: ClientMissionNode) => void
  handleNodeDeselection: (() => void) | null
  handleNodeDeletionRequest: ((node: ClientMissionNode) => void) | null
  handleMapEditRequest: (() => void) | null
  handleMapSaveRequest: (() => void) | null
  handleNodePathExitRequest: (() => void) | null
  allowCreationMode: boolean
  grayOutEditButton: boolean
  grayOutSaveButton: boolean
  grayOutDeselectNodeButton: boolean
  grayOutExitNodePathButton: boolean
  grayOutAddNodeButton: boolean
  grayOutDeleteNodeButton: boolean
  elementRef: React.RefObject<HTMLDivElement>
  applyNodeClassList: (node: ClientMissionNode) => string[]
  renderNodeTooltipDescription: (node: ClientMissionNode) => string
}

/**
 * State for `MissionMap`.
 */
export type TMissionMap_S = {
  /**
   * The nodes found in the mission passed in props.
   */
  nodes: Array<ClientMissionNode>
  /**
   * Relationships between nodes in the mission.
   */
  mainRelationships: Array<MissionNodeRelationship>
  /**
   * Relationships between node creators and nodes in the mission.
   */
  nodeCreatorRelationships: Array<MissionNodeRelationship>
  /**
   * The key of the last structure change in the mission. Used to
   * track when the structure of the mission has changed, triggering
   * a recalculation of the relationships between nodes.
   */
  lastStructureChangeKey: string
  /**
   * The last node that was expanded by the user.
   */
  lastExpandedNode: ClientMissionNode | null
  /**
   * Whether or not the map is currently being panned.
   */
  panningIsActive: boolean
  /**
   * The X offset due to panning.
   */
  mapOffsetX: number
  /**
   * The Y offset due to panning.
   */
  mapOffsetY: number
  /**
   * The scale of the map due to zooming in and out by the user.
   */
  mapScale: number
  /**
   * The depth of the nodes being rendered.
   */
  nodeDepth: number
}

export interface IMissionMappable {
  nodeID: string
  name: string
  position: Vector2D
  depth: number
  execution: ClientActionExecution | null
  executing: boolean
  executable: boolean
  device: boolean
  color: string
  isOpen: boolean
  pendingOpen: boolean
  pendingExecInit: boolean
  childNodes: Array<ClientMissionNode>
}

// represents a location on the mission map
interface IMapCoordinates {
  x: number
  y: number
}
