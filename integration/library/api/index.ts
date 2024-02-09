import axios, { AxiosRequestConfig } from 'axios'
import { AnyObject } from '../toolbox/objects'
import https from 'https'

/**
 * The Api class is used to make HTTP requests to target environments.
 */
export class Api {
  // Inherited
  private _baseUrl: ApiOptions['baseUrl']
  /**
   * The base URL where the API can be reached at.
   */
  public get baseURL(): ApiOptions['baseUrl'] {
    return this._baseUrl
  }

  // Inherited
  private _apiKey: ApiOptions['apiKey']
  /**
   * The API key used to authenticate a request.
   */
  public get apiKey(): ApiOptions['apiKey'] {
    return this._apiKey
  }

  // Inherited
  private _config: ApiOptions['config']
  /**
   * The configuration for the request.
   */
  public get config(): ApiOptions['config'] {
    return this._config
  }

  private _allowHttp: ApiOptions['allowHttp']
  /**
   * Whether or not to allow HTTP requests.
   */
  public get allowHttp(): ApiOptions['allowHttp'] {
    return this._allowHttp
  }

  /**
   * @param options The options used to create an API.
   * @param options.baseUrl The base URL where the API can be reached at.
   * @param options.apiKey The API key used to authenticate a request.
   * @param options.config The configuration for the request.
   * @param options.allowHttp Whether or not to allow HTTP requests.
   */
  public constructor(options: ApiOptions = {}) {
    this._baseUrl = options.baseUrl
    this._apiKey = options.apiKey
    this._config = options.config
    this._allowHttp = options.allowHttp

    if (this._allowHttp !== undefined) {
      // Allows http requests to be made to the API.
      const httpsAgent = new https.Agent({
        rejectUnauthorized: this._allowHttp,
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
   * @param config The configuration for the request.
   */
  public async post(
    url: string,
    data?: AnyObject | undefined,
    config?: AxiosRequestConfig<AnyObject> | undefined,
  ): Promise<void> {
    try {
      return await axios.post(url, data, config)
    } catch (error: any) {
      throw new Error(error)
    }
  }

  /**
   * Sends an HTTP GET request to the location specified by the url.
   * @param url The url to send the request to.
   * @param config The configuration for the request.
   */
  public async get(
    url: string,
    config?: AxiosRequestConfig<AnyObject> | undefined,
  ): Promise<void> {
    try {
      return await axios.get(url, config)
    } catch (error: any) {
      throw new Error(error)
    }
  }

  /**
   * Sends an HTTP PUT request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   */
  public async put(
    url: string,
    data?: AnyObject | undefined,
    config?: AxiosRequestConfig<AnyObject> | undefined,
  ): Promise<void> {
    try {
      return await axios.put(url, data, config)
    } catch (error: any) {
      throw new Error(error)
    }
  }

  /**
   * Sends an HTTP PATCH request to the location specified by the url.
   * @param url The url to send the request to.
   * @param data The data to send with the request.
   * @param config The configuration for the request.
   */
  public async patch(
    url: string,
    data?: AnyObject | undefined,
    config?: AxiosRequestConfig<AnyObject> | undefined,
  ): Promise<void> {
    try {
      return await axios.patch(url, data, config)
    } catch (error: any) {
      throw new Error(error)
    }
  }

  /**
   * Sends an HTTP DELETE request to the location specified by the url.
   * @param url The url to send the request to.
   * @param config The configuration for the request.
   */
  public async delete(
    url: string,
    config?: AxiosRequestConfig<AnyObject> | undefined,
  ): Promise<void> {
    try {
      return await axios.delete(url, config)
    } catch (error: any) {
      throw new Error(error)
    }
  }
}

/**
 * The options used to create an API.
 */
type ApiOptions = {
  /**
   * The base URL where the API can be reached at.
   */
  baseUrl?: string
  /**
   * The API key used to authenticate a request.
   */
  apiKey?: string
  /**
   * The configuration for the request.
   */
  config?: AxiosRequestConfig<AnyObject> | undefined
  /**
   * Whether or not to allow HTTP requests.
   */
  allowHttp?: boolean
}

/**
 * The supported HTTP request methods.
 */
export type TRequestMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
