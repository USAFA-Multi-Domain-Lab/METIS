import axios, { AxiosResponse } from 'axios'
import FileReference, {
  TFileReferenceJson,
} from '../../../shared/files/references'

/**
 * Client implementation of `FileReference` class.
 */
export default class ClientFileReference extends FileReference {
  /**
   * Imports a list of files to the file store
   * on the server.
   * @param files The files to import.
   * @returns References to the files now stored
   * on the server.
   */
  public static $import(
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
        >(`/api/v1/files/`, formData, {
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
   * @param json The JSON object to convert.
   * @returns A new `ClientFileReference` object from the JSON.
   */
  public static fromJson(json: TFileReferenceJson): ClientFileReference {
    return new ClientFileReference(
      json._id,
      json.name,
      json.originalName,
      json.mimetype,
      json.size,
    )
  }
}
