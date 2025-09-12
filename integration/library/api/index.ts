import { z } from 'zod'

/**
 * Base class for all API classes.
 */
export abstract class Api {}

/**
 * Base API options schema.
 */
export const apiOptionsSchema = z.object({
  /**
   * The protocol to use for the API. This determines the scheme used for
   * the network requests.
   * @see {@link [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview#http_vs_https)}
   * @default 'http'
   */
  protocol: z.enum(['http', 'https']).optional(),
  /**
   * The host to use for the API. It specifies the location of the server
   * to which requests will be sent.
   * @note This can be a domain name (e.g., 'example.com') or an IP address (e.g., '192.168.1.1').
   */
  host: z.string().optional(),
})

/**
 * Represents validated API options.
 */
export type TApiOptions = z.infer<typeof apiOptionsSchema>
