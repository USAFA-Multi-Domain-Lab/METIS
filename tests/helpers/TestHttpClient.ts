import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'

/**
 * Lightweight HTTP client for tests that persists cookies between requests.
 * @note Uses axios only; no additional test HTTP dependency.
 */
export class TestHttpClient {
  private client: AxiosInstance
  private cookies: string[] = []

  /**
   * @param baseUrl Base URL of the running METIS server (e.g., http://127.0.0.1:PORT)
   */
  public constructor(baseUrl: string) {
    this.client = axios.create({ baseURL: baseUrl, validateStatus: () => true })
  }

  /**
   * Capture Set-Cookie headers and store them as key=value pairs for reuse.
   */
  private captureCookies(setCookieHeader: string[] | undefined): void {
    if (!setCookieHeader) return

    // Keep only the key=value pairs and let later values overwrite earlier ones.
    let cookieMap = new Map<string, string>()
    for (let cookie of [...this.cookies, ...setCookieHeader]) {
      let [name, ...rest] = cookie.split(';')[0].split('=')
      if (!name || rest.length === 0) continue
      cookieMap.set(name, rest.join('='))
    }

    this.cookies = Array.from(cookieMap.entries()).map(
      ([name, value]) => `${name}=${value}`,
    )
  }

  /**
   * Apply stored cookies to the outgoing request headers.
   */
  private withCookies(config: AxiosRequestConfig): AxiosRequestConfig {
    let headers = { ...(config.headers ?? {}) }
    if (this.cookies.length > 0) {
      headers.Cookie = this.cookies.join('; ')
    }
    return { ...config, headers }
  }

  /**
   * Issue a request while maintaining cookie state across calls.
   */
  public async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    let response = await this.client.request<T>(this.withCookies(config))
    this.captureCookies(response.headers['set-cookie'])
    return response
  }

  /**
   * Convenience GET wrapper that keeps cookies.
   */
  public get<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'get', url })
  }

  /**
   * Convenience POST wrapper that keeps cookies.
   */
  public post<T = any>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'post', url, data })
  }

  /**
   * Convenience PUT wrapper that keeps cookies.
   */
  public put<T = any>(
    url: string,
    data?: any,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'put', url, data })
  }

  /**
   * Convenience DELETE wrapper that keeps cookies.
   */
  public delete<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'delete', url })
  }

  /**
   * Clear any captured cookies (useful between tests).
   */
  public resetCookies(): void {
    this.cookies = []
  }
}
