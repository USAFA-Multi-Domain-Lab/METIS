// -- imports --

import './MissionMap.scss'
import React from 'react'
import List from '../general-layout/List'
import strings from '../../../modules/toolbox/strings'
import { EAjaxStatus } from '../../../modules/toolbox/ajax'
import MoreInformation from '../communication/MoreInformation'
import { Mission } from '../../../modules/missions'
import {
  ENodeTargetRelation,
  MissionNode,
  MissionNodeCreator,
} from '../../../modules/mission-nodes'
import {
  ButtonSVG,
  EButtonSVGPurpose,
  IButtonSVG,
} from '../user-controls/ButtonSVG'
import { ButtonSVGPanel } from '../user-controls/ButtonSVGPanel'
import { SingleTypeObject } from '../../../modules/toolbox/objects'

/* -- interfaces -- */

interface IMissionMap {
  mission: Mission
  missionAjaxStatus: EAjaxStatus
  selectedNode: MissionNode | null
  loadingWidth?: number
  handleNodeSelection: (node: MissionNode) => void
  handleNodeCreation: (node: MissionNode) => void
  handleNodeDeselection: (() => void) | null
  handleNodeDeletionRequest: ((node: MissionNode) => void) | null
  handleMapEditRequest: (() => void) | null
  handleMapSaveRequest: (() => void) | null
  allowCreationMode: boolean
  grayOutEditButton: boolean
  grayOutSaveButton: boolean
  grayOutDeselectNodeButton: boolean
  grayOutAddNodeButton: boolean
  grayOutDeleteNodeButton: boolean
  elementRef: React.RefObject<HTMLDivElement>
  applyNodeClassName: (node: MissionNode) => string
  renderNodeTooltipDescription: (node: MissionNode) => string
}

interface IMissionMap_S {
  visibleNodes: Array<MissionNode>
  mainRelationships: Array<MissionNodeRelationship>
  nodeCreatorRelationships: Array<MissionNodeRelationship>
  lastStructureChangeKey: string
  lastExpandedNode: MissionNode | null
  navigationIsActive: boolean
  mapOffsetX: number
  mapOffsetY: number
  mapScale: number
  nodeDepth: number
}

export interface IMissionMappable {
  nodeID: string
  name: string
  mapX: number
  mapY: number
  depth: number
  executing: boolean
  executable: boolean
  device: boolean
}

// represents a location on the mission map
interface IMapCoordinates {
  x: number
  y: number
}

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

/* -- constants -- */

const defaultMapScale: number = 0.5
const maxMapScale: number = 2.0
const minMapScale: number = 0.25
const baseMapXScale: number = 440.0 /*px*/
const baseMapYScale: number = 110.0 /*px*/
const baseGridPaddingX: number = 100.0 /*px*/
const baseGridPaddingY: number = 20.0 /*px*/
const selectedNodePaddingY: number = 40.0 /*px*/
const pointerOriginOffset: number = 20 /*px*/
const pointerArrowOffset: number = 30 /*px*/
const mapItemFontSize: number = 20 /*px*/
// const mapCuttoff: number = 1600 /*px*/

/* -- components -- */

export default class MissionMap extends React.Component<
  IMissionMap,
  IMissionMap_S
