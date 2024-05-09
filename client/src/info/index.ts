import axios, { AxiosError } from 'axios'

/**
 * This class is used to get information about the application.
 */
export default class Info {
  /**
   * This will fetch the changelog for the application.
   * @resolves The changelog for the application.
   * @rejects The error that occurred while fetching the changelog.
   */
  public static $fetchChangelog(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        let { data: changelog } = await axios.get<string>(
          '/api/v1/info/changelog/',
        )
        resolve(changelog)
      } catch (error: any) {
        if (error instanceof AxiosError && error.response !== undefined) {
          console.error(`${error.response.status} Failed to get changelog:`)
        } else {
          console.error('Failed to get changelog:')
        }
        console.error(error)
        reject(error)
      }
    })
  }
}
