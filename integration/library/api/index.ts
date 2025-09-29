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
   * @see {@link [GeeksforGeeks Reference](https://www.geeksforgeeks.org/computer-networks/web-protocols/)}
   * @default 'http'
   */
  protocol: z.enum(['http', 'https', 'ws', 'wss']).optional(),
  /**
   * The host to use for the API. It specifies the location of the server
   * to which requests will be sent.
   * @note This can be a domain name (e.g., 'example.com') or an IP address (e.g., '192.168.1.1').
   */
  host: z.string().optional(),
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
 * Represents validated API options.
 */
export type TApiOptions = z.infer<typeof apiOptionsSchema>
