// -- script-imports --

import React from 'react'
import { IObjectiveGenric } from '../../modules/objective'

/* -- style-imports -- */

import List, { IListItemProperty } from '../layout/List'
import strings from '../../modules/toolbox/strings'
import { AjaxStatus } from '../control/AjaxStatusDisplay'
import { Action, EActionPurpose } from './Action'
import { ActionPanel } from '../scenes/Scene'
import { Role } from '../../modules/user'
import MoreInformation from './MoreInformation'

/* -- interfaces -- */

interface IMissionMap<TObjective> {
  objectives: TObjective[]
  objectivesAjaxStatus: AjaxStatus
  handleObjectiveSelection: (objective: TObjective) => void
  handleMapEditRequest: (() => void) | null
  applyMappedObjectiveClassName: (objective: TObjective) => string
  renderMappedObjectiveTooltipDescription: (objective: TObjective) => string
}

interface IMissionMap_S<TObjective> {
  unmappedObjectives: TObjective[]
  mappedObjectives: TObjective[]
  relationships: IObjectiveRelationship<TObjective>[]
  prerequisiteCache: TObjective[]
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
// objectives
interface IObjectiveRelationship<TObjective> {
  prerequisite: TObjective
  unlocks: TObjective
}

/* -- constants -- */

const defaultMapScale: number = 0.75
const maxMapScale: number = 2.0
const minMapScale: number = 0.25
const mapXScale: number = 300.0 /*px*/
const mapYScale: number = 75.0 /*px*/
const gridPadding: number = 20.0 /*px*/
const mapItemFontSize: number = 15 /*px*/
const mapCuttoff: number = 1600 /*px*/

/* -- components -- */

export default class MissionMap<
  TObjective extends IObjectiveGenric,
> extends React.Component<IMissionMap<TObjective>, IMissionMap_S<TObjective>> {
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

  // returns whether this objective can
  // support another prerequisite objective,
  // or whether it's already at its max
  // capacity (5).
  static hasPrerequisiteSlot<TObjective extends IObjectiveGenric>(
    objective: TObjective,
  ): boolean {
    return (
      !objective.prerequisiteID ||
      !objective.prerequisiteID2 ||
      !objective.prerequisiteID3 ||
      !objective.prerequisiteID4 ||
      !objective.prerequisiteID5
    )
  }

  // returns whether the objective has the
  // prerequisite objective as a prerequisite
  static containsPrerequisite<TObjective extends IObjectiveGenric>(
    objective: TObjective,
    prerequisite: TObjective,
  ) {
    return (
      objective.prerequisiteID === prerequisite.objectiveID ||
      objective.prerequisiteID2 === prerequisite.objectiveID ||
      objective.prerequisiteID3 === prerequisite.objectiveID ||
      objective.prerequisiteID4 === prerequisite.objectiveID ||
      objective.prerequisiteID5 === prerequisite.objectiveID
    )
  }

  // returns whether the objective has the
  // prerequisite objective as a prerequisite
  static isPrerequisiteOfAnother<TObjective extends IObjectiveGenric>(
    objective: TObjective,
    mappedObjectives: TObjective[],
  ): boolean {
    for (let another of mappedObjectives) {
      if (
        objective.objectiveID !== another.objectiveID &&
        (objective.objectiveID === another.prerequisiteID ||
          objective.objectiveID === another.prerequisiteID2 ||
          objective.objectiveID === another.prerequisiteID3 ||
          objective.objectiveID === another.prerequisiteID4 ||
          objective.objectiveID === another.prerequisiteID5)
      ) {
        return true
      }
    }
    return false
  }

  // determines whether the two objectives are linked
  // together in one capacity or another
  static objectivesHaveRelationship<TObjective extends IObjectiveGenric>(
    objective1: TObjective,
    objective2: TObjective,
  ): boolean {
    if (objective1.objectiveID === objective2.objectiveID) {
      return true
    } else if (
      MissionMap.containsPrerequisite(objective1, objective2) ||
      MissionMap.containsPrerequisite(objective2, objective1)
    ) {
      return true
    } else {
      return false
    }
  }

  // takes an already mapped objective, and
  // renders its tooltip.
  static renderMappedObjectiveTooltipDescription_default = <
    TObjective extends IObjectiveGenric,
  >(
    objective: TObjective,
  ): string => {
    let objectiveTitle: string = objective.name
    let objectiveTypeInfo: string = ''
    let scoreInfo: string = ''
    let prompt: string = ''

    // Objective title constuction
    if (objective.isFinalObjective) {
      objectiveTitle += ' 🏆'
    } else if (objective.isBonusObjective) {
      objectiveTitle += ' 🎁'
    }

    // Objective type info construction
    if (objective.isFinalObjective) {
      objectiveTypeInfo = '🏆 *This is a final objective.*\n'
    } else if (objective.isBonusObjective) {
      objectiveTypeInfo = '🎁 *This is a bonus objective.*\n'
    }

    // Objective score info construction.
    if (objective.maxScore < 0) {
      scoreInfo = 'No points assigned.'
    } else {
      if (!objective.isBonusObjective) {
        scoreInfo = `\`↑${objective.maxScore} score\``
      } else {
        scoreInfo = `\`+${objective.maxScore} bonus points\``
      }
    }

    // Prompt construction.
    prompt = '##### View this objective.'

    return `#### ${objectiveTitle}\n${strings.limit(
      objective.description,
      160,
    )}\n${objectiveTypeInfo}${scoreInfo}\n${prompt}`
  }

  /* -- fields -- */

  map: React.RefObject<HTMLDivElement> = React.createRef()

  /* -- getters -- */

  // inherited
  get defaultState(): IMissionMap_S<TObjective> {
    return {
      unmappedObjectives: [],
      mappedObjectives: [],
      relationships: [],
      prerequisiteCache: [],
      navigationIsActive: false,
      mapOffsetX: 0,
      mapOffsetY: 0,
      mapScale: defaultMapScale,
    }
  }

  // inherited
  static defaultProps = {
    handleMapEditRequest: null,
    applyMappedObjectiveClassName: () => '',
    renderMappedObjectiveTooltipDescription:
      MissionMap.renderMappedObjectiveTooltipDescription_default,
  }

  /* -- initialize -- */

  constructor(props: IMissionMap<TObjective>) {
    super(props)

    this.state = {
      ...this.defaultState,
    }
  }

  // inherited
  componentDidMount(): void {
    window.addEventListener('wheel', this.preventMapZoomInterference, {
      passive: false,
    })
    this.sortObjectives()
  }

  // inherited
  componentWillUnmount(): void {
    window.removeEventListener('wheel', this.preventMapZoomInterference)
  }

  /* -- functions | state-purposed -- */

  // inherited
  componentDidUpdate(previousProps: IMissionMap<TObjective>): void {
    if (
      previousProps.objectives !== this.props.objectives ||
      previousProps.objectivesAjaxStatus !== this.props.objectivesAjaxStatus
    ) {
      this.sortObjectives()
    }
  }

  // returns whether this objective is linked with any
  // other mapped objectives in the state
  objectiveHasMappedRelationship(objective: TObjective): boolean {
    let relationships: IObjectiveRelationship<TObjective>[] =
      this.state.relationships
    for (let relationship of relationships) {
      if (
        `${relationship.prerequisite.objectiveID}` ===
          `${objective.objectiveID}` ||
        `${relationship.unlocks.objectiveID}` === `${objective.objectiveID}`
      ) {
        return true
      }
    }
    return false
  }

  // This sorts objectives into the
  // mapped and unmapped objectives.
  sortObjectives = (): void => {
    let objectives: TObjective[] = this.props.objectives
    let mappedObjectives: TObjective[] = []
    let unmappedObjectives: TObjective[] = []

    // sorts the already mapped objectives from the
    // mapped ones
    for (let objective of objectives) {
      if (objective.mapX !== null && objective.mapY !== null) {
        mappedObjectives.push(objective)
      } else {
        unmappedObjectives.push(objective)
      }
    }
    // parses out any objectives in duplicate locations
    // and places them back into the unmapped list
    let validLocationObjectives: Map<string, TObjective> = new Map<
      string,
      TObjective
    >()
    for (let objective of mappedObjectives) {
      let key: string = `${objective.mapX}_${objective.mapY}`
      if (!validLocationObjectives.has(key)) {
        validLocationObjectives.set(key, objective)
      } else {
        unmappedObjectives.push(objective)
      }
    }
    mappedObjectives = Array.from(validLocationObjectives.values())
    this.setState(
      {
        mappedObjectives,
        unmappedObjectives,
      },
      this.updateRelationships,
    )
  }

  // loops through all mapped objectives and
  // determines the relationships between
  // the objectives and their prerequisites.
  // updates the state with these values so
  // when rendering the pointers, these values
  // are at the ready.
  updateRelationships = (): void => {
    let mappedObjectives: TObjective[] = this.state.mappedObjectives
    let objectiveMap: Map<number, TObjective> = new Map<number, TObjective>()
    let relationships: IObjectiveRelationship<TObjective>[] = []
    let prerequisiteCache: TObjective[] = []
    let pushToPrerequisiteCache = (prerequisite: TObjective) => {
      if (!prerequisiteCache.includes(prerequisite)) {
        prerequisiteCache.push(prerequisite)
      }
    }
    for (let objective of mappedObjectives) {
      objectiveMap.set(objective.objectiveID, objective)
    }
    for (let objective of mappedObjectives) {
      if (objective.prerequisiteID) {
        let prerequisite: TObjective | undefined = objectiveMap.get(
          objective.prerequisiteID,
        )
        if (prerequisite) {
          relationships.push({
            prerequisite,
            unlocks: objective,
          })
          pushToPrerequisiteCache(prerequisite)
        }
      }
      if (objective.prerequisiteID2) {
        let prerequisite: TObjective | undefined = objectiveMap.get(
          objective.prerequisiteID2,
        )
        if (prerequisite) {
          relationships.push({
            prerequisite,
            unlocks: objective,
          })
          pushToPrerequisiteCache(prerequisite)
        }
      }
      if (objective.prerequisiteID3) {
        let prerequisite: TObjective | undefined = objectiveMap.get(
          objective.prerequisiteID3,
        )
        if (prerequisite) {
          relationships.push({
            prerequisite,
            unlocks: objective,
          })
          pushToPrerequisiteCache(prerequisite)
        }
      }
      if (objective.prerequisiteID4) {
        let prerequisite: TObjective | undefined = objectiveMap.get(
          objective.prerequisiteID4,
        )
        if (prerequisite) {
          relationships.push({
            prerequisite,
            unlocks: objective,
          })
          pushToPrerequisiteCache(prerequisite)
        }
      }
      if (objective.prerequisiteID5) {
        let prerequisite: TObjective | undefined = objectiveMap.get(
          objective.prerequisiteID5,
        )
        if (prerequisite) {
          relationships.push({
            prerequisite,
            unlocks: objective,
          })
          pushToPrerequisiteCache(prerequisite)
        }
      }
    }
    this.setState({ relationships, prerequisiteCache })
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

        mapOffsetX = Math.min(mapOffsetX, mapCuttoff)
        mapOffsetX = Math.max(mapOffsetX, -mapCuttoff)
        mapOffsetY = Math.min(mapOffsetY, mapCuttoff)
        mapOffsetY = Math.max(mapOffsetY, -mapCuttoff)

        this.setState((previousState: IMissionMap_S<TObjective>) => {
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
    if (!event.shiftKey) {
      return
    }

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
  // from one objective to another.
  renderPointer(
    relationship: IObjectiveRelationship<TObjective>,
  ): JSX.Element | null {
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
        // the pointer needs to have its start
        // and end offset so that the pointer doesn't
        // intersect the objective and prerequisite elements.
        // if the objective is above the prerequisite, the
        // start of the pointer needs to be below the
        // objective element and above the prerequisite
        // element so it doesn't pass through and collide
        // with either element.
        if (y1 > y2) {
          y1 -= (mapYScale / 2) * mapScale
          y2 += (mapYScale / 2) * mapScale - 0.001
        } else if (y1 < y2) {
          y1 += (mapYScale / 2) * mapScale
          y2 -= (mapYScale / 2) * mapScale - 0.001
        }
        if (x1 > x2) {
          x1 -= (mapXScale / 2) * mapScale
          x2 += (mapXScale / 2) * mapScale - 0.001
        } else if (x1 < x2) {
          x1 += (mapXScale / 2) * mapScale
          x2 -= (mapXScale / 2) * mapScale - 0.001
        }
        if (Math.abs(x1 - x2) < 1 && Math.abs(y1 - y2) > 1) {
          if (x1 > x2) {
            x2 -= (mapXScale / 3) * mapScale
          } else if (x1 < x2) {
            x2 += (mapXScale / 3) * mapScale
          }
        } else if (Math.abs(y1 - y2) < 1 && Math.abs(x1 - x2) > 1) {
          if (y1 > y2) {
            y2 -= (mapYScale / 3) * mapScale
          } else if (y1 < y2) {
            y2 += (mapYScale / 3) * mapScale
          }
        }
        let key = `unlocks-${relationship.unlocks.objectiveID}_prereq-${relationship.prerequisite.objectiveID}`
        let strokeWidth: number = 3 * mapScale
        let includeOrigin = Math.abs(x1 - x2) > 1 || Math.abs(y1 - y2) > 1

        return (
          <g key={key}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth={strokeWidth}
              markerStart={includeOrigin ? `url(#pointer-start)` : undefined}
              markerEnd={`url(#pointer-end)`}
            />
          </g>
        )
      }
    }
    return null
  }

  // renders all the pointers that mark the
  // progression of the objectives in the mission.
  renderPointers(): Array<JSX.Element | null> {
    let pointers: Array<JSX.Element | null> = []
    let map: HTMLDivElement | null = this.map.current
    let relationships: IObjectiveRelationship<TObjective>[] =
      this.state.relationships
    if (map) {
      // loops through each relationship between
      // objective and prerequisite and renders
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
    let handleMapEditRequest: (() => void) | null =
      this.props.handleMapEditRequest
    let actionsUniqueClassName: string = 'map-actions'

    let availableActions = {
      zoomIn: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.ZoomIn,
        handleClick: this.handleZoomInRequest,
        limitedRoles: [Role.Student, Role.Instructor, Role.Admin],
        tooltipDescription:
          'Zoom in. \n*[Shift + Scroll] on the map will also zoom in and out.*',
      }),
      zoomOut: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.ZoomOut,
        handleClick: this.handleZoomOutRequest,
        limitedRoles: [Role.Student, Role.Instructor, Role.Admin],
        tooltipDescription:
          'Zoom out. \n*[Shift + Scroll] on the map will also zoom in and out.*',
      }),
      map: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Map,
        handleClick: handleMapEditRequest ? handleMapEditRequest : () => {},
        tooltipDescription:
          'Map the order of objectives throughout the mission.',
      }),
      blank: (key: string) =>
        new Action({
          ...Action.defaultProps,
          purpose: EActionPurpose.Blank,
          handleClick: () => {},
          key,
        }),
    }
    let activeActions: Action[] = []

    activeActions.push(availableActions.zoomIn)
    activeActions.push(availableActions.zoomOut)

    if (handleMapEditRequest !== null) {
      activeActions.push(availableActions.map)
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
            '##### mission-map\n' +
            'This map is a layout of the objectives in the mission and ' +
            'their order of progression. Arrows indicate ' +
            'the order objectives should be completed, with divergent arrows ' +
            'indicating a branch in the mission, with a choice of a path to go down.\n' +
            '##### controls:\n\n' +
            '`Click+Drag` *Pan.*\n' +
            '`Shift+Scroll` *Zoom in/out.*\n'
          }
        />
      </div>
    )
  }

  // applys an addon class name to the objective
  // passed from the mapped objective list.
  applyMappedObjectiveClassName = (objective: TObjective) => {
    let className: string = ''

    // This applies custom styling
    // to objectives without scores
    // assigned.
    if (objective.maxScore < 0) {
      className += ' scoreless'
    }

    // This applies custom styling
    // to objectives that are final
    // objectives.
    if (objective.isFinalObjective) {
      className += ' final'
    }

    // This applies custom styling
    // to objectives that are bonus
    // objectives.
    if (objective.isBonusObjective) {
      className += ' bonus'
    }

    let classNameExternalAddon: string =
      this.props.applyMappedObjectiveClassName(objective)

    if (classNameExternalAddon.length > 0) {
      className += ` ${classNameExternalAddon}`
    }

    return className
  }

  // inherited
  render(): JSX.Element {
    let mappedObjectives: TObjective[] = this.state.mappedObjectives
    let objectivesAjaxStatus: AjaxStatus = this.props.objectivesAjaxStatus
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
      mapActionPanelStyling.top = `${mapBounds.height - 65}px`
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
          // -- MAPPED OBJECTIVES --
        }
        <List<TObjective>
          items={mappedObjectives}
          actions={[]}
          itemsPerPage={null}
          getItemDisplay={(objective: TObjective) => {
            let fontSize: number = mapItemFontSize * mapScale
            let height: number = (mapYScale - gridPadding * 2) * mapScale
            let scoreWidth: number = 40 * mapScale
            let lineHeight: number = height
            return (
              <div
                className='wrapper'
                style={{
                  height: `${height}px`,
                }}
              >
                <div
                  className='score'
                  style={{
                    width: `${scoreWidth}px`,
                    height: `${height}px`,
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {`${objective.isBonusObjective ? '+' : '↑'}${
                    objective.maxScore
                  }`}
                </div>
                <div
                  className='title'
                  style={{
                    width: `calc(100% - ${scoreWidth}px)`,
                    height: `${height}px`,
                    fontSize: `${fontSize}px`,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {`${
                    objective.isFinalObjective
                      ? '🏆 '
                      : objective.isBonusObjective
                      ? '🎁 '
                      : ''
                  }${objective.name}`}
                </div>
              </div>
            )
          }}
          searchableProperties={['name']}
          availableProperties={[
            {
              id: 'final-objective',
              emoji: '🏆',
              description:
                'This objective is a final objective. If this objective or any one final objective is completed, the mission is completed for the student.',
            },
          ]}
          noItemsDisplay={null}
          handleSelection={this.props.handleObjectiveSelection}
          renderTooltipDescription={
            this.props.renderMappedObjectiveTooltipDescription
          }
          ajaxStatus={objectivesAjaxStatus}
          listSpecificItemClassName={'mapped-objective'}
          applyClassNameAddon={this.applyMappedObjectiveClassName}
          itemHasProperty={(
            objective: TObjective,
            property: IListItemProperty,
          ) => {
            if (property.id === 'final-objective') {
              return objective.isFinalObjective
            }
            return false
          }}
          applyElementID={(objective: TObjective) =>
            `mapped-objective_${objective.objectiveID}`
          }
          // -- OBJECTIVE POSITIONING --
          applyStyling={(objective: TObjective) => {
            let styling: React.CSSProperties = {}
            let map: HTMLDivElement | null = this.map.current
            if (map) {
              let mapScale: number = this.state.mapScale
              let mapBounds: DOMRect = map.getBoundingClientRect()
              let mapOffsetX: number = this.state.mapOffsetX
              let mapOffsetY: number = this.state.mapOffsetY
              let offsetX: number = mapOffsetX
              let offsetY: number = mapOffsetY
              let objectiveX: number | null = objective.mapX
              let objectiveY: number | null = objective.mapY
              let x: number = offsetX
              let y: number = offsetY
              if (objectiveX !== null && objectiveY !== null) {
                x += objectiveX * mapXScale
                y += objectiveY * mapYScale
              }
              let styling_top: number = y
              let styling_left: number = x
              let styling_width: number = mapXScale - gridPadding * 2
              let styling_height: number = mapYScale - gridPadding * 2
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
          headingText={'map'}
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
              markerWidth='8'
              markerHeight='8'
              refX='4'
              refY='4'
              orient='auto'
            >
              <polygon points='0 0, 8 4, 0 8, 4 4' />
            </marker>
            <marker
              id={`pointer-start`}
              markerWidth='10'
              markerHeight='10'
              refX='5'
              refY='5'
              orient='auto'
            >
              <circle cx={5} cy={5} r={1.5} />
            </marker>
          </defs>
          {this.renderPointers()}
        </svg>
      </div>
    )
  }
}
