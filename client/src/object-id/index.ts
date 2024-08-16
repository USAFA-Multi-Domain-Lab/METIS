import axios, { AxiosError } from 'axios'

/**
 * This class is used to generate Object IDs for objects in the application.
 */
export default class ObjectId {
  /**
   * This will fetch a new Object ID from the server.
   * @resolves The new Object ID.
   * @rejects The error that occurred while fetching the new Object ID.
   */
  public static $fetch(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        let { data } = await axios.get<string>('/api/v1/object-id/')
        resolve(data)
      } catch (error: any) {
        if (error instanceof AxiosError && error.response !== undefined) {
          console.error(`${error.response.status} Failed to get Object ID:`)
        } else {
          console.error('Failed to get Object ID:')
        }
        console.error(error)
        reject(error)
      }
    })
  }
}
