import {
  TMapCompatibleNode,
  TMapCompatibleNodeEvent,
  TNodeButton,
} from 'src/components/content/session/mission-map/objects/nodes'
import ClientMission, { TClientMissionTypes, TMissionNavigable } from '..'
import { TListenerTargetEmittable } from '../../../../shared/events'
import { TNodeExecutionState } from '../../../../shared/missions/nodes'
import MissionPrototype, {
  TMissionPrototypeJson,
  TMissionPrototypeOptions,
} from '../../../../shared/missions/nodes/prototypes'
import { AnyObject } from '../../../../shared/toolbox/objects'
import { Vector2D } from '../../../../shared/toolbox/space'
import ClientActionExecution from '../actions/executions'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionPrototype
  extends MissionPrototype<TClientMissionTypes>
  implements
    TListenerTargetEmittable<TPrototypeEventMethod>,
    TMissionNavigable,
    TMapCompatibleNode
{
  /**
   * The position of the prototype on a mission map.
   */
  public position: Vector2D

  /**
   * The depth of the prototype in the structure.
   */
  public depth: number

  /**
   * The display name of the prototype.
   */
  public get name(): string {
    return this._id.substring(0, 8)
  }

  // Implemented
  public get nameLineCount(): number {
    // The line count for a prototype is
    // always 1.
    return 1
  }

  // Implemented
  public color: string = '#ffffff'

  /**
   * Buttons to manage this specific prototype on a mission map.
   */
  private _buttons: TNodeButton<ClientMissionPrototype>[]
  /**
   * Buttons to manage this specific prototype on a mission map.
   */
  public get buttons(): TNodeButton<ClientMissionPrototype>[] {
    return [...this._buttons]
  }
  public set buttons(value: TNodeButton<ClientMissionPrototype>[]) {
    // Gather details.
    let structureChange: boolean = false

    // If button count changed from 0 to some
    // or some to 0, mark to handle structure change.
    if (
      (this.buttons.length > 0 && value.length === 0) ||
      (this.buttons.length === 0 && value.length > 0)
    ) {
      structureChange = true
    }

    // Set buttons.
    this._buttons = value

    // Emit event.
    this.emitEvent('set-buttons')

    // Handle structure change.
    if (structureChange) {
      this.mission.handleStructureChange()
    }
  }

  // Implemented
  public get icon(): TMetisIcon {
    return '_blank'
  }

  /**
   * Whether the prototype is selected in the mission.
   */
  public get selected(): boolean {
    return this.mission.selection === this
  }

  // Implemented
  public get pending(): boolean {
    return false
  }

  // Implemented
  public get revealed(): boolean {
    return true
  }

  // Implemented
  public get latestExecution(): ClientActionExecution | null {
    return null
  }

  // Implemented
  public get executionState(): TNodeExecutionState {
    return { status: 'unexecuted' }
  }

  // Implemented
  public get executing(): boolean {
    return this.executionState.status === 'executing'
  }

  // Implemented
  public blocked: boolean = false

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this]
  }

  // Implemented
  public exclude: boolean = false

  /**
   * Listeners for prototype events.
   */
  private listeners: Array<[TPrototypeEventMethod, () => void]> = []

  /**
   * Whether the prototype is expanded in the `NodeStructuring` component.
   */
  private _expandedInMenu: boolean = false
  /**
   * Whether the prototype is expanded in the `NodeStructuring` component.
   */
  public get expandedInMenu(): boolean {
    return this._expandedInMenu
  }

  /**
   * Whether the prototype is collapsed in the `NodeStructuring` component.
   * @note Direct inverse of `expandedInMenu`.
   */
  public get collapsedInMenu(): boolean {
    return !this._expandedInMenu
  }

  // Overridden
  public get depthPadding(): number {
    return this._depthPadding
  }
  // Overriden
  public set depthPadding(value: number) {
    // Set value.
    this._depthPadding = value
    // Handle structure change.
    this.mission.handleStructureChange()
  }

  /**
   * @param mission The mission of which the prototype is a part.
   * @param data The prototype data from which to create the prototype node. Any ommitted values will be set to the default properties defined in MissionPrototype.DEFAULT_PROPERTIES.
   * @param options The options for creating the prototype.
   */
  public constructor(
    mission: ClientMission,
    data: Partial<TMissionPrototypeJson> = ClientMissionPrototype.DEFAULT_PROPERTIES,
    options: TMissionPrototypeOptions<ClientMissionPrototype> = {},
  ) {
    super(mission, data, options)

    this.position = new Vector2D(0, 0)
    this.depth = -1
    this._buttons = []
  }

  /**
   * Calls the callbacks of listeners for the given event.
   * @param method The method of the event to emit.
   */
  public emitEvent(method: TPrototypeEventMethod): void {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerEvent, listenerCallback] of this.listeners) {
      if (listenerEvent === method || listenerEvent === 'activity') {
        listenerCallback()
      }
    }
    // If the event is a set-buttons event, call
    // emit event on the mission level.
    if (method === 'set-buttons') {
      this.mission.emitEvent('set-buttons', [])
    }
  }

  // Implemented
  public addEventListener(
    method: TPrototypeEventMethod,
    callback: () => void,
  ): void {
    this.listeners.push([method, callback])
  }

  // Implemented
  public removeEventListener(
    method: TPrototypeEventMethod,
    callback: () => void,
  ): void {
    // Filter out listener.
    this.listeners = this.listeners.filter(
      ([m, h]) => m !== method || h !== callback,
    )
  }

  /**
   * Moves the prototype to the given destination, placing it based on
   * the relation passed.
   * @param destination The destination of the prototype.
   * @param relation Where in relation to the destination this prototype
   * will be placed in the structure.
   */
  public move(
    destination: ClientMissionPrototype,
    relation: TPrototypeRelation,
  ): void {
    let root: ClientMissionPrototype = this.mission.root
    let parent: ClientMissionPrototype | null = this.parent
    let newParent: ClientMissionPrototype | null = destination.parent
    let newChildrenOfParent: ClientMissionPrototype[] = []

    // This makes sure that the target
    // isn't being moved inside or beside
    // itself.
    let x: ClientMissionPrototype | null = destination

    while (x !== null && x._id !== root._id) {
      if (this._id === x._id) {
        return
      }

      x = x.parent
    }

    // This will remove the prototypes
    // current position in the structure.
    if (parent !== null) {
      let siblings: ClientMissionPrototype[] = parent.children

      for (let index: number = 0; index < siblings.length; index++) {
        let sibling = siblings[index]

        if (this._id === sibling._id) {
          siblings.splice(index, 1)
        }
      }
    }

    // This will move the target based on
    // its relation to this prototype.
    switch (relation) {
      case 'parent-of-target-only':
        this.parent = destination.parent
        let targetAndTargetSiblings: ClientMissionPrototype[] =
          destination.childrenOfParent

        if (destination.parent !== null) {
          for (
            let index: number = 0;
            index < targetAndTargetSiblings.length;
            index++
          ) {
            let sibling = targetAndTargetSiblings[index]

            if (destination._id === sibling._id) {
              targetAndTargetSiblings[index] = this
            }
          }

          destination.parent.children = targetAndTargetSiblings
        }

        this.children = [destination]
        destination.parent = this
        break
      case 'between-target-and-children':
        let children: ClientMissionPrototype[] = destination.children

        destination.children = [this]
        this.parent = destination

        for (let child of children) {
          child.parent = this
        }
        this.children = children
        break
      case 'child-of-target':
        destination.children.push(this)
        this.parent = destination
        break
      case 'previous-sibling-of-target':
        if (newParent !== null) {
          newParent.children.forEach((child: ClientMissionPrototype) => {
            if (child._id === destination._id) {
              newChildrenOfParent.push(this)
              this.parent = newParent
            }

            newChildrenOfParent.push(child)
          })

          newParent.children = newChildrenOfParent
        }
        break
      case 'following-sibling-of-target':
        if (newParent !== null) {
          newParent.children.forEach((child: ClientMissionPrototype) => {
            newChildrenOfParent.push(child)

            if (child._id === destination._id) {
              newChildrenOfParent.push(this)
              this.parent = newParent
            }
          })

          newParent.children = newChildrenOfParent
        }
        break
    }

    this.mission.handleStructureChange()
  }

  /**
   * Delete a prototype from the mission.
   * @param options Options for how the prototype should be deleted.
   */
  public delete(options: TPrototypeDeleteOptions = {}): void {
    const { calledByParentDelete = false, deleteMethod = 'delete-children' } =
      options

    switch (deleteMethod) {
      case 'delete-children':
        let children: ClientMissionPrototype[] = [...this.children]

        for (let child of children) {
          let childOptions: TPrototypeDeleteOptions = {
            ...options,
            calledByParentDelete: true,
          }
          child.delete(childOptions)
        }

        this.childrenOfParent.splice(this.childrenOfParent.indexOf(this), 1)
        this.mission.prototypes = this.mission.prototypes.filter(
          (prototype) => prototype._id !== this._id,
        )
        break
      case 'shift-children':
        let parentOfThis: ClientMissionPrototype | null = this.parent
        let childrenofThis: ClientMissionPrototype[] = [...this.children]

        childrenofThis.forEach((child: ClientMissionPrototype) => {
          if (parentOfThis !== null) {
            parentOfThis.children.splice(
              parentOfThis.children.indexOf(this),
              0,
              child,
            )
            child.parent = parentOfThis
          }
        })

        if (parentOfThis !== null) {
          parentOfThis.children.splice(parentOfThis.children.indexOf(this), 1)
          this.mission.prototypes = this.mission.prototypes.filter(
            (prototype) => prototype._id !== this._id,
          )
          this.mission.handleStructureChange()
        }
        break
    }

    if (calledByParentDelete !== true) {
      // Structure change is handled as long
      // as one prototype exists. If not, a new
      // prototype is created. Creating this prototype
      // will handle the structure change for
      // us.
      if (this.mission.prototypes.length > 0) {
        this.mission.handleStructureChange()
      } else {
        this.mission.createPrototype()
      }
    }
  }

  /**
   * Toggle the expandedInMenu property between true and false.
   */
  public toggleMenuExpansion(): void {
    this._expandedInMenu = !this._expandedInMenu
  }

  /**
   * Maps the relationships between the prototypes
   * based on the structure object.
   * @param descendants The descendant prototypes to map the relationships for.
   * @param cursor The current location in the structure object.
   * @param parent **THIS IS FOR RECURSION ONLY. DO NOT SET!!**
   */
  protected mapDescendantRelationships(
    descendants: TMissionPrototypeJson[],
    cursor: AnyObject,
    parent: ClientMissionPrototype = this,
  ): void {
    // Gather details.
    let { mission } = parent

    // Arrange each prototypes children based on the
    // structure object.
    for (let key of Object.keys(cursor)) {
      let childStructure = cursor[key]
      let prototype = descendants.find(
        ({ structureKey }) => structureKey === key,
      )

      // If the prototype is not found, skip it.
      // *** Note: The first key in the structure object
      // *** is always the prototype itself. This is why
      // *** we continue on if the prototype is not found.
      if (!prototype && childStructure !== undefined) {
        this.mapDescendantRelationships(descendants, childStructure, parent)
        continue
      }

      // Handle creating the prototype.
      let child = new ClientMissionPrototype(mission, prototype)
      mission.prototypes.push(child)
      child.parent = parent
      parent.children.push(child)

      // Continue mapping the remaining descendants.
      this.mapDescendantRelationships(descendants, childStructure, child)
    }
  }

  /**
   * Callback for when the server emits a node open
   * event, processing the event here at the prototype
   * level.
   * @param revealedDescendantPrototypes The prototypes revealed by
   * the open event, if any.
   * @param structure The structure referenced for the relationships between
   * the prototypes.
   */
  public onOpen(
    revealedDescendantPrototypes: TMissionPrototypeJson[] | undefined,
    structure: AnyObject | undefined,
  ): void {
    if (revealedDescendantPrototypes && structure) {
      // If the descendants are already set,
      // don't set them again.
      if (this.descendants.length > 0) return
      // Map the relationships.
      this.mapDescendantRelationships(revealedDescendantPrototypes, structure)
    }
  }
}

/**
 * An event that occurs on a prototype, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'set-buttons'
 * Triggered when the buttons for the prototype are set.
 */
export type TPrototypeEventMethod = TMapCompatibleNodeEvent

/**
 * The relation of prototype to another prototype.
 */
export type TPrototypeRelation =
  | 'parent-of-target-only'
  | 'child-of-target'
  | 'between-target-and-children'
  | 'previous-sibling-of-target'
  | 'following-sibling-of-target'

/**
 * Method for deleting a prototype.
 * @option 'delete-children'
 * Deletes the prototype and all of its children.
 * @option 'shift-children'
 * Deletes the prototype and transfers its children to the prototype's parent.
 */
export type TPrototypeDeleteMethod = 'delete-children' | 'shift-children'

/**
 * Options for `ClientMissionPrototype.delete`.
 */
export interface TPrototypeDeleteOptions {
  calledByParentDelete?: boolean // Default "false"
  deleteMethod?: TPrototypeDeleteMethod // Default 'delete-children'
}
