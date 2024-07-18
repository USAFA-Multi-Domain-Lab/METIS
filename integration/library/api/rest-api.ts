import axios, { AxiosRequestConfig } from 'axios'
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
  private _baseUrl: ApiOptions['baseUrl']
  /**
   * The base URL where the API can be reached at.
   */
  public get baseURL(): ApiOptions['baseUrl'] {
    return this._baseUrl
  }

  /**
   * The configuration for the request.
   */
  private _config: ApiOptions['config']
  /**
   * The configuration for the request.
   */
  public get config(): ApiOptions['config'] {
    return this._config
  }

  /**
   * If true the server will reject any connection which is not authorized
   * with the list of supplied CAs. This option only has an effect if
   * requestCert is true.
   * @default true
   */
  private _rejectUnauthorized: ApiOptions['rejectUnauthorized']
  /**
   * If true the server will reject any connection which is not authorized
   * with the list of supplied CAs. This option only has an effect if
   * requestCert is true.
   * @default true
   */
  public get rejectUnauthorized(): ApiOptions['rejectUnauthorized'] {
    return this._rejectUnauthorized
  }

  public constructor({ baseUrl, config, rejectUnauthorized }: ApiOptions = {}) {
    super()

    this._baseUrl = baseUrl
    this._config = config
    this._rejectUnauthorized = rejectUnauthorized

    if (this._rejectUnauthorized !== undefined) {
      // Determines if the server will reject any
      // connection which is not authorized with
      // the list of supplied CAs.
      const httpsAgent = new https.Agent({
        rejectUnauthorized: this._rejectUnauthorized,
      })
      // Add the https agent to the configuration.
      this._config = {
        ...this._config,
        httpsAgent: httpsAgent,
      }
    }
  }

  /**
   * Sends an HTTP POST request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async post(url: string, data: AnyObject = {}): Promise<void> {
    return await axios.post(url, data, this.config)
  }

  /**
   * Sends an HTTP GET request to the location specified by the url.
   * @param url The url to send the request to.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async get(url: string): Promise<void> {
    return await axios.get(url, this.config)
  }

  /**
   * Sends an HTTP PUT request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async put(url: string, data: AnyObject = {}): Promise<void> {
    return await axios.put(url, data, this.config)
  }

  /**
   * Sends an HTTP PATCH request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async patch(url: string, data: AnyObject = {}): Promise<void> {
    return await axios.patch(url, data, this.config)
  }

  /**
   * Sends an HTTP DELETE request to the location specified by the url.
   * @param url The url to send the request to.
   * @resolves If a successful response (200) is received.
   * @rejects If an error occurs.
   */
  public async delete(url: string): Promise<void> {
    return await axios.delete(url, this.config)
  }
}

/**
 * The options used to create a RESTful API.
 */
type ApiOptions = {
  /**
   * The base URL where the API can be reached at.
   */
  baseUrl?: string
  /**
   * The configuration for the request.
   */
  config?: AxiosRequestConfig<AnyObject> | undefined
  /**
   * If true the server will reject any connection which is not authorized
   * with the list of supplied CAs. This option only has an effect if
   * requestCert is true.
   * @default true
   */
  rejectUnauthorized?: boolean
}

/**
 * The supported HTTP request methods.
 */
export type TRequestMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
