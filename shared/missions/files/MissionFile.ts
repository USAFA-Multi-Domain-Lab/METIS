import type { TFileReferenceJson } from '@shared/files/FileReference'
import { MissionForce } from '../forces/MissionForce'
import {
  MissionComponent,
  type TMissionComponentIssue,
} from '../MissionComponent'

/**
 * A file that is attached to a mission as a part
 * of the scenario.
 */
export abstract class MissionFile<
  T extends TMetisBaseComponents = TMetisBaseComponents,
> extends MissionComponent<T, MissionFile<T>> {
  // Implemented.
  public get mission(): T['mission'] {
    return this._mission
  }

  /**
   * The forces that currently have access to the file.
   */
  protected access: string[]

  // Implemented.
  public get referenceId(): string {
    return this.reference._id
  }

  // Overridden
  public get name(): string {
    let result: string = this.originalName
    if (this.alias) result = `${this.alias}${this.extension}`
    return result
  }
  // Overridden
  public set name(value: string) {
    throw new Error(
      'Cannot set name of MissionFile directly. Use alias instead.',
    )
  }

  /**
   * The original name of the file.
   * @note This simply returns the name of
   * the file reference.
   */
  public get originalName(): string {
    return this.reference.name
  }

  /**
   * The extension of the file.
   * @note This simply returns the extension
   * of the file reference.
   */
  public get extension(): string {
    return this.reference.extension
  }

  // Implemented
  public get path(): [...MissionComponent<any, any>[], this] {
    return [this.mission, this]
  }

  // Implemented
  protected get additionalIssues(): TMissionComponentIssue[] {
    return []
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
    _id: string,
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
     * @see {@link MissionComponent.mission}
     */
    protected readonly _mission: T['mission'],
  ) {
    super(_id, '', reference.deleted)

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

  /**
   * The maximum length allowed for a mission file's name.
   */
  public static readonly MAX_NAME_LENGTH: number = 175

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

/* -- TYPES -- */

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