> {
  /* -- static -- */

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
      x: (clientX - mapOffsetX - mapBounds.x) / mapScale,
      y: (clientY - mapOffsetY - mapBounds.y) / mapScale,
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

  // inherited
  static defaultProps = {
    selectedNode: null,
    handleNodeCreation: () => {},
    handleNodeDeselection: null,
    handleNodeDeletionRequest: null,
    handleMapEditRequest: null,
    handleMapSaveRequest: null,
    allowCreationMode: false,
    grayOutEditButton: false,
    grayOutSaveButton: false,
    grayOutDeselectNodeButton: false,
    grayOutAddNodeButton: false,
    grayOutDeleteNodeButton: false,
    elementRef: React.createRef(),
    applyMappedNodeClassName: () => '',
    renderMappedNodeTooltipDescription:
      MissionMap.renderMappedNodeTooltipDescription_default,
  }

  /* -- fields -- */

  map: React.RefObject<HTMLDivElement> = React.createRef()

  /* -- getters -- */

  // inherited
  get defaultState(): IMissionMap_S {
    let mission: Mission = this.props.mission

    return {
      visibleNodes: [],
      mainRelationships: [],
      nodeCreatorRelationships: [],
      lastStructureChangeKey: mission.structureChangeKey,
      lastExpandedNode: mission.lastOpenedNode,
      navigationIsActive: false,
      mapOffsetX: baseGridPaddingX / 2,
      mapOffsetY: baseMapYScale * 2,
      mapScale: defaultMapScale,
      nodeDepth: mission.depth,
    }
  }

  // This is the map x scale after considering
  // the current state.
  get currentMapXScale(): number {
    let currentMapXScale: number = baseMapXScale

    return currentMapXScale
  }

  // This is the map y scale after considering
  // the current state.
  get currentMapYScale(): number {
    let currentMapYScale: number = baseMapYScale

    return currentMapYScale
  }

  // This is the grid padding after considering
  // the current state.
  get currentGridPaddingX(): number {
    let currentGridPaddingX: number = baseGridPaddingX

    return currentGridPaddingX
  }

  // This is the grid padding after considering
  // the current state.
  get currentGridPaddingY(): number {
    let currentGridPaddingY: number = baseGridPaddingY

    return currentGridPaddingY
  }

  // This is whether creation mode is active,
  // and if nodes are pending to be added by
  // the user.
  get creationModeActive(): boolean {
    return this.props.mission.nodeCreationTarget !== null
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

    this.updateAllRelationships()
  }

  // inherited
  componentWillUnmount(): void {
    let mission: Mission = this.props.mission

    window.removeEventListener('wheel', this.preventMapZoomInterference)
    mission.removeStructureChangeHandler(this.forceUpdate)
  }

  /* -- functions | state-purposed -- */

  // inherited
  componentDidUpdate(
    previousProps: IMissionMap,
    previousState: IMissionMap_S,
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
      previousProps.mission.removeStructureChangeHandler(this.forceUpdate)
      this.props.mission.addStructureChangeHandler(this.forceUpdate)
    }

    if (this.state.nodeDepth < this.props.mission.depth) {
      this.setState({ nodeDepth: this.props.mission.depth }, () => {
        this.revealNewNodes()
      })
    }
  }

  // inherited
  forceUpdate = () => super.forceUpdate()

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
  nodeHasMappedRelationship(node: MissionNode): boolean {
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
    let mission: Mission = this.props.mission

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
    parentNode: MissionNode = this.props.mission.rootNode,
    visibleNodes: Array<MissionNode> = [],
    relationships: Array<MissionNodeRelationship> = [],
  ): void => {
    let mission: Mission = this.props.mission
    let rootNode: MissionNode = mission.rootNode
    let nodeCreationTarget: MissionNode | null = mission.nodeCreationTarget

    let childNodes: Array<MissionNode> = parentNode.childNodes

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

      if (childNode.isOpen) {
        this.updateMainRelationships(childNode, visibleNodes, relationships)
      }
    }

    if (parentNode.nodeID === rootNode.nodeID) {
      this.setState({
        visibleNodes,
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
    let mission: Mission = this.props.mission
    let rootNode: MissionNode = mission.rootNode
    let nodeCreationTarget: MissionNode | null = mission.nodeCreationTarget
    let nodeCreators: Array<MissionNodeCreator> = mission.nodeCreators
    let previousSiblingOfTargetCreator: MissionNodeCreator | undefined
    let followingSiblingOfTargetCreator: MissionNodeCreator | undefined
    let parentOfTargetOnlyCreator: MissionNodeCreator | undefined
    let betweenTargetAndChildrenCreator: MissionNodeCreator | undefined

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
    let mission: Mission = this.props.mission
    let map: HTMLDivElement | null = this.map.current
    let mapScale: number = this.state.mapScale
    let mapOffsetX: number = this.state.mapOffsetX
    let mapOffsetY: number = this.state.mapOffsetY
    let mapXScale: number = this.currentMapXScale
    let gridPaddingX: number = this.currentGridPaddingX

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
    let mission: Mission = this.props.mission
    let map: HTMLDivElement | null = this.map.current
    let mapScale: number = this.state.mapScale
    let mapOffsetX: number = this.state.mapOffsetX
    let mapOffsetY: number = this.state.mapOffsetY
    let mapXScale: number = this.currentMapXScale
    let gridPaddingX: number = this.currentGridPaddingX

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

  // This is called when a node is selected.
  handleNodeSelection = (newlySelectedNode: MissionNode) => {
    let currentlySelectedNode: MissionNode | null = this.props.selectedNode
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
  handleNodeCreationRequest = (nodeCreator: MissionNodeCreator): void => {
    let node: MissionNode = nodeCreator.create()
    this.props.handleNodeCreation(node)
  }

  // This is called to reveal the node creators
  // for the selectedNode.
  activateNodeCreation = (): void => {
    let selectedNode: MissionNode | null = this.props.selectedNode

    if (selectedNode !== null) {
      selectedNode.generateNodeCreators()
    }
  }

  // This is called to hide the node creators
  // for the selectedNode.
  deactivateNodeCreation = (): void => {
    let selectedNode: MissionNode | null = this.props.selectedNode

    if (selectedNode !== null) {
      selectedNode.destroyNodeCreators()
    }
  }

  /* -- functions | render -- */

  // renders the action panel for the map,
  // allowing the user to perform certain
  // actions on the map.
  renderMapActionPanel(styling: React.CSSProperties): JSX.Element | null {
    let mapScale: number = this.state.mapScale
    let handleMapEditRequest = this.props.handleMapEditRequest
    let handleMapSaveRequest = this.props.handleMapSaveRequest
    let allowCreationMode: boolean = this.props.allowCreationMode
    let creationModeActive: boolean = this.creationModeActive
    let grayOutEditButton: boolean = this.props.grayOutEditButton
    let grayOutSaveButton: boolean = this.props.grayOutSaveButton
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

    if (mapScale === maxMapScale) {
      actionsUniqueClassName += ' map-is-zoomed-in'
    }

    if (mapScale === minMapScale) {
      actionsUniqueClassName += ' map-is-zoomed-out'
    }

    if (activeActions.length > 0) {
      return (
        <ButtonSVGPanel
          buttons={activeActions}
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
    let selectedNode: MissionNode | null = this.props.selectedNode
    let styling: React.CSSProperties = {}
    let map: HTMLDivElement | null = this.map.current

    if (map) {
      let mapScale: number = this.state.mapScale
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapXScale: number = this.currentMapXScale
      let mapYScale: number = this.currentMapYScale
      let gridPaddingX: number = this.currentGridPaddingX
      let gridPaddingY: number = this.currentGridPaddingY
      let mapOffsetX: number = this.state.mapOffsetX
      let mapOffsetY: number = this.state.mapOffsetY
      let offsetX: number = mapOffsetX
      let offsetY: number = mapOffsetY
      let nodeX: number = node.mapX
      let nodeY: number = node.mapY
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

      let styling_fontSize: number = mapItemFontSize
      let styling_lineHeight: number = mapItemFontSize
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
    let selectedNode: MissionNode | null = this.props.selectedNode
    let allowCreationMode: boolean = this.props.allowCreationMode
    let mapScale: number = this.state.mapScale
    let titleFontSize: number = mapItemFontSize * mapScale
    let mapXScale: number = this.currentMapXScale
    let mapYScale: number = this.currentMapYScale
    let gridPaddingX: number = this.currentGridPaddingX
    let gridPaddingY: number = this.currentGridPaddingY
    let width: number = (mapXScale - gridPaddingX * 2) * mapScale
    let height: number = (mapYScale - gridPaddingY * 2) * mapScale
    let loadingHeight: number = height - 4
    let loadingMarginBottom: number = -loadingHeight
    let loadingWidth: number | undefined = this.props.loadingWidth
    let titleWidthSubtrahend: number = width * 0.1
    let titleLineHeight: number = height * 0.34
    let buttonMarginTop = height * -0.175
    let buttonMarginSides = height * 0.05
    let buttonWidth: number = height * 0.575
    let buttonHeight: number = height * 0.575
    let buttonFontSize: number = titleFontSize * 2
    let buttonLineHeight: number = buttonHeight * 0.9
    let loadingStyle: React.CSSProperties = {
      marginBottom: `${loadingMarginBottom}px`,
      height: `${loadingHeight}px`,
      width: `${loadingWidth}%`,
    }
    let buttonStyle: React.CSSProperties = {
      marginTop: ``,
      margin: `${buttonMarginTop}px ${buttonMarginSides}px 0`,
      width: `${buttonWidth}px`,
      height: `${buttonHeight}px`,
      fontSize: `${buttonFontSize}px`,
      lineHeight: `${buttonLineHeight}px`,
    }

    // Dynamic Class Names
    let loadingClassName: string = 'loading'
    let iconClassName: string = ''
    let buttonUniqueClassName: string = ''

    // This will shift the title line
    // height if the node is selected.
    if (node.nodeID === selectedNode?.nodeID) {
      titleLineHeight *= 2
    }

    // Logic to handle if the loading bar is displayed or not.
    if (!node.executing) {
      loadingClassName += ' hide'
    }

    // Logic to handle nodes that are executable and nodes that
    // are devices.
    if (node.device && node.executable) {
      iconClassName = 'device'
      titleWidthSubtrahend += width * 0.15
    } else if (node.executable && !node.device) {
      iconClassName = 'executable'
      titleWidthSubtrahend += width * 0.15
    }

    return (
      <>
        <div
          className={loadingClassName}
          style={loadingStyle}
          onClick={() => {}}
          ref={this.props.elementRef}
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
              width: `calc(100% - ${titleWidthSubtrahend}px)`,
              fontSize: `${titleFontSize}px`,
              lineHeight: `${titleLineHeight}px`,
            }}
          >
            {node.name}
          </div>
          <div className={iconClassName}></div>
        </div>
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
      </>
    )
  }

  // applys an addon class name to the node
  // passed from the mapped node list.
  applyMappedNodeClassName = (node: MissionNode) => {
    let selectedNode: MissionNode | null = this.props.selectedNode

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
      case 'brown':
        className = 'brown'
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

    if (node.nodeID === selectedNode?.nodeID) {
      className += ' Selected'
    }

    return className
  }

  // This will constructor the buttons
  // available for a given node.
  constructNodeButtons(node: MissionNode): Array<IButtonSVG> {
    let mission: Mission = this.props.mission
    let selectedNode: MissionNode | null = this.props.selectedNode
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
    let mission: Mission = this.props.mission
    let missionAjaxStatus: EAjaxStatus = this.props.missionAjaxStatus
    let visibleNodes: Array<MissionNode> = this.state.visibleNodes
    let map: HTMLDivElement | null = this.map.current
    let listStyling: React.CSSProperties = {}

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      listStyling.marginBottom = `-${mapBounds.height}px`
      listStyling.top = `4.5px`
    }

    return (
      <List<MissionNode>
        items={visibleNodes}
        itemsPerPage={null}
        renderItemDisplay={(node: MissionNode) =>
          this.renderNodeDisplay(node, this.constructNodeButtons(node))
        }
        searchableProperties={['nodeID']}
        noItemsDisplay={null}
        handleSelection={this.handleNodeSelection}
        renderTooltipDescription={this.props.renderNodeTooltipDescription}
        ajaxStatus={missionAjaxStatus}
        listSpecificItemClassName={'mapped-node'}
        applyClassNameAddon={this.applyMappedNodeClassName}
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
    let mission: Mission = this.props.mission
    let missionAjaxStatus: EAjaxStatus = this.props.missionAjaxStatus
    let map: HTMLDivElement | null = this.map.current
    let listStyling: React.CSSProperties = {}

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      listStyling.marginBottom = `-${mapBounds.height}px`
      listStyling.bottom = `15px`
    }

    if (mission.nodeCreationTarget !== null) {
      return (
        <List<MissionNodeCreator>
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
    let map: HTMLDivElement | null = this.map.current

    if (map) {
      let mapScale: number = this.state.mapScale
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapXScale: number = this.currentMapXScale
      let mapYScale: number = this.currentMapYScale
      let gridPaddingX: number = this.currentGridPaddingX
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
        x1 -= (gridPaddingX - pointerOriginOffset) * mapScale
        x2 += (gridPaddingX - pointerArrowOffset) * mapScale

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
  renderPointers(): JSX.Element | null {
    let mission: Mission = this.props.mission
    let pointers: Array<JSX.Element | null> = []
    let map: HTMLDivElement | null = this.map.current
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
        {pointers}
      </svg>
    )
  }

  // inherited
  render(): JSX.Element {
    let navigationIsActive: boolean = this.state.navigationIsActive
    let creationModeActive: boolean = this.creationModeActive
    let mapScale: number = this.state.mapScale
    let map: HTMLDivElement | null = this.map.current
    let mapStyling: React.CSSProperties = {}
    let mapNavigationStyling: React.CSSProperties = {}
    let mapActionPanelStyling: React.CSSProperties = {}
    let mapPromptStyling: React.CSSProperties = {}
    let mapHelpStyling: React.CSSProperties = {}
    let mapFieldEntryStyling: React.CSSProperties = {}
    let mapClassName: string = 'MissionMap'

    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let mapXScale: number = this.currentMapXScale
      let mapYScale: number = this.currentMapYScale
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
}
