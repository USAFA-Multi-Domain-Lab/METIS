import { TMetisClientComponents } from 'src'
import ClientFileReference from 'src/files/references'
import SessionClient from 'src/sessions'
import ClientMission from '..'
import {
  EventManager,
  TListenerTargetEmittable,
} from '../../../../shared/events'
import MissionFile, {
  TMissionFileJson,
} from '../../../../shared/missions/files/'
import StringToolbox from '../../../../shared/toolbox/strings'
import ClientMissionForce from '../forces'

/**
 * Client implementation of `MissionFile` class.
 */
export default class ClientMissionFile
  extends MissionFile<TMetisClientComponents>
  implements TListenerTargetEmittable<TFileEventMethods>
{
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

  /**
   * Manages the mission's event listeners and events.
   */
  private eventManager: EventManager<TFileEventMethods>

  protected constructor(
    _id: string,
    alias: string,
    initialAccess: string[],
    reference: ClientFileReference,
    mission: ClientMission,
  ) {
    super(_id, alias, initialAccess, reference, mission)

    // Initialize the event manager.
    this.eventManager = new EventManager(this)
    this.emitEvent = this.eventManager.emitEvent
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
  }

  // Implemented
  public emitEvent

  // Implemented
  public addEventListener

  // Implemented
  public removeEventListener

  // Overridden
  public grantAccess(force: ClientMissionForce | string): void {
    super.grantAccess(force)
    this.emitEvent('access-granted')
    this.mission.emitEvent('file-access-granted', [])
  }

  // Overridden
  public revokeAccess(force: ClientMissionForce | string): void {
    super.revokeAccess(force)
    this.emitEvent('access-revoked')
    this.mission.emitEvent('file-access-revoked', [])
  }

  /**
   * Downloads the file from the server by opening up a new tab with
   * the file's URI.
   * @param options Additional parameters specifying how the download
   * should be carried out.
   */
  public download(options: TMissionFileDownloadOptions = {}): void {
    const { method = 'file-api' } = options

    switch (method) {
      case 'session-api':
        window.open(
          StringToolbox.joinPaths(
            SessionClient.API_ENDPOINT,
            'files',
            this._id,
            'download',
          ),
        )
        break
      case 'file-api':
      default:
        if (this.reference) this.reference.download()
        else console.warn('No file reference available for download.')
        break
    }
  }

  /**
   * @param data The JSON data from which to create the instance.
   * @param mission The mission to which this file belongs.
   * @returns A new {@link ClientMissionFile} instance.
   */
  public static fromJson(
    data: TMissionFileJson,
    mission: ClientMission,
  ): ClientMissionFile {
    let reference: ClientFileReference

    // Parse reference data.
    if (typeof data.reference === 'object') {
      reference = ClientFileReference.fromJson(data.reference)
    } else {
      reference = ClientFileReference.createDeleted({ _id: data.reference })
    }

    // Create and return new `ClientFileReference` instance.
    return new ClientMissionFile(
      data._id,
      data.alias,
      data.initialAccess,
      reference,
      mission,
    )
  }

  /**
   * Creates a `ClientMissionFile` instance with standard
   * values from a `ClientFileReference` instance.
   * @param reference The file reference to use.
   * @param mission The mission of which this file is becoming
   * a part.
   * @returns A new `ClientMissionFile` instance.
   */
  public static fromFileReference(
    reference: ClientFileReference,
    mission: ClientMission,
  ): ClientMissionFile {
    return new ClientMissionFile(
      StringToolbox.generateRandomId(),
      '',
      [],
      reference,
      mission,
    )
  }

  /**
   * @returns A new `ClientMissionFile` instance that
   * represents a file that is referenced in a effect
   * but not currently found in the mission files.
   */
  public static createDetached(
    _id: string,
    name: string,
    mission: ClientMission,
  ): ClientMissionFile {
    return new ClientMissionFile(
      _id,
      name,
      [],
      ClientFileReference.createDeleted({
        _id: StringToolbox.generateRandomId(),
        name,
      }),
      mission,
    )
  }
}

/**
 * Options for `ClientMissionFile.download` method.
 */
export type TMissionFileDownloadOptions = {
  /**
   * The method used to download the file.
   * @option 'file-api' Uses the file API to download the file.
   * @option 'session-api' Uses the session API to download the file.
   * @note This option is dependent on permissions. If the user is a
   * student, they will only have access to download the file through
   * the session API, if they have already be granted access to the file
   * via the session.
   * @default 'file-api'
   */
  method?: 'file-api' | 'session-api'
}

/**
 * The methods that can be emitted by the `ClientMissionFile` class.
 */
export type TFileEventMethods = 'access-granted' | 'access-revoked'
