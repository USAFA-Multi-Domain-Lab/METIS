import { TFileReferenceJson } from 'metis/files/references'
import { TMetisBaseComponents } from 'metis/index'
import { TMissionComponent } from '..'

/**
 * A file that is attached to a mission as a part
 * of the scenario.
 */
export default abstract class MissionFile<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> implements TMissionComponent<T, MissionFile<T>>
{
  // Implemented.
  public get referenceId(): string {
    return this.reference._id
  }

  // Implemented.
  public get name(): string {
    return this.alias
  }

  // Implemented
  public get path(): [...TMissionComponent<any, any>[], this] {
    return [this.mission, this]
  }

  // Implemented
  public get defective(): boolean {
    return !!this.defectiveMessage.length
  }

  // Implemented
  public get defectiveMessage(): string {
    return ''
  }

  /**
   * The MIME type of the file.
   */
  public get mimetype(): string {
    return this.reference.mimetype
  }

  /**
   * The size of the file.
   */
  public get size(): number {
    return this.reference.size
  }

  public constructor(
    // Implemented.
    public readonly _id: string,
    /**
     * An alias given to the file, specific to the
     * scenario's needs.
     */
    public alias: string,
    /**
     * Forces which have initial access to the file.
     * Otherwise, any non-specified forces will only
     * have access if later granted it, for instance,
     * by an effect.
     */
    public initialAccess: string[],
    /**
     * The reference to the file in the file store.
     */
    public readonly reference: T['fileReference'],
    /**
     * The mission of which this file is a part.
     */
    public readonly mission: T['mission'],
  ) {}

  /**
   * Converts the mission file to a JSON
   * representation of the class instance.
   */
  public toJson(): TMissionFileJson {
    return {
      _id: this._id,
      alias: this.alias,
      initialAccess: this.initialAccess,
      reference: this.reference.toJson(),
    }
  }
}

/**
 * JSON representation of a mission file.
 */
export type TMissionFileJson = {
  /**
   * Uniquely identifies the file in the mission.
   */
  _id: string
  /**
   * An alias given to the file, specific to the
   * scenario's needs.
   */
  alias: string
  /**
   * Forces which have initial access to the file.
   * Otherwise, any non-specified forces will only
   * have access if later granted it, for instance,
   * by an effect.
   */
  initialAccess: string[]
  /**
   * The reference to the file in the store.
   */
  reference: TFileReferenceJson | string
}
