import axios, { AxiosRequestConfig } from 'axios'
import fs from 'fs'
import https from 'https'
import { Api } from '.'
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
  private _config: AxiosRequestConfig<AnyObject>
  /**
   * The configuration for the request.
   */
  public get config(): AxiosRequestConfig<AnyObject> {
    return this._config
  }

  /**
   * The path to the environment file.
   */
  private environmentFilePath: string = '../environment.json'

  /**
   * @param envVar The variable to use in the `environment.json` file.
   */
  public constructor(envVar: string) {
    super()

    // Initialize options.
    let options: ApiOptions = {}

    // If the environment file exists, read it.
    if (fs.existsSync(this.environmentFilePath)) {
      let environmentData: any = fs.readFileSync(
        this.environmentFilePath,
        'utf8',
      )

      // Parse data to JSON.
      environmentData = JSON.parse(environmentData)

      // If the environment variable exists in the file, load it.
      if (environmentData[envVar]) {
        console.log('Target Environment successfully loaded.')
      }

      // Join environment data with server options.
      options = { ...environmentData[envVar] }
    } else {
      console.error(
        'Environment file not found. Please make sure the file exists and try again.',
      )
    }

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
  private buildBaseUrl(options: ApiOptions): string {
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

    // If there's an address...
    if (options.address) {
      // Use a regular expression to check if the address contains a port.
      let portRegex: RegExp = /.*:([0-9]+).*/
      // If the address contains a port...
      if (portRegex.test(options.address)) {
        // Add the entire address.
        baseUrl += options.address
      }
      // Or if the address contains a port...
      else if (options.port) {
        // Add the address and the port.
        baseUrl += `${options.address}:${options.port}`
      }
      // Otherwise, add the address and the default port.
      else {
        baseUrl += `${options.address}:${defaultPort}`
      }
    }
    // Or if there's a port...
    else if (options.address === undefined && options.port !== undefined) {
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
    options: ApiOptions,
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

    // Return the configuration.
    return config
  }

  /**
   * Sends an HTTP POST request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async post(
    url: string,
    data: AnyObject = {},
    config: AxiosRequestConfig<AnyObject> = {},
  ): Promise<void> {
    try {
      let updatedConfig = { ...this.config, ...config }
      return await axios.post(url, data, updatedConfig)
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Sends an HTTP GET request to the location specified by the url.
   * @param url The url to send the request to.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async get(
    url: string,
    config: AxiosRequestConfig<AnyObject> = {},
  ): Promise<void> {
    try {
      let updatedConfig = { ...this.config, ...config }
      return await axios.get(url, updatedConfig)
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Sends an HTTP PUT request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async put(
    url: string,
    data: AnyObject = {},
    config: AxiosRequestConfig<AnyObject> = {},
  ): Promise<void> {
    try {
      let updatedConfig = { ...this.config, ...config }
      return await axios.put(url, data, updatedConfig)
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Sends an HTTP PATCH request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async patch(
    url: string,
    data: AnyObject = {},
    config: AxiosRequestConfig<AnyObject> = {},
  ): Promise<void> {
    try {
      let updatedConfig = { ...this.config, ...config }
      return await axios.patch(url, data, updatedConfig)
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Sends an HTTP DELETE request to the location specified by the url.
   * @param url The url to send the request to.
   * @param config The configuration for the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async delete(
    url: string,
    config: AxiosRequestConfig<AnyObject> = {},
  ): Promise<void> {
    try {
      let updatedConfig = { ...this.config, ...config }
      return await axios.delete(url, updatedConfig)
    } catch (error: any) {
      throw error
    }
  }
}

/**
 * The options used to create a RESTful API.
 */
type ApiOptions = {
  /**
   * The protocol to use for the API. This determines the scheme used for
   * the network requests.
   * @note 'http' stands for HyperText Transfer Protocol, which is used for
   * unsecured communication over a network.
   * @note 'https' stands for HyperText Transfer Protocol Secure, which is
   * the secure version of HTTP, providing encrypted communication
   * and secure identification of a network web server.
   * @default 'http'
   */
  protocol?: 'http' | 'https'
  /**
   * The address to use for the API. It specifies the location of the server
   * to which requests will be sent.
   * @note This can be a domain name (e.g., 'example.com') or an IP address (e.g., '192.168.1.1').
   */
  address?: string
  /**
   * The port to use for the API. It specifies the port number on the server
   * to which requests will be sent.
   * @note Ports are used to differentiate between multiple network services
   * running on the same machine.
   * @default 80
   */
  port?: number | string
  /**
   * The username for basic authentication.
   * This is added to the request headers and is used to authenticate the
   * user making the request in conjunction with the password.
   * @default undefined
   */
  username?: string
  /**
   * The password for basic authentication.
   * This is used in conjunction with the username to authenticate the user making the request.
   * @default undefined
   */
  password?: string
  /**
   * The API key to use for authentication.
   * This is a token that is used to authenticate the user making the request.
   * @default undefined
   */
  apiKey?: string
  /**
   * Controls whether TLS client verifies the server's certificate against
   * trusted Certificate Authorities (CAs).
   * @note If true, the server will reject any connection which is not authorized
   * with the trusted Certificate Authorities (CAs).
   * @note If false, the server will accept any certificate, even if it is invalid.
   * @default true
   */
  rejectUnauthorized?: boolean
}

/**
 * The supported HTTP request methods.
 */
export type TRequestMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
