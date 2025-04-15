import axios, { AxiosResponse } from 'axios'
import FileReference, {
  TFileReferenceJson,
} from '../../../shared/files/references'
import StringToolbox from '../../../shared/toolbox/strings'

/**
 * Client implementation of `FileReference` class.
 */
export default class ClientFileReference extends FileReference {
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
    return new ClientFileReference(
      json._id,
      json.name,
      json.path,
      json.mimetype,
      json.size,
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
   * Uploads a list of files to the file store
   * on the server.
   * @param files The files to upload.
   * @returns References to the files now stored
   * on the server.
   */
  public static $upload(
    files: FileList | File[],
  ): Promise<ClientFileReference[]> {
    return new Promise<ClientFileReference[]>(async (resolve, reject) => {
      try {
        const formData = new FormData()

        for (let file of files) {
          formData.append('files', file)
        }

        let { data: responseData } = await axios.post<
          any,
          AxiosResponse<TFileReferenceJson[]>
        >(ClientFileReference.API_ENDPOINT, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        let references = responseData.map((datum) =>
          ClientFileReference.fromJson(datum),
        )
        resolve(references)
      } catch (error) {
        console.error('Failed to import file(s).')
        console.error(error)
        reject(error)
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
