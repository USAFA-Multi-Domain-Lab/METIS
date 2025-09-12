import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import https from 'https'
import BooleanToolbox from 'metis/toolbox/booleans'
import z from 'zod'
import { Api, apiOptionsSchema } from '.'
import { AnyObject } from '../toolbox/objects'

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
   * The configuration for the request.
   */
  private _config: AxiosRequestConfig<any>
  /**
   * The configuration for the request.
   */
  public get config(): AxiosRequestConfig<any> {
    return this._config
  }

  /**
   * @param options Used to configure how the API
   * is accessed.
   */
  public constructor(options: TApiOptions = {}) {
    super()

    // Build the base URL.
    this._baseUrl = this.buildBaseUrl(options)

    // Build the request configuration.
    this._config = this.buildRequestConfig(options)
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
  ): AxiosRequestConfig<AnyObject> {
    // Initialize the configuration.
    let config: AxiosRequestConfig<AnyObject> = {}

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

    // Basic authentication.
    if (options.username && options.password) {
      config = {
        ...config,
        auth: {
          username: options.username,
          password: options.password,
        },
      }
    }

    // API key authentication.
    if (options.apiKey) {
      config = {
        ...config,
        headers: {
          'api-key': options.apiKey,
        },
      }
    }

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
    return axios.post<
      TResponseData,
      AxiosResponse<TResponseData>,
      TRequestData
    >(uri, data, { ...this.config, ...config })
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
    return axios.get<TResponseData>(uri, {
      ...this.config,
      ...config,
    })
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
    return axios.put<TResponseData, AxiosResponse<TResponseData>, TRequestData>(
      uri,
      data,
      {
        ...this.config,
        ...config,
      },
    )
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
    return axios.patch<
      TResponseData,
      AxiosResponse<TResponseData>,
      TRequestData
    >(uri, data, {
      ...this.config,
      ...config,
    })
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
    return axios.delete<TResponseData>(uri, {
      ...this.config,
      ...config,
    })
  }

  /**
   * Creates a RESTful API using the configuration from environment variables.
   * @param envConfig The environment configuration to use.
   * @returns A RESTful API instance.
   * @throws If the configuration is invalid.
   * @example
   * ```typescript
   * import { RestApi } from './library/api/rest-api'
   * import { loadConfig } from './library/config'
   * const api = RestApi.fromConfig(loadConfig())
   * ```
   */
  public static fromConfig(
    envConfig: Record<string, string | undefined>,
  ): RestApi {
    try {
      let rejectUnauthorized: boolean | undefined = undefined
      if (envConfig.rejectUnauthorized !== undefined) {
        rejectUnauthorized = BooleanToolbox.parse(envConfig.rejectUnauthorized)
      }
      const apiOptions: TApiOptions = restApiOptionsSchema.parse({
        ...envConfig,
        rejectUnauthorized,
      })
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
   * The port to use for the API. It specifies the port number on the server
   * to which requests will be sent.
   * @note Ports are used to differentiate between multiple network services
   * running on the same machine.
   * @default 80
   */
  port: z
    .union([z.number().int().min(1).max(65535), z.string().regex(/^\d+$/)])
    .optional(),
  /**
   * The username for basic authentication.
   * This is added to the request headers and is used to authenticate the
   * user making the request in conjunction with the password.
   * @default undefined
   */
  username: z.string().optional(),
  /**
   * The password for basic authentication.
   * This is used in conjunction with the username to authenticate the user making the request.
   * @default undefined
   */
  password: z.string().optional(),
  /**
   * The API key to use for authentication.
   * This is a token that is used to authenticate the user making the request.
   * @default undefined
   */
  apiKey: z.string().optional(),
  /**
   * Controls whether TLS client verifies the server's certificate against
   * trusted Certificate Authorities (CAs).
   * @note If true, the server will reject any connection which is not authorized
   * with the trusted Certificate Authorities (CAs).
   * @note If false, the server will accept any certificate, even if it is invalid.
   * @default true
   */
  rejectUnauthorized: z.boolean().optional(),
})

/**
 * The options used to create a RESTful API.
 */
type TApiOptions = z.infer<typeof restApiOptionsSchema>

/**
 * The supported HTTP request methods.
 */
export type TRequestMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
