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
}

/**
 * An event that occurs on a node, which can be listened for.
 * @option 'activity'
 * Triggered when any other event occurs.
 * @option 'set-buttons'
 * Triggered when the buttons for the node are set.
 */
export type TPrototypeEventMethod = 'activity' | 'set-buttons'
