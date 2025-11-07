import axios, { AxiosError } from 'axios'

/**
 * This class is used to get information about the application.
 */
export class MetisInfo implements TMetisInfo {
  // Implemented
  public name: string

  // Implemented
  public description: string

  // Implemented
  public version: string

  /**
   * The version, formatted for display.
   * @example
   * ```typescript
   * "v1.0.0"
   * ```
   */
  public get versionFormatted(): string {
    return `v${this.version}`
  }

  /**
   * @param data The data to initialize the class with.
   */
  public constructor(data: TMetisInfo) {
    this.name = data.name
    this.description = data.description
    this.version = data.version
  }

  /**
   * Fetches the info for the application.
   * @resolves With the info for the application.
   * @rejects With the error that occurred while fetching the info.
   */
  public static $fetch(): Promise<MetisInfo> {
    return new Promise<MetisInfo>(async (resolve, reject) => {
      try {
        let { data: info } = await axios.get<TMetisInfo>('/api/v1/info/')
        resolve(new MetisInfo(info))
      } catch (error: any) {
        if (error instanceof AxiosError && error.response !== undefined) {
          console.error(`${error.response.status} Failed to get info:`)
        } else {
          console.error('Failed to get info:')
        }
        console.error(error)
        reject(error)
      }
    })
  }

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
