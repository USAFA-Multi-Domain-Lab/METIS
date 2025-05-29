import { TFileReferenceJson } from 'metis/files/references'
import { TMetisBaseComponents } from 'metis/index'
import { TMissionComponent } from '..'
import { MissionForce } from '../forces'

/**
 * A file that is attached to a mission as a part
 * of the scenario.
 */
export default abstract class MissionFile<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> implements TMissionComponent<T, MissionFile<T>>
{
  /**
   * The forces that currently have access to the file.
   */
  protected access: string[]

  // Implemented.
  public get referenceId(): string {
    return this.reference._id
  }

  // Implemented.
  public get name(): string {
    return this.alias || this.originalName
  }

  // Implemented.
  public get deleted(): boolean {
    return this.reference.deleted
  }

  /**
   * The original name of the file.
   * @note This simply returns the name of
   * the file reference.
   */
  public get originalName(): string {
    return this.reference.name
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
     * @note If `null`, the original name of the file
     * will be used.
     */
    public alias: string,
    /**
     * The last known name assigned to the file reference.
     * This is stored in the event that the file reference
     * is deleted. This value will provide a default value
     * for the name of the deleted file.
     */
    public lastKnownName: string,
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
  ) {
    // Update the last-known name if the reference
    // is not deleted.
    if (!reference.deleted) this.lastKnownName = reference.name
    else reference.name = lastKnownName
    this.access = [...initialAccess]
  }

  /**
   * Whether the given force has access to the file.
   * @param force The force or the ID of the force to check.
   * @returns Whether the force has access to the file.
   */
  public hasAccess(force: MissionForce | string): boolean {
    let forceId: string = force instanceof MissionForce ? force._id : force
    return this.access.includes(forceId)
  }

  /**
   * Grants access to the file to the given force.
   * @param force The force or the ID of the force to grant access to.
   */
  public grantAccess(force: MissionForce | string): void {
    let forceId: string = force instanceof MissionForce ? force._id : force
    if (!this.access.includes(forceId)) {
      this.access.push(forceId)
    }
  }

  /**
   * Revokes access to the file from the given force.
   * @param force The force or the ID of the force to revoke access from.
   */
  public revokeAccess(force: MissionForce | string): void {
    let forceId: string = force instanceof MissionForce ? force._id : force
    this.access = this.access.filter((f) => f !== forceId)
  }

  /**
   * Converts the mission file to a JSON
   * representation of the class instance.
   */
  public toJson(): TMissionFileJson {
    return {
      _id: this._id,
      alias: this.alias,
      lastKnownName: this.lastKnownName,
      initialAccess: this.initialAccess,
      reference: this.reference.toJson(),
    }
  }

  public static DEFAULT_PROPERTIES: Omit<
    Required<TMissionFileJson>,
    'reference'
  > = {
    _id: '',
    alias: '',
    lastKnownName: '',
    initialAccess: [],
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
   * @see {@link MissionFile.alias}
   */
  alias: string
  /**
   * @see {@link MissionFile.lastKnownName}
   */
  lastKnownName: string
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
