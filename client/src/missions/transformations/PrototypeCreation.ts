import type {
  ClientMissionPrototype,
  TPrototypeRelation,
} from '../nodes/ClientMissionPrototype'
import { MissionTransformation } from './MissionTransformation'

/**
 * A transformation within a mission where a new prototype
 * is created and is placed adjacent to a given destination prototype.
 */
export class PrototypeCreation extends MissionTransformation {
  // Implemented
  public get _readyToApply(): boolean {
    return this._relation !== null
  }

  /**
   * The created prototype will be placed relative to
   * this prototype.
   */
  private _destination: ClientMissionPrototype
  /**
   * The created prototype will be placed relative to
   * this prototype.
   */
  public get destination(): ClientMissionPrototype {
    return this._destination
  }
  public set destination(value: ClientMissionPrototype) {
    this._destination = value
  }

  /**
   * The relation of the created prototype to the destination.
   */
  private _relation: TPrototypeRelation | null
  /**
   * The relation of the created prototype to the destination.
   */
  public get relation(): TPrototypeRelation | null {
    return this._relation
  }
  public set relation(value: TPrototypeRelation | null) {
    this._relation = value
  }

  /**
   * @param destination The created prototype will be placed relative to this prototype.
   * @options Additional options for prototype creation.
   */
  public constructor(
    destination: ClientMissionPrototype,
    options: TPrototypeCreationOptions = {},
  ) {
    super(destination.mission)

    // Extract options.
    const { relation = null } = options

    // Store properties passed.
    this._destination = destination
    this._relation = relation
  }

  // Implemented
  protected _apply(): void {
    let prototype: ClientMissionPrototype = this.mission.createPrototype()
    // Relation is confirmed to not be null when `readyToApply`
    // is checked in super class.
    prototype.move(this.destination, this.relation!)
    // Select the new prototype.
    this.mission.select(prototype)
  }
}

/* -- TYPES -- */

/**
 * Options for creating a prototype.
 */
export type TPrototypeCreationOptions = {
  /**
   * The relation of the created prototype to the destination.
   * @default null
   */
  relation?: TPrototypeRelation | null
}
