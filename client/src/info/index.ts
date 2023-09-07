import axios, { AxiosError } from 'axios'

/**
 * This class is used to get information about the application.
 */
export default class Info {
  /**
   * This will fetch the changelog for the application.
   * @returns {Promise<string>} A promise that resolves to a string containing the changelog.
   */
  public static async fetchChangelog(): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        let { data: changelog } = await axios.get<string>(
          '/api/v1/info/changelog/',
        )
        resolve(changelog)
      } catch (error) {
        if (error instanceof AxiosError && error.response !== undefined) {
          console.error(`${error.response.status}) Failed to get changelog:`)
        } else {
          console.error('Failed to get changelog:')
        }
        console.error(error)
        reject(error)
      }
    })
  }
}
