import { ClientUser } from '@client/users/ClientUser'
import type { TListenerTargetEmittable } from '@shared/events/EventManager'
import { EventManager } from '@shared/events/EventManager'
import type { TFileReferenceJson } from '@shared/files/FileReference'
import { FileReference } from '@shared/files/FileReference'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { AxiosProgressEvent, AxiosResponse } from 'axios'
import axios from 'axios'
import type { TMetisClientComponents } from '..'

/**
 * Client implementation of `FileReference` class.
 */
export class ClientFileReference
  extends FileReference<TMetisClientComponents>
  implements TListenerTargetEmittable<TFileReferenceEventMethods>
{
  /**
   * Manages the file reference's event listeners and events.
   */
  private eventManager: EventManager<TFileReferenceEventMethods>

  protected constructor(
    _id: string,
    name: string,
    path: string,
    mimetype: string,
    size: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: ClientUser,
    createdByUsername: string,
    deleted: boolean,
  ) {
    super(
      _id,
      name,
      path,
      mimetype,
      size,
      createdAt,
      updatedAt,
      createdBy,
      createdByUsername,
      deleted,
    )

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

  /**
   * Downloads the file from the server by opening up
   * a new tab with the file's URI.
   */
  public download(): void {
    window.open(
      StringToolbox.joinPaths(
        ClientFileReference.API_ENDPOINT,
        this._id,
        'download',
      ),
      '_blank',
    )
  }

  /**
   * The API endpoint for managing files.
   */
  public static readonly API_ENDPOINT: string = '/api/v1/files'

  /**
   * @param json The JSON object to convert.
   * @returns A new `ClientFileReference` object from the JSON.
   */
  public static fromJson(json: TFileReferenceJson): ClientFileReference {
    let createdBy: ClientUser

    // Parse reference data.
    if (typeof json.createdBy === 'object') {
      createdBy = ClientUser.fromCreatedByJson(json.createdBy)
    } else {
      createdBy = ClientUser.createUnpopulated(
        json.createdBy,
        json.createdByUsername,
      )
    }

    return new ClientFileReference(
      json._id,
      json.name,
      json.path,
      json.mimetype,
      json.size,
      new Date(json.createdAt),
      new Date(json.updatedAt),
      createdBy,
      json.createdByUsername,
      false,
    )
  }

  /**
   * Creates a new {@link ClientFileReference} instance used to represent
   * a previously-existing and now-deleted file.
   * @param knownData Optional partial data to initialize the reference.
   * Only pass the properties known for the deleted file, if any.
   * @returns A new {@link ClientFileReference} instance.
   */
  public static createDeleted(_id: string, name: string): ClientFileReference {
    return new ClientFileReference(
      _id,
      name,
      '/',
      'application/octet-stream',
      0,
      new Date(),
      new Date(),
      ClientUser.createUnpopulated(
        StringToolbox.generateRandomId(),
        'Unknown User',
      ),
      'Unknown User',
      true,
    )
  }

  /**
   * Calls the API to fetch one file reference by ID.
   * @param _id The ID of the reference to fetch.
   * @resolves The file reference that was fetched.
   * @rejects The error that occurred while fetching the reference.
   */
  public static $fetchOne(_id: string): Promise<ClientFileReference> {
    return new Promise<ClientFileReference>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: referenceData } = await axios.get<TFileReferenceJson>(
          `${ClientFileReference.API_ENDPOINT}/${_id}/`,
        )
        // Convert JSON to `ClientFileReference` object.
        let reference = ClientFileReference.fromJson(referenceData)
        // Resolve
        resolve(reference)
      } catch (error) {
        console.error('Failed to fetch file reference.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Calls the API to fetch all file references available.
   * @resolves With the file references that were fetched.
   * @rejects The error that occurred while fetching the references.
   */
  public static $fetchAll(): Promise<ClientFileReference[]> {
    return new Promise<ClientFileReference[]>(async (resolve, reject) => {
      try {
        // Retrieve data from API.
        let { data: referenceData } = await axios.get<TFileReferenceJson[]>(
          ClientFileReference.API_ENDPOINT,
        )
        // Convert JSON to `ClientFileReference` objects.
        let references: ClientFileReference[] = referenceData.map((datum) =>
          ClientFileReference.fromJson(datum),
        )
        // Resolve
        resolve(references)
      } catch (error) {
        console.error('Failed to fetch file references.')
        console.error(error)
        reject(error)
      }
    })
  }

  /**
   * Uploads a file to the file store on the server.
   * @param file The file to upload.
   * @returns References to the file now stored
   * on the server.
   */
  public static $upload(
    file: File,
    options: TFileUploadOptions = {},
  ): Promise<ClientFileReference> {
    return new Promise<ClientFileReference>(async (resolve, reject) => {
      try {
        // Parse options.
        const { onUploadProgress, abortController } = options

        // Prepare form data for upload.
        const formData = new FormData()
        formData.append('files', file)

        // Make request.
        let { data: responseData } = await axios.post<
          any,
          AxiosResponse<TFileReferenceJson[]>
        >(ClientFileReference.API_ENDPOINT, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: abortController?.signal,
          onUploadProgress,
        })

        // Handle no response data.
        if (responseData.length === 0) {
          throw new Error('No file references were returned from the server.')
        }

        // Parse response data and resolve.
        let reference = ClientFileReference.fromJson(responseData[0])
        resolve(reference)
      } catch (error) {
        if (axios.isCancel(error)) {
          console.warn('File upload was cancelled.')
          return
        } else {
          console.error('Failed to import file(s).')
          console.error(error)
          reject(error)
        }
      }
    })
  }

  /**
   * Deletes the reference with the given ID.
   * @param _id The ID of the reference to delete.
   * @resolves The reference was successfully deleted.
   * @rejects The error that occurred during the deletion.
   */
  public static $delete(_id: ClientFileReference['_id']): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await axios.delete(`${ClientFileReference.API_ENDPOINT}/${_id}/`)
        resolve()
      } catch (error) {
        console.error('Failed to delete reference.')
        console.error(error)
        reject(error)
      }
    })
  }
}

/**
 * Options for {@link ClientFileReference.$upload} method.
 */
export type TFileUploadOptions = {
  /**
   * Called periodically during the upload process.
   * @param event Event containing information concerning the
   * state of the upload as it is progressing.
   */
  onUploadProgress?: (event: AxiosProgressEvent) => void
  /**
   * An abort controller used to cancel the upload
   * externally, if needed.
   */
  abortController?: AbortController
}

/**
 * The methods that can be emitted by the `ClientFileReference` class.
 */
export type TFileReferenceEventMethods = ''
