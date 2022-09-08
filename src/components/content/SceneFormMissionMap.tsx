// -- script-imports --

import React from 'react'
import SceneForm, { FormDetailNumber, FormDetailToggle } from './SceneForm'
import { ActionPanel } from '../Scene'
import objectiveModule, { IObjective } from '../../../modules/objective'

/* -- style-imports -- */

import { ICourse } from '../../../modules/course'
import { IMission, requestMissionMap } from '../../../modules/mission'
import LinkBack, { LinkBackStyle } from '../../layout/LinkBack'
import { AjaxStatus } from '../../control/AjaxStatusDisplay'
import List, { IListItemProperty } from '../../layout/List'
import strings from '../../../modules/toolbox/strings'
import Confirmation from '../../layout/Confirmation'
import { Action, EActionPurpose } from '../../layout/Action'
import Markdown, { MarkdownTheme } from '../../layout/Markdown'
import { AxiosError } from 'axios'

/* -- interfaces -- */

interface ISceneChildProps {
  courseTied: ICourse
  mission: IMission
}

interface IState {
  unmappedObjectives: IObjective[]
  mappedObjectives: IObjective[]
  relationships: IObjectiveRelationship[]
  prerequisiteCache: IObjective[]
  navigationIsActive: boolean
  cursorObjective: IObjective | null
  linkMode: boolean
  unlinkMode: boolean
  endMode: boolean
  scoreMode: boolean
  bufferedObjective: IObjective | null
  bufferedEntry: string | null
  bufferedIsBonus: boolean
  mapOffsetX: number
  mapOffsetY: number
  mapScale: number
  objectivesAjaxStatus: AjaxStatus
  changesMade: boolean
  confirmingExit: boolean
  submissionCallPending: boolean
}

// represents a location on the mission map
interface IMapCoordinates {
  x: number
  y: number
}

// represents a relationship between two
// objectives
interface IObjectiveRelationship {
  prerequisite: IObjective
  unlocks: IObjective
}

/* -- constants -- */

const defaultMapScale: number = 0.85
const mapXScale: number = 300.0 /*px*/
const mapYScale: number = 75.0 /*px*/
const gridPadding: number = 20.0 /*px*/
const mapItemFontSize: number = 15 /*px*/
const mapCuttoff: number = 1600 /*px*/
const scoreMax: number = 999 /*points*/

/* -- components -- */

