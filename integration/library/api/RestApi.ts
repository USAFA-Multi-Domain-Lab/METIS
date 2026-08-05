import type { TAnyObject } from '@metis/toolbox/objects/ObjectToolbox'
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import https from 'https'
import z from 'zod'
import { Api, apiOptionsSchema } from './Api'

/**
 * The RESTful API class is used to make HTTP requests to target environments.
 */
export class RestApi extends Api {
  /**
   * The base URL where the API can be reached at.
   */
  private _baseUrl: string
  /**
   * The base URL where the API can be reached at.
   */
  public get baseUrl(): string {
    return this._baseUrl
  }

  /**
   * The axios instance every request is sent through.
   */
  private _client: AxiosInstance
  /**
   * The axios instance every request is sent through. Use this to add
   * interceptors, which is how a scheme that has to run per request —
   * signing a request, refreshing an expired token — is applied.
   */
  public get client(): AxiosInstance {
    return this._client
  }

  /**
   * The settings applied to every request this instance sends.
   *
   * This object is live and meant to be written to. Authentication is not
   * handled for you, because there is no one way to do it — set whatever
   * your service expects and it is sent with every request:
   *
   * ```typescript
   * api.config.headers.common['X-API-Key'] = process.env.MY_API_KEY
   * api.config.auth = { username: 'user', password: 'pass' }
   * ```
   *
   * Settings passed to an individual request are merged over these rather
   * than replacing them, so a per-request header does not drop the ones
   * set here.
   */
  public get config(): AxiosInstance['defaults'] {
    return this._client.defaults
  }

  /**
   * @param options Used to configure how the API
   * is accessed.
   */
  public constructor(options: TApiOptions = {}) {
    super()

    // Build the base URL.
    this._baseUrl = this.buildBaseUrl(options)

    // Build the client every request goes through.
    this._client = axios.create(this.buildRequestConfig(options))
  }

  /**
   * Builds the base URL for the API.
   * @param options The options to use to build the base URL.
   * @returns The base URL for the API.
   */
  private buildBaseUrl(options: TApiOptions): string {
    // Initialize the base URL.
    let baseUrl: string = ''
    let defaultPort: string = '80'

    // If there's a protocol...
    if (options.protocol) {
      // Update the port if the protocol is HTTPS.
      if (options.protocol === 'https') defaultPort = '443'
      // Update the base URL.
      baseUrl = `${options.protocol}://`
    } else {
      // Set the default protocol to HTTP.
      baseUrl = 'http://'
    }

    // If there's an host...
    if (options.host) {
      // Use a regular expression to check if the host contains a port.
      let portRegex: RegExp = /.*:([0-9]+).*/
      // If the host contains a port...
      if (portRegex.test(options.host)) {
        // Add the entire host.
        baseUrl += options.host
      }
      // Or if the host contains a port...
      else if (options.port) {
        // Add the host and the port.
        baseUrl += `${options.host}:${options.port}`
      }
      // Otherwise, add the host and the default port.
      else {
        baseUrl += `${options.host}:${defaultPort}`
      }
    }
    // Or if there's a port...
    else if (options.host === undefined && options.port !== undefined) {
      // Add the localhost and the port.
      baseUrl += `localhost:${options.port}`
    }
    // Otherwise, use localhost and the default port.
    else {
      baseUrl += `localhost:${defaultPort}`
    }

    // Return the base URL.
    return baseUrl
  }

  /**
   * Builds the configuration for the request.
   * @param options The options to use to build the request configuration.
   * @returns The configuration for the request.
   */
  private buildRequestConfig(
    options: TApiOptions,
  ): AxiosRequestConfig<TAnyObject> {
    // Initialize the configuration.
    let config: AxiosRequestConfig<TAnyObject> = {}

    // Determines if the server will reject any
    // connection which is not authorized with
    // the list of supplied CAs.
    if (options.rejectUnauthorized !== undefined) {
      // Create a new https agent.
      const httpsAgent = new https.Agent({
        rejectUnauthorized: options.rejectUnauthorized,
      })

      // Add the https agent to the configuration.
      config = {
        ...config,
        httpsAgent: httpsAgent,
      }
    }

    // Set the base URL.
    config.baseURL = this.baseUrl

    // Return the configuration.
    return config
  }

  /**
   * Sends an HTTP POST request to the location specified by the URI.
   * @param uri The endpoint to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public post<TRequestData = any, TResponseData = any>(
    uri: string,
    data?: TRequestData,
    config: AxiosRequestConfig<TRequestData> = {},
  ): Promise<AxiosResponse<TResponseData>> {
    return this._client.post<
      TResponseData,
      AxiosResponse<TResponseData>,
      TRequestData
    >(uri, data, config)
  }

  /**
   * Sends an HTTP GET request to the location specified by the URI.
   * @param uri The endpoint to send the request to.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public get<TResponseData = any>(
    uri: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<TResponseData>> {
    return this._client.get<TResponseData>(uri, config)
  }

  /**
   * Sends an HTTP PUT request to the location specified by the URI.
   * @param uri The endpoint to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public put<TRequestData = any, TResponseData = any>(
    uri: string,
    data?: TRequestData,
    config: AxiosRequestConfig<TRequestData> = {},
  ): Promise<AxiosResponse<TResponseData>> {
    return this._client.put<
      TResponseData,
      AxiosResponse<TResponseData>,
      TRequestData
    >(uri, data, config)
  }

  /**
   * Sends an HTTP PATCH request to the location specified by the URI.
   * @param uri The endpoint to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public patch<TRequestData = any, TResponseData = any>(
    uri: string,
    data?: TRequestData,
    config: AxiosRequestConfig<TRequestData> = {},
  ): Promise<AxiosResponse<TResponseData>> {
    return this._client.patch<
      TResponseData,
      AxiosResponse<TResponseData>,
      TRequestData
    >(uri, data, config)
  }

  /**
   * Sends an HTTP DELETE request to the location specified by the URI.
   * @param uri The endpoint to send the request to.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public delete<TResponseData = any>(
    uri: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<TResponseData>> {
    return this._client.delete<TResponseData>(uri, config)
  }

  /**
   * Creates a RESTful API using the configuration from environment variables.
   * @param envConfig The environment configuration to use.
   * @returns A RESTful API instance.
   * @throws If the configuration is invalid.
   */
  public static fromConfig(
    envConfig: Record<string, unknown | undefined>,
  ): RestApi {
    try {
      const apiOptions: TApiOptions = restApiOptionsSchema.parse(envConfig)
      return new RestApi(apiOptions)
    } catch (error: any) {
      throw new Error(`Invalid REST API configuration: ${error.message}`)
    }
  }
}

/**
 * REST API options schema.
 */
const restApiOptionsSchema = apiOptionsSchema.extend({
  /**
   * The protocol to use for the API. This determines the scheme used for
   * the network requests.
   * @see {@link [GeeksforGeeks Reference](https://www.geeksforgeeks.org/computer-networks/web-protocols/)}
   * @default 'http'
   */
  protocol: z.enum(['http', 'https']).optional(),
})

/**
 * The options used to create a RESTful API.
 */
type TApiOptions = z.infer<typeof restApiOptionsSchema>

/**
 * The supported HTTP request methods.
 */
export type TRequestMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
