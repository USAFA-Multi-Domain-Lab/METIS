import { TPrototypeButton } from 'src/components/content/session/mission-map/objects/MissionPrototype'
import { TEventListenerTarget } from 'src/toolbox/hooks'
import ClientMission, { TClientMissionTypes, TMissionNavigable } from '..'
import MissionPrototype, {
  TCommonMissionPrototype,
  TMissionPrototypeOptions,
} from '../../../../shared/missions/nodes/prototypes'
import { Vector2D } from '../../../../shared/toolbox/space'

/**
 * Class for managing mission prototypes on the client.
 */
export default class ClientMissionPrototype
  extends MissionPrototype<TClientMissionTypes>
  implements TEventListenerTarget<TPrototypeEventMethod>, TMissionNavigable
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

  /**
   * Buttons to manage this specific prototype on a mission map.
   */
  private _buttons: TPrototypeButton[]
  /**
   * Buttons to manage this specific prototype on a mission map.
   */
  public get buttons(): TPrototypeButton[] {
    return [...this._buttons]
  }
  public set buttons(value: TPrototypeButton[]) {
    this._buttons = value
    this.emitEvent('set-buttons')
  }

  /**
   * Listeners for prototype events.
   */
  private listeners: Array<[TPrototypeEventMethod, () => void]> = []

  // Implemented
  public get path(): TMissionNavigable[] {
    return [this.mission, this]
  }

  public constructor(
    mission: ClientMission,
    _id: TCommonMissionPrototype['_id'],
    options: TMissionPrototypeOptions<ClientMissionPrototype> = {},
  ) {
    super(mission, _id, options)

    this.position = new Vector2D(0, 0)
    this.depth = -1
    this._buttons = []
  }

  /**
   * Calls the callbacks of listeners for the given event.
   * @param method The method of the event to emit.
   */
  protected emitEvent(method: TPrototypeEventMethod): void {
    // Call any matching listener callbacks
    // or any activity listener callbacks.
    for (let [listenerEvent, listenerCallback] of this.listeners) {
      if (listenerEvent === method || listenerEvent === 'activity') {
        listenerCallback()
      }
    }
  }

  /**
   * Adds a listener for a node event.
   * @param method The method of the event to listen for.
   * @param callback The callback to call when the event is triggered.
   */
  public addEventListener(
    method: TPrototypeEventMethod,
    callback: () => void,
  ): ClientMissionPrototype {
    this.listeners.push([method, callback])
    return this
  }

  /**
   * Removes a listener for a node event.
   * @param callback The callback used for the listener.
   */
  public removeEventListener(callback: () => void): ClientMissionPrototype {
    // Filter out listener.
    this.listeners = this.listeners.filter(([, h]) => h !== callback)
    return this
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
    let oldParent: ClientMissionPrototype | null = this.parent
    let newParent: ClientMissionPrototype | null = destination.parent
    let newParentChildren: Array<ClientMissionPrototype> = []

    // This makes sure that the destination
    // isn't being moved inside or beside
    // itself.
    let x: ClientMissionPrototype | null = destination

    while (x !== null && x._id !== root._id) {
      if (this._id === x._id) {
        return
      }

      x = x.parent
    }

    // This will remove the prototype's
    // current position in the structure.
    if (oldParent !== null) {
      let siblings: ClientMissionPrototype[] = oldParent.children

      for (let index: number = 0; index < siblings.length; index++) {
        let sibling = siblings[index]

        if (this._id === sibling._id) {
          siblings.splice(index, 1)
        }
      }
    }

    // This will move the target based on
    // its relation to this node.
    switch (relation) {
      case 'parent-of-target-only':
        this.parent = destination.parent
        let targetAndTargetSiblings: Array<ClientMissionPrototype> =
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
      case 'parent-of-target-and-children':
        // TODO
        break
      case 'between-target-and-children':
        let childNodes: Array<ClientMissionPrototype> = destination.children

        destination.children = [this]
        this.parent = destination

        for (let childNode of childNodes) {
          childNode.parent = this
        }
        this.children = childNodes
        break
      case 'child-of-target':
        destination.children.push(this)
        this.parent = destination
        break
      case 'previous-sibling-of-target':
        if (newParent !== null) {
          newParent.children.forEach((childNode: ClientMissionPrototype) => {
            if (childNode._id === destination._id) {
              newParentChildren.push(this)
              this.parent = newParent
            }

            newParentChildren.push(childNode)
          })

          newParent.children = newParentChildren
        }
        break
      case 'following-sibling-of-target':
        if (newParent !== null) {
          newParent.children.forEach((childNode: ClientMissionPrototype) => {
            newParentChildren.push(childNode)

            if (childNode._id === destination._id) {
              newParentChildren.push(this)
              this.parent = newParent
            }
          })

          newParent.children = newParentChildren
        }
        break
    }

    this.mission.handleStructureChange()
  }
}

/**
 * An event that occurs on a node, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'set-buttons'
 * Triggered when the buttons for the node are set.
 */
export type TPrototypeEventMethod = 'activity' | 'set-buttons'

/**
 * The relation of prototype to another prototype.
 */
export type TPrototypeRelation =
  | 'parent-of-target-and-children'
  | 'parent-of-target-only'
  | 'child-of-target'
  | 'between-target-and-children'
  | 'previous-sibling-of-target'
  | 'following-sibling-of-target'