export default class SceneFormMissionMap extends SceneForm<
  ISceneChildProps,
  IState
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

  // returns whether this objective can
  // support another prerequisite objective,
  // or whether it's already at its max
  // capacity (5).
  static hasPrerequisiteSlot(objective: IObjective): boolean {
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
  static containsPrerequisite(objective: IObjective, prerequisite: IObjective) {
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
  static isPrerequisiteOfAnother(
    objective: IObjective,
    mappedObjectives: IObjective[],
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
  static objectivesHaveRelationship(
    objective1: IObjective,
    objective2: IObjective,
  ): boolean {
    if (objective1.objectiveID === objective2.objectiveID) {
      return true
    } else if (
      SceneFormMissionMap.containsPrerequisite(objective1, objective2) ||
      SceneFormMissionMap.containsPrerequisite(objective2, objective1)
    ) {
      return true
    } else {
      return false
    }
  }

  /* -- fields -- */

  requiredPath = 'FormMissionMap'

  map: React.RefObject<HTMLDivElement> = React.createRef()

  /* -- getters -- */

  // inherited
  get defaultState(): IState {
    return {
      unmappedObjectives: [],
      mappedObjectives: [],
      relationships: [],
      prerequisiteCache: [],
      navigationIsActive: false,
      cursorObjective: null,
      linkMode: false,
      unlinkMode: false,
      endMode: false,
      scoreMode: false,
      bufferedObjective: null,
      bufferedEntry: null,
      bufferedIsBonus: false,
      mapOffsetX: 0,
      mapOffsetY: 0,
      mapScale: defaultMapScale,
      objectivesAjaxStatus: AjaxStatus.Inactive,
      changesMade: false,
      confirmingExit: false,
      submissionCallPending: false,
    }
  }

  // inherited
  get title(): string {
    let mission: IMission = this.sceneProps.mission
    return `map-mission | ${mission.name}`
  }

  // inherited
  get submitButtonText(): string {
    return 'save'
  }

  // inherited
  get submitButtonPendingText(): string {
    return 'saving...'
  }

  /* -- initialize -- */

  // inherited
  sceneDidMountOnPath(): void {
    let mission: IMission = this.sceneProps.mission
    document.addEventListener('keydown', this.handleKeyDown)
    this.setState({ objectivesAjaxStatus: AjaxStatus.Pending }, () => {
      objectiveModule.retrieveObjectivesFromMission(
        mission.missionID,
        (objectives: IObjective[]) => {
          let mappedObjectives: IObjective[] = []
          let unmappedObjectives: IObjective[] = []
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
          let validLocationObjectives: Map<string, IObjective> = new Map<
            string,
            IObjective
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
              objectivesAjaxStatus: AjaxStatus.Loaded,
            },
            this.updateRelationships,
          )
        },
        () => {
          this.setState({ objectivesAjaxStatus: AjaxStatus.Error })
        },
      )
    })
  }

  /* -- functions | state-purposed -- */

  // inherited
  sceneDidUpdateOnPath(): void {}

  // inherited
  canSubmit(): boolean {
    return this.state.changesMade
  }

  // inherited
  isSubmissionCallPending(): boolean {
    return this.state.submissionCallPending
  }

  // inherited
  handleSubmission = (): void => {
    let mission: IMission = this.sceneProps.mission
    let courseTied: ICourse = this.sceneProps.courseTied
    let objectives: IObjective[] = [
      ...this.state.unmappedObjectives,
      ...this.state.mappedObjectives,
    ]

    this.setState({ submissionCallPending: true }, () => {
      requestMissionMap(
        mission.missionID,
        objectives,
        () => {
          if (this.state.confirmingExit) {
            this.sceneProps.switchScene('ViewMission', { mission, courseTied })
          } else {
            this.setState({ changesMade: false, submissionCallPending: false })
          }
        },
        (error: AxiosError) =>
          this.setState({ submissionCallPending: false }, () =>
            this.sceneProps.handleError(error),
          ),
      )
    })
  }

  // returns whether this objective is linked with any
  // other mapped objectives in the state
  objectiveHasMappedRelationship(objective: IObjective): boolean {
    let relationships: IObjectiveRelationship[] = this.state.relationships
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

  // returns whether there is an objective that
  // has been selected in link mode to be linked
  isBufferedObjectiveToLink(): boolean {
    return this.state.linkMode && this.state.bufferedObjective !== null
  }

  // returns whether there is an objective that
  // has been selected in unlink mode to be
  // unlinked
  isBufferedObjectiveToUnlink(): boolean {
    return this.state.unlinkMode && this.state.bufferedObjective !== null
  }

  // handles an objective getting grabbed from
  // a drag event
  handleObjectiveGrab = (
    objective: IObjective,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    this.setState({
      cursorObjective: objective,
    })
  }

  // loops through all mapped objectives and
  // determines the relationships between
  // the objectives and their prerequisites.
  // updates the state with these values so
  // when rendering the pointers, these values
  // are at the ready.
  updateRelationships = (): void => {
    let mappedObjectives: IObjective[] = this.state.mappedObjectives
    let objectiveMap: Map<number, IObjective> = new Map<number, IObjective>()
    let relationships: IObjectiveRelationship[] = []
    let prerequisiteCache: IObjective[] = []
    let pushToPrerequisiteCache = (prerequisite: IObjective) => {
      if (!prerequisiteCache.includes(prerequisite)) {
        prerequisiteCache.push(prerequisite)
      }
    }
    for (let objective of mappedObjectives) {
      objectiveMap.set(objective.objectiveID, objective)
    }
    for (let objective of mappedObjectives) {
      if (objective.prerequisiteID) {
        let prerequisite: IObjective | undefined = objectiveMap.get(
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
        let prerequisite: IObjective | undefined = objectiveMap.get(
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
        let prerequisite: IObjective | undefined = objectiveMap.get(
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
        let prerequisite: IObjective | undefined = objectiveMap.get(
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
        let prerequisite: IObjective | undefined = objectiveMap.get(
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

  // places objective in the mapped objective list
  // if there is no other objective already there
  mapObjective = (objective: IObjective): void => {
    let unmappedObjectives: IObjective[] = []
    let mappedObjectives: IObjective[] = []
    for (let unmappedObjective of this.state.unmappedObjectives) {
      if (unmappedObjective.objectiveID !== objective.objectiveID) {
        unmappedObjectives.push(unmappedObjective)
      }
    }
    for (let mappedObjective of this.state.mappedObjectives) {
      if (mappedObjective.objectiveID !== objective.objectiveID) {
        mappedObjectives.push(mappedObjective)
      }
    }
    mappedObjectives.push(objective)
    this.setState(
      {
        unmappedObjectives,
        mappedObjectives,
        cursorObjective: null,
        changesMade: true,
      },
      () => this.forceUpdate(),
    )
  }

  // handles keyboard events for the scene
  handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isInitializedOnPath()) {
      document.removeEventListener('keydown', this.handleKeyDown)
    }
    let keyDown: string = event.key
    let scoreMode: boolean = this.state.scoreMode
    let bufferedObjective: IObjective | null = this.state.bufferedObjective

    if (keyDown === 'Enter') {
      if (scoreMode && bufferedObjective !== null) {
        this.handleFieldEntryApplyRequest()
        event.preventDefault()
      }
    } else if (
      keyDown === 'Escape' ||
      (keyDown === 'Backspace' && !document.querySelector(':focus'))
    ) {
      if (bufferedObjective) {
        this.setState({ bufferedObjective: null, bufferedEntry: null })
      } else {
        this.setState({
          linkMode: false,
          unlinkMode: false,
          endMode: false,
          scoreMode: false,
        })
      }
    }
  }

  // called when a dragged objective is first detected
  // as hovering above the map.
  handleObjectiveDraggedOver = (
    event: React.DragEvent<HTMLDivElement>,
  ): void => {
    let map: HTMLDivElement | null = event.target as HTMLDivElement
    let mappedObjectives: IObjective[] = this.state.mappedObjectives
    let cursorObjective: IObjective | null = this.state.cursorObjective
    if (
      cursorObjective &&
      map &&
      `${map.className}`.includes('map form-section')
    ) {
      for (let mappedObjective of mappedObjectives) {
        if (mappedObjective.objectiveID === cursorObjective?.objectiveID) {
          map.className = 'map form-section'
        }
      }
      map.className = 'map form-section pending-drop'
    }
  }

  // called when a dragged objective is no longer
  // detected as hovering above the map.
  handleObjectiveDraggedOut = (
    event: React.DragEvent<HTMLDivElement>,
  ): void => {
    let map: HTMLDivElement = event.target as HTMLDivElement
    if (map && `${map.className}`.includes('map form-section')) {
      map.className = 'map form-section'
    }
  }

  // handles the placement of objectives on the map
  handleObjectiveDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    let map: HTMLDivElement | null = this.map.current
    let mappedObjectives: IObjective[] = this.state.mappedObjectives
    let mapOffsetX: number = this.state.mapOffsetX
    let mapOffsetY: number = this.state.mapOffsetY
    let mapScale: number = this.state.mapScale
    if (map) {
      let cursorObjective: IObjective | null = this.state.cursorObjective
      let mapBounds = map.getBoundingClientRect()
      if (cursorObjective) {
        let coordinates: IMapCoordinates =
          SceneFormMissionMap.getMapCoordinates(
            event.clientX,
            event.clientY,
            mapBounds,
            mapOffsetX,
            mapOffsetY,
            mapScale,
          )
        let objectiveMapX = coordinates.x / mapXScale
        let objectiveMapY = coordinates.y / mapYScale
        objectiveMapX = Math.round(objectiveMapX)
        objectiveMapY = Math.round(objectiveMapY)
        for (let objective of mappedObjectives) {
          if (
            objective.mapX === objectiveMapX &&
            objective.mapY === objectiveMapY
          ) {
            return this.setState({
              cursorObjective: null,
            })
          }
        }
        cursorObjective.mapX = objectiveMapX
        cursorObjective.mapY = objectiveMapY
        this.mapObjective(cursorObjective)
      }
      map.className = 'map form-section'
    }
    event.preventDefault()
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
        this.setState((previousState: IState) => {
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
    let map: HTMLDivElement | null = this.map.current
    if (map) {
      let mapBounds: DOMRect = map.getBoundingClientRect()
      let currentMapScale: number = this.state.mapScale
      let currentMapOffsetX: number = this.state.mapOffsetX
      let currentMapOffsetY: number = this.state.mapOffsetY
      let updatedMapOffsetX: number = currentMapOffsetX
      let updatedMapOffsetY: number = currentMapOffsetY
      let updatedMapScale: number = currentMapScale + event.deltaY * 0.001
      updatedMapScale = Math.min(Math.max(0.25, updatedMapScale), 2.0)
      if (currentMapScale === updatedMapScale) {
        return
      }
      let currentCursorMapCoordinates: IMapCoordinates =
        SceneFormMissionMap.getMapCoordinates(
          event.clientX,
          event.clientY,
          mapBounds,
          currentMapOffsetX,
          currentMapOffsetY,
          currentMapScale,
        )
      let updatedCursorMapCoordinates: IMapCoordinates =
        SceneFormMissionMap.getMapCoordinates(
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

  // whenever the map is in link mode, or is
  // defining a relationship, and an objective is
  // clicked, this will handle the click and either
  // make this objective the start or end of the
  // objective linking.
  handleLinkModeRequest = (objective: IObjective): void => {
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    let changesMade: boolean = false
    if (!bufferedObjective) {
      this.setState({ bufferedObjective: objective })
    } else if (bufferedObjective.objectiveID !== objective.objectiveID) {
      if (
        // cancel if relationship already occurs
        SceneFormMissionMap.containsPrerequisite(
          objective,
          bufferedObjective,
        ) ||
        SceneFormMissionMap.containsPrerequisite(bufferedObjective, objective)
      ) {
        return
      }
      // finds a prerequisite slot to store the relationship
      if (!objective.prerequisiteID) {
        objective.prerequisiteID = bufferedObjective.objectiveID
        changesMade = true
      } else if (!objective.prerequisiteID2) {
        objective.prerequisiteID2 = bufferedObjective.objectiveID
        changesMade = true
      } else if (!objective.prerequisiteID3) {
        objective.prerequisiteID3 = bufferedObjective.objectiveID
        changesMade = true
      } else if (!objective.prerequisiteID4) {
        objective.prerequisiteID4 = bufferedObjective.objectiveID
        changesMade = true
      } else if (!objective.prerequisiteID5) {
        objective.prerequisiteID5 = bufferedObjective.objectiveID
        changesMade = true
      }
      // if the prerequisite is a final objective, it no longer is,
      // since the mission obviously will continue after it.
      if (changesMade && bufferedObjective.isFinalObjective) {
        bufferedObjective.isFinalObjective = false
      }
      this.setState(
        { bufferedObjective: null, changesMade },
        this.updateRelationships,
      )
    }
  }

  // whenever the map is in unlink mode, or is
  // undoing a relationship, and an objective is
  // clicked, this will handle the click and either
  // make this objective the start or end of the
  // objective unlinking.
  handleUnlinkModeRequest = (objective: IObjective): void => {
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    if (bufferedObjective) {
      let changesMade: boolean = false
      if (objective.prerequisiteID === bufferedObjective.objectiveID) {
        objective.prerequisiteID = null
        changesMade = true
      } else if (objective.prerequisiteID2 === bufferedObjective.objectiveID) {
        objective.prerequisiteID2 = null
        changesMade = true
      } else if (objective.prerequisiteID3 === bufferedObjective.objectiveID) {
        objective.prerequisiteID3 = null
        changesMade = true
      } else if (objective.prerequisiteID4 === bufferedObjective.objectiveID) {
        objective.prerequisiteID4 = null
        changesMade = true
      } else if (objective.prerequisiteID5 === bufferedObjective.objectiveID) {
        objective.prerequisiteID5 = null
        changesMade = true
      } else if (bufferedObjective.prerequisiteID === objective.objectiveID) {
        bufferedObjective.prerequisiteID = null
        changesMade = true
      } else if (bufferedObjective.prerequisiteID2 === objective.objectiveID) {
        bufferedObjective.prerequisiteID2 = null
        changesMade = true
      } else if (bufferedObjective.prerequisiteID3 === objective.objectiveID) {
        bufferedObjective.prerequisiteID3 = null
        changesMade = true
      } else if (bufferedObjective.prerequisiteID4 === objective.objectiveID) {
        bufferedObjective.prerequisiteID4 = null
        changesMade = true
      } else if (bufferedObjective.prerequisiteID5 === objective.objectiveID) {
        bufferedObjective.prerequisiteID5 = null
        changesMade = true
      }
      this.setState(
        { bufferedObjective: null, changesMade },
        this.updateRelationships,
      )
    } else {
      if (this.objectiveHasMappedRelationship(objective)) {
        this.setState({ bufferedObjective: objective })
      }
    }
  }

  // called when a mapped objective is clicked in
  // end mode. this will toggle an objective between
  // being a final objective and not being a final objective
  handleEndModeRequest = (objective: IObjective): void => {
    let mappedObjectives: IObjective[] = this.state.mappedObjectives
    if (
      !objective.isFinalObjective &&
      !objective.isBonusObjective &&
      !SceneFormMissionMap.isPrerequisiteOfAnother(objective, mappedObjectives)
    ) {
      objective.isFinalObjective = true
    } else {
      objective.isFinalObjective = false
    }
    this.setState({ changesMade: true })
  }

  // called when a mapped objective is clicked in
  // score mode
  handleScoreModeRequest = (objective: IObjective): void => {
    if (!this.state.bufferedObjective) {
      this.setState({
        bufferedObjective: objective,
        bufferedIsBonus: objective.isBonusObjective,
      })
    }
  }

  // This is called when the field entry is
  // requested to be closed/cancelled.
  handleFieldEntryCancelRequest = (): void => {
    this.setState({
      bufferedObjective: null,
      bufferedEntry: null,
      bufferedIsBonus: false,
    })
  }

  // This is called when the field entry is
  // requested to be applied/submitted.
  handleFieldEntryApplyRequest = (): void => {
    let scoreMode: boolean = this.state.scoreMode
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    let bufferedEntry: string | null = this.state.bufferedEntry
    let bufferedIsBonus: boolean = this.state.bufferedIsBonus

    if (scoreMode && bufferedObjective !== null && bufferedEntry !== null) {
      let score: number = parseInt(bufferedEntry)

      if (!isNaN(score)) {
        bufferedObjective.maxScore = score
      }

      bufferedObjective.isBonusObjective = bufferedIsBonus

      if (bufferedIsBonus) {
        bufferedObjective.isFinalObjective = false
      }

      this.setState({
        bufferedObjective: null,
        bufferedEntry: null,
        bufferedIsBonus: false,
        changesMade: true,
      })
    }
  }

  /* -- functions | render -- */

  // renders a pointer that marks the progression
  // from one objective to another.
  renderPointer(relationship: IObjectiveRelationship): JSX.Element | null {
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
    let cursorObjective: IObjective | null = this.state.cursorObjective
    let mappedObjectives: IObjective[] = this.state.mappedObjectives
    let relationships: IObjectiveRelationship[] = this.state.relationships
    let linkMode: boolean = this.state.linkMode
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    if (map) {
      // loops through each relationship between
      // objective and prerequisite and renders
      // an arrow/pointer for each one.
      for (let relationship of relationships) {
        let prerequisite: IObjective = relationship.prerequisite
        let unlocks: IObjective = relationship.unlocks
        // if one of the objectives is being moved by
        // the user then the relationship does not
        // need to be rendered.
        if (
          cursorObjective &&
          (cursorObjective.objectiveID === unlocks.objectiveID ||
            cursorObjective.objectiveID === prerequisite.objectiveID)
        ) {
          continue
        }
        pointers.push(this.renderPointer(relationship))
      }
      // when creating a relationship between an objective
      // and a prerequisite, an arrow needs to be drawn over
      // a hovered over objective between it and the already
      // selected prerequisite
      if (linkMode && bufferedObjective) {
        let hoveredObjective: HTMLDivElement | null = map.querySelector(
          '.mapped-objective:not(.disabled):hover',
        )
        if (hoveredObjective) {
          // grabs the objective id of the hovered over
          // objective from the dom element itself.
          let hoveredObjectiveElementID: string = hoveredObjective.id
          if (hoveredObjectiveElementID.includes('mapped-objective_')) {
            let prerequisite: IObjective = bufferedObjective
            let unlocks: IObjective | undefined
            let unlocksID: string = hoveredObjectiveElementID.replace(
              'mapped-objective_',
              '',
            )
            // determines the objective from the discovered
            // id
            for (let objective of mappedObjectives) {
              if (`${objective.objectiveID}` === unlocksID) {
                unlocks = objective
              }
            }
            if (unlocks) {
              pointers.push(this.renderPointer({ prerequisite, unlocks }))
            }
          }
        }
      }
    }
    return pointers
  }

  // renders the action panel for the map,
  // allowing the user to perform certain
  // actions on the map.
  renderMapActionPanel(styling: React.CSSProperties): JSX.Element | null {
    let linkMode: boolean = this.state.linkMode
    let unlinkMode: boolean = this.state.unlinkMode
    let endMode: boolean = this.state.endMode
    let scoreMode: boolean = this.state.scoreMode

    let availableActions = {
      link: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Link,
        handleClick: () => {
          this.setState({
            linkMode: true,
            unlinkMode: false,
            endMode: false,
            scoreMode: false,
          })
        },
        tooltipDescription:
          '### link-mode\nLink objectives together, making one objective the prerequisite to the other.',
      }),
      unlink: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Unlink,
        handleClick: () => {
          this.setState({
            linkMode: false,
            unlinkMode: true,
            endMode: false,
            scoreMode: false,
          })
        },
        tooltipDescription:
          '### unlink-mode\nUnlink objectives, making one objective no longer prerequisite to the other.',
      }),
      end: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Trophy,
        handleClick: () => {
          this.setState({
            linkMode: false,
            unlinkMode: false,
            endMode: true,
            scoreMode: false,
          })
        },
        tooltipDescription:
          '### end-mode\nSelect/Deselect the final objectives that, if any one of them is completed, will end the mission. For most missions, only one final objective should be needed.',
      }),
      score: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Score,
        handleClick: () => {
          this.setState({
            linkMode: false,
            unlinkMode: false,
            endMode: false,
            scoreMode: true,
          })
        },
        tooltipDescription:
          '### score-mode\nLayout the scoring for the student as they progress through the mission.',
      }),
      cancel: new Action({
        ...Action.defaultProps,
        purpose: EActionPurpose.Cancel,
        handleClick: () => {
          this.setState({
            linkMode: false,
            unlinkMode: false,
            endMode: false,
            scoreMode: false,
            bufferedObjective: null,
            bufferedEntry: null,
            bufferedIsBonus: false,
          })
        },
        tooltipDescription: linkMode
          ? 'Exit link mode.'
          : unlinkMode
          ? 'Exit unlink mode.'
          : 'Cancel.',
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
    if (linkMode) {
      activeActions.push(availableActions.cancel)
      activeActions.push(availableActions.blank('blank-1'))
      activeActions.push(availableActions.blank('blank-2'))
      activeActions.push(availableActions.blank('blank-3'))
    } else if (unlinkMode) {
      activeActions.push(availableActions.blank('blank-4'))
      activeActions.push(availableActions.cancel)
      activeActions.push(availableActions.blank('blank-5'))
      activeActions.push(availableActions.blank('blank-6'))
    } else if (endMode) {
      activeActions.push(availableActions.blank('blank-7'))
      activeActions.push(availableActions.blank('blank-8'))
      activeActions.push(availableActions.cancel)
      activeActions.push(availableActions.blank('blank-9'))
    } else if (scoreMode) {
      activeActions.push(availableActions.blank('blank-10'))
      activeActions.push(availableActions.blank('blank-11'))
      activeActions.push(availableActions.blank('blank-12'))
      activeActions.push(availableActions.cancel)
    } else {
      activeActions.push(availableActions.link)
      activeActions.push(availableActions.unlink)
      activeActions.push(availableActions.end)
      activeActions.push(availableActions.score)
    }
    return (
      <ActionPanel actions={activeActions} linkBack={null} styling={styling} />
    )
  }

  // render the prompt for the map, informing
  // the user of next steps in various processes
  renderMapPrompt(styling: React.CSSProperties): JSX.Element | null {
    let linkMode: boolean = this.state.linkMode
    let unlinkMode: boolean = this.state.unlinkMode
    let endMode: boolean = this.state.endMode
    let scoreMode: boolean = this.state.scoreMode
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    let promptMarkdown: string = ''
    let promptClassName: string = 'prompt'
    if (linkMode) {
      if (!bufferedObjective) {
        promptMarkdown =
          '#### link-mode\nSelect a first objective. This will be the prerequisite objective in the link.'
      } else {
        promptMarkdown =
          '#### link-mode\nSelect a second objective. This will be an objective that unlocks when the prerequisite is completed.'
      }
    } else if (unlinkMode) {
      if (!bufferedObjective) {
        promptMarkdown =
          '#### unlink-mode\nFind the link you want to break, and select either of the objectives in that link.'
      } else {
        promptMarkdown =
          '#### unlink-mode\nMultiple options. Select the second objective in the link.'
      }
    } else if (endMode) {
      promptMarkdown =
        '#### end-mode\nSelect an objective to be a final objective, or deselect an objective that already is a final objective.'
    } else if (scoreMode) {
      promptMarkdown =
        '#### score-mode\nAssign scores to all the objectives on the map. The score for the objective will be the score the student has overall for the mission once that objective is completed. Objective scoring is not cummalitive. Click an objective to begin.'
    }
    if (promptMarkdown.length === 0) {
      promptClassName += ' hidden'
    }
    return (
      <div className={promptClassName} style={styling}>
        <Markdown
          markdown={promptMarkdown}
          theme={MarkdownTheme.ThemePrimary}
        />
      </div>
    )
  }

  // renders a box for the user to give input
  renderMapFieldEntry(styling: React.CSSProperties): JSX.Element | null {
    let scoreMode: boolean = this.state.scoreMode
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    let bufferedIsBonus: boolean = this.state.bufferedIsBonus
    let scoreDetailLabel: string = ''
    let initialValue: string | undefined

    if (scoreMode && bufferedObjective) {
      if (bufferedObjective.maxScore >= 0) {
        initialValue = `${bufferedObjective.maxScore}`
      }

      if (bufferedIsBonus) {
        scoreDetailLabel = 'bonus-points'
      } else {
        scoreDetailLabel = 'score'
      }

      return (
        <div className='field-entry' style={styling}>
          <div className='wrapper'>
            <FormDetailNumber
              label={scoreDetailLabel}
              minimum={0}
              maximum={scoreMax}
              initialValue={initialValue}
              deliverValue={(entry: number | null) =>
                this.setState({
                  bufferedEntry: entry !== null ? `${entry}` : null,
                })
              }
              integersOnly={true}
              focusOnMount={true}
              selectOnFocus={true}
            />
            <FormDetailToggle
              label='bonus-objective'
              deliverValue={(bufferedIsBonus: boolean) =>
                this.setState({ bufferedIsBonus })
              }
              initialValue={bufferedObjective.isBonusObjective}
            />
            {/* <Action
              purpose={EActionPurpose.Cancel}
              handleClick={() => {
                this.setState({ bufferedObjective: null })
              }}
              tooltipDescription={'Cancel.'}
            /> */}
            <div
              className='button button-cancel'
              onClick={this.handleFieldEntryCancelRequest}
            >
              cancel
            </div>
            <div
              className='button button-apply'
              onClick={this.handleFieldEntryApplyRequest}
            >
              apply
            </div>
            <div className='enter-prompt'>Or hit enter...</div>
          </div>
        </div>
      )
    } else {
      return <div className='field-entry invisible' style={styling}></div>
    }
  }

  // applys an addon class name to the objective
  // passed from the mapped objective list.
  applyMappedObjectiveClassName = (objective: IObjective) => {
    let cursorObjective: IObjective | null = this.state.cursorObjective
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    let prerequisiteCache: IObjective[] = this.state.prerequisiteCache
    let linkMode: boolean = this.state.linkMode
    let unlinkMode: boolean = this.state.unlinkMode
    let endMode: boolean = this.state.endMode
    let hasPrerequisiteSlot: boolean =
      SceneFormMissionMap.hasPrerequisiteSlot(objective)
    let className: string = ''

    // This all determines if the
    // given objective should be
    // disabled, greyed out, and
    // not selectable.
    if (
      linkMode &&
      bufferedObjective !== null &&
      (!hasPrerequisiteSlot ||
        bufferedObjective.objectiveID === objective.objectiveID ||
        SceneFormMissionMap.containsPrerequisite(
          objective,
          bufferedObjective,
        ) ||
        SceneFormMissionMap.containsPrerequisite(bufferedObjective, objective))
    ) {
      className = 'disabled'
    } else if (unlinkMode) {
      if (bufferedObjective) {
        className =
          SceneFormMissionMap.objectivesHaveRelationship(
            objective,
            bufferedObjective,
          ) && objective.objectiveID !== bufferedObjective.objectiveID
            ? ''
            : 'disabled'
      } else {
        className = this.objectiveHasMappedRelationship(objective)
          ? ''
          : 'disabled'
      }
    } else if (endMode) {
      className =
        objective.isBonusObjective || prerequisiteCache.includes(objective)
          ? 'disabled'
          : ''
    }

    // If objective is being dragged
    // and dropped, then the objective
    // is set to transparent.
    if (objective === cursorObjective) {
      className = 'transparent'
    }

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

    return className
  }

  // takes an already mapped objective, and
  // renders its tooltip.
  renderMappedObjectiveTooltipDescription = (
    objective: IObjective,
    propertyTooltipDescription: string,
  ): string | null => {
    let linkMode: boolean = this.state.linkMode
    let unlinkMode: boolean = this.state.unlinkMode
    let endMode: boolean = this.state.endMode
    let scoreMode: boolean = this.state.scoreMode
    let bufferedObjective: IObjective | null = this.state.bufferedObjective
    let objectiveTitle: string = objective.name
    let objectiveTypeInfo: string = ''
    let scoreInfo: string = ''

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

    if (this.state.cursorObjective?.objectiveID === objective.objectiveID) {
      return null
    }
    if (linkMode && !bufferedObjective) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Make prerequisite.`
    } else if (linkMode && bufferedObjective) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Make unlocked objective.`
    } else if (unlinkMode && bufferedObjective) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Unlink objective from selected.`
    } else if (unlinkMode && !bufferedObjective) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Unlink objective from another.`
    } else if (endMode && !objective.isFinalObjective) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Select as final objective.`
    } else if (endMode && objective.isFinalObjective) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Deselect as final objective.`
    } else if (scoreMode) {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Assign score to objective.`
    } else {
      return `#### ${objectiveTitle}\n${strings.limit(
        objective.description,
        160,
      )}\n${objectiveTypeInfo}${scoreInfo}\n##### Move this objective.`
    }
  }

  // inherited
  renderLinkBack(): JSX.Element | null {
    let courseTied: ICourse = this.sceneProps.courseTied
    let mission: IMission = this.sceneProps.mission
    return (
      <LinkBack
        pathBack={'ViewMission'}
        scenePropsToPass={{ mission, courseTied }}
        linkStyle={LinkBackStyle.Back}
        prescript={(abort: () => void) => {
          if (this.state.changesMade) {
            this.setState({ confirmingExit: true })
            abort()
          }
        }}
      />
    )
  }

  // inherited
  renderExtras(): JSX.Element | null {
    let confirmingExit: boolean = this.state.confirmingExit
    let submissionCallPending: boolean = this.state.submissionCallPending
    let mission: IMission = this.sceneProps.mission
    let courseTied: ICourse = this.sceneProps.courseTied
    return (
      <div className='form-child-extras'>
        <Confirmation
          active={confirmingExit}
          ajaxStatus={
            submissionCallPending ? AjaxStatus.Pending : AjaxStatus.Inactive
          }
          handleConfirmation={() => {
            this.handleSubmission()
          }}
          handleCancelation={() => {
            this.setState({ confirmingExit: false })
          }}
          handleAlternative={() => {
            this.sceneProps.switchScene('ViewMission', {
              mission,
              courseTied,
            })
          }}
          confirmationMessage={
            'Would you like to save your changes before exiting?'
          }
          buttonConfirmText={'save-first'}
          buttonAlternateText={'discard-changes'}
        />
      </div>
    )
  }

  // inherited
  renderOnPath(): JSX.Element {
    let mission: IMission = this.sceneProps.mission
    let unmappedObjectives: IObjective[] = this.state.unmappedObjectives
    let mappedObjectives: IObjective[] = this.state.mappedObjectives
    let navigationIsActive: boolean = this.state.navigationIsActive
    let linkMode: boolean = this.state.linkMode
    let unlinkMode: boolean = this.state.unlinkMode
    let endMode: boolean = this.state.endMode
    let scoreMode: boolean = this.state.scoreMode
    let objectivesAjaxStatus: AjaxStatus = this.state.objectivesAjaxStatus
    let missionName: string = mission.name
    let mapScale: number = this.state.mapScale
    let map: HTMLDivElement | null = this.map.current
    let mapStyling: React.CSSProperties = {}
    let mapNavigationStyling: React.CSSProperties = {}
    let mapActionPanelStyling: React.CSSProperties = {}
    let mapPromptStyling: React.CSSProperties = {}
    let mapPointerStyling: React.CSSProperties = {}
    let mapFieldEntryStyling: React.CSSProperties = {}
    let mapPointerViewBox: string = ''
    let formChildClassName: string = 'form-child'
    let mapClassName: string = 'map form-section'
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
      mapFieldEntryStyling.marginBottom = mapNavigationStyling.marginBottom
      mapFieldEntryStyling.paddingTop = `${mapBounds.height / 2 - 225}px`
      mapPointerStyling.top = `${mapBounds.y}px`
      mapPointerStyling.left = `${mapBounds.x}px`
      mapPointerStyling.width = `${mapBounds.width}px`
      mapPointerStyling.height = `${mapBounds.height}px`
      mapPointerViewBox = `0 0 ${mapBounds.width} ${mapBounds.height}`
      mapActionPanelStyling.left = `${mapBounds.x}px`
      mapActionPanelStyling.top = `200px`
      mapPromptStyling.top = `${mapBounds.top + 25}px`
      mapPromptStyling.right = `calc(100vw - ${mapBounds.right - 25}px)`
    }
    if (unmappedObjectives.length === 0) {
      formChildClassName += ' all-mapped'
    }
    if (navigationIsActive) {
      mapClassName += ' active-navigation'
    }
    if (linkMode) {
      mapClassName += ' link-mode'
    } else if (unlinkMode) {
      mapClassName += ' unlink-mode'
    } else if (endMode) {
      mapClassName += ' end-mode'
    } else if (scoreMode) {
      mapClassName += ' score-mode'
    }
    return (
      <div className={formChildClassName}>
        <div className='header-main header'>
          <h1 className='heading'>
            mission-mapping
            <br />
            <div
              className='title'
              style={{
                fontStyle: missionName.length > 0 ? 'normal' : 'italic',
              }}
            >
              {missionName.length > 0 ? missionName : 'untitled'}
            </div>
          </h1>
        </div>
        <div className='unmapped form-section'>
          <List<IObjective>
            items={unmappedObjectives}
            actions={[]}
            itemsPerPage={null}
            getItemDisplay={(objective: IObjective) => objective.name}
            searchableProperties={['name']}
            noItemsDisplay={'no unmapped objectives'}
            handleGrab={this.handleObjectiveGrab}
            handleRelease={(releasedObjective: IObjective) => {
              let map: HTMLDivElement | null = this.map.current
              if (!map || !map.matches(':hover')) {
                this.setState({ cursorObjective: null })
              }
            }}
            renderTooltipDescription={(objective: IObjective) => {
              if (
                this.state.cursorObjective?.objectiveID ===
                objective.objectiveID
              ) {
                return null
              }
              return `#### ${objective.name}\n${strings.limit(
                objective.description,
                160,
              )}\n##### Map this objective.`
            }}
            ajaxStatus={objectivesAjaxStatus}
            listSpecificItemClassName={'unmapped-objective'}
            applyClassNameAddon={(objective: IObjective) => {
              let cursorObjective: IObjective | null =
                this.state.cursorObjective
              if (objective === cursorObjective) {
                return 'transparent'
              } else {
                return ''
              }
            }}
            headingText={'unmapped-objectives'}
            alwaysUseBlanks={false}
          />
        </div>
        <div
          className={mapClassName}
          ref={this.map}
          onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault()
          }}
          // -- CURSOR OBJECTIVE ENTERS MAP --
          onDragEnter={this.handleObjectiveDraggedOver}
          // -- CURSOR OBJECTIVE EXITS MAP --
          onDragLeave={this.handleObjectiveDraggedOut}
          // -- OBJECTIVE PLACEMENT --
          onDrop={this.handleObjectiveDrop}
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
            // -- MAP ACTION PANEL --
          }
          {this.renderMapActionPanel(mapActionPanelStyling)}
          {
            // -- MAP PROMPT --
          }
          {this.renderMapPrompt(mapPromptStyling)}
          {
            // -- MAP FIELD ENTRY --
          }
          {this.renderMapFieldEntry(mapFieldEntryStyling)}
          {
            // -- MAPPED OBJECTIVES --
          }
          <List<IObjective>
            items={mappedObjectives}
            actions={[]}
            itemsPerPage={null}
            getItemDisplay={(objective: IObjective) => {
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
            handleSelection={(objective: IObjective) => {
              if (linkMode) {
                this.handleLinkModeRequest(objective)
              } else if (unlinkMode) {
                this.handleUnlinkModeRequest(objective)
              } else if (endMode) {
                this.handleEndModeRequest(objective)
              } else if (scoreMode) {
                this.handleScoreModeRequest(objective)
              }
            }}
            handleGrab={
              linkMode || unlinkMode || endMode || scoreMode
                ? null
                : this.handleObjectiveGrab
            }
            handleRelease={(releasedObjective: IObjective) => {
              let map: HTMLDivElement | null = this.map.current
              if (!map || !map.matches(':hover')) {
                this.setState({ cursorObjective: null })
              }
            }}
            renderTooltipDescription={
              this.renderMappedObjectiveTooltipDescription
            }
            ajaxStatus={objectivesAjaxStatus}
            listSpecificItemClassName={'mapped-objective'}
            applyClassNameAddon={this.applyMappedObjectiveClassName}
            itemHasProperty={(
              objective: IObjective,
              property: IListItemProperty,
            ) => {
              if (property.id === 'final-objective') {
                return objective.isFinalObjective
              }
              return false
            }}
            applyElementID={(objective: IObjective) =>
              `mapped-objective_${objective.objectiveID}`
            }
            // -- OBJECTIVE POSITIONING --
            applyStyling={(objective: IObjective) => {
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
      </div>
    )
  }
}
