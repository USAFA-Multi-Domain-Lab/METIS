import MissionTransformation from '.'
import ClientMissionPrototype, { TPrototypeRelation } from '../nodes/prototypes'

/**
 * A transformation within a mission where an existing prototype
 * is translated and placed adjacent to a given destination prototype.
 */
export default class PrototypeTranslation extends MissionTransformation {
  // Implemented
  public get _readyToApply(): boolean {
    return this._relation !== null && this._destination !== null
  }

  /**
   * The prototype that will be translated.
   */
  private _prototype: ClientMissionPrototype
  /**
   * The prototype that will be translated.
   */
  public get prototype(): ClientMissionPrototype {
    return this._prototype
  }
  public set prototype(value: ClientMissionPrototype) {
    this._prototype = value
  }

  /**
   * The translated prototype will be placed relative to
   * this prototype.
   */
  private _destination: ClientMissionPrototype | null
  /**
   * The translated prototype will be placed relative to
   * this prototype.
   */
  public get destination(): ClientMissionPrototype | null {
    return this._destination
  }
  public set destination(value: ClientMissionPrototype | null) {
    this._destination = value
  }

  /**
   * The relation of the translated prototype to the relative.
   */
  private _relation: TPrototypeRelation | null
  /**
   * The relation of the translated prototype to the relative.
   */
  public get relation(): TPrototypeRelation | null {
    return this._relation
  }
  public set relation(value: TPrototypeRelation | null) {
    this._relation = value
  }

  /**
   * @param prototype The prototype that will be translated.
   * @options Additional options for prototype translation.
   */
  public constructor(
    prototype: ClientMissionPrototype,
    options: TPrototypeTranslationOptions = {},
  ) {
    super(prototype.mission)

    // Extract options.
    const { destination = null, relation = null } = options

    // Store properties passed.
    this._prototype = prototype
    this._destination = destination
    this._relation = relation
  }

  // Implemented
  protected _apply(): void {
    // Relation is confirmed to not be null when `readyToApply`
    // is checked in super class.
    this._prototype.move(this.destination!, this.relation!)
  }
}

/* -- TYPES -- */

/**
 * Options for translating a prototype.
 */
export type TPrototypeTranslationOptions = {
  /**
   * The translated prototype will be placed relative to
   * this prototype.
   * @default null
   */
  destination?: ClientMissionPrototype | null
  /**
   * The relation of the translated prototype to the relative.
   * @default null
   */
  relation?: TPrototypeRelation | null
}
