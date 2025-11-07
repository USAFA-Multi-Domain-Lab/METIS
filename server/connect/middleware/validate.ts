import type {
  TClientEvents,
  TClientMethod,
  TGenericClientMethod,
  TRequestMethod,
} from '@shared/connect'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionAccessibility } from '@shared/sessions/Session'
import type { TNonEmptyArray } from '@shared/toolbox/arrays/ArrayToolbox'
import type { ZodObject, ZodOptional, ZodType } from 'zod'
import { z as zod } from 'zod'

/* -- ZOD-SCHEMAS -- */

function zodGenericEvent<TMethod extends TGenericClientMethod>(
  method: TMethod,
  zodData: TClientEventSchema<TMethod>['shape']['data'],
) {
  return zod.object({
    method: zod.literal(method),
    data: zodData,
  })
}

/**
 * Helps generate a Zod schema for a WS request event.
 * @param method The request method for the event.
 * @param zodData The Zod schema for the request data.
 * @returns The Zod schema for the request event.
 */
function zodRequestEvent<TMethod extends TRequestMethod>(
  method: TMethod,
  zodData: TClientEventSchema<TMethod>['shape']['data'],
) {
  return zod.object({
    method: zod.literal(method),
    data: zodData,
    requestId: zod.string(),
  })
}

/**
 * All Zod schemas for client emitted web-socket events.
 */
export const clientEventSchemas: TClientEventSchemas = {
  'close': zodGenericEvent('close', zod.object({})),
  'error': zod.object({
    method: zod.literal('error'),
    message: zod.string(),
    code: zod.number(),
    data: zod.object({}),
  }),
  'request-start-session': zodRequestEvent(
    'request-start-session',
    zod.object({}),
  ),
  'request-end-session': zodRequestEvent('request-end-session', zod.object({})),
  'request-reset-session': zodRequestEvent(
    'request-reset-session',
    zod.object({}),
  ),
  'request-config-update': zodRequestEvent(
    'request-config-update',
    zod.object({
      config: zod.object({
        name: zod.string().optional(),
        accessibility: zod
          .enum([
            'public',
            'id-required',
            'invite-only',
          ] as TNonEmptyArray<TSessionAccessibility>)
          .optional(),
        infiniteResources: zod.boolean().optional(),
        effectsEnabled: zod.boolean().optional(),
      }),
    }),
  ),
  'request-kick': zodRequestEvent(
    'request-kick',
    zod.object({
      memberId: zod.string(),
    }),
  ),
  'request-ban': zodRequestEvent(
    'request-ban',
    zod.object({
      memberId: zod.string(),
    }),
  ),
  'request-assign-force': zodRequestEvent(
    'request-assign-force',
    zod.object({
      memberId: zod.string(),
      forceId: zod.string().nullable(),
    }),
  ),
  'request-assign-role': zodRequestEvent(
    'request-assign-role',
    zod.object({
      memberId: zod.string(),
      roleId: zod.enum(MemberRole.AVAILABLE_ROLE_IDS),
    }),
  ),
  'request-open-node': zodRequestEvent(
    'request-open-node',
    zod.object({
      nodeId: zod.string(),
    }),
  ),
  'request-execute-action': zodRequestEvent(
    'request-execute-action',
    zod.object({
      actionId: zod.string(),
      cheats: zod
        .object({
          zeroCost: zod.boolean().optional(),
          instantaneous: zod.boolean().optional(),
          guaranteedSuccess: zod.boolean().optional(),
        })
        .optional(),
    }),
  ),
  'request-send-output': zodRequestEvent(
    'request-send-output',
    zod.object({
      key: zod.literal('pre-execution'),
      nodeId: zod.string(),
    }),
  ),
  'request-current-session': zodRequestEvent(
    'request-current-session',
    zod.object({}),
  ),
  'request-join-session': zodRequestEvent(
    'request-join-session',
    zod.object({
      sessionId: zod.string(),
    }),
  ),
  'request-quit-session': zodRequestEvent(
    'request-quit-session',
    zod.object({}),
  ),
} as const

/**
 * A loose Zod schema for client events to confirm
 * that JSON payload is at least an object containing
 * a valid method and some data.
 * @note This is essentially used to confirm that the client is
 * at least speaking the same "language" as the server.
 */
export const looseEventSchema = zod
  .object({
    method: zod.enum(
      Object.keys(clientEventSchemas) as TNonEmptyArray<TClientMethod>,
    ),
    data: zod.object({}).passthrough(),
    requestId: zod.string().optional(),
  })
  .loose()

/* -- TYPES -- */

/**
 * Type that defines a Zod schemas for a client event.
 */
type TClientEventSchema<TEvent extends keyof TClientEvents> = TZodify<
  TClientEvents[TEvent]
>

/**
 * Type that defines all Zod schemas for client events.
 */
type TClientEventSchemas = {
  [key in keyof TClientEvents]: TClientEventSchema<key>
}

/**
 * Converts a regular interface to a Zod object type.
 */
export type TZodify<T extends object> = ZodObject<
  Required<{
    [K in keyof T]: Required<T>[K] extends object
      ? {} extends Pick<T, K>
        ? ZodOptional<TZodify<Required<T>[K]>>
        : TZodify<Required<T>[K]>
      : {} extends Pick<T, K>
      ? ZodOptional<ZodType<T[K]>>
      : ZodType<T[K]>
  }>
>
