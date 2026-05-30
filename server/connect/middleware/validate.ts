import type {
  TClientEvents,
  TClientMethod,
  TGenericClientMethod,
  TRequestMethod,
} from '@shared/connect'
import { SESSION_PANEL_ALERTS_NO_MESSENGER } from '@shared/connect'
import { ChatMessage } from '@shared/sessions/chat/ChatMessage'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import type { TSessionAccessibility } from '@shared/sessions/MissionSession'
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
            'testing',
          ] as TNonEmptyArray<TSessionAccessibility>)
          .optional(),
        infiniteResources: zod.boolean().optional(),
        disabledTargetEnvs: zod.array(zod.string()).optional(),
        targetEnvConfigs: zod.record(zod.string(), zod.string()).optional(),
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
  'request-send-chat-message': zodRequestEvent(
    'request-send-chat-message',
    zod.object({
      channelId: zod.string(),
      message: zod
        .string()
        .min(1)
        // Strip HTML tags before counting characters so the limit applies to
        // the visible text content, not the raw markup sent by the rich-text editor.
        .refine(
          (html) =>
            html.replace(/<[^>]*>/g, '').length <= ChatMessage.MAX_CHARS,
          {
            message: `Message cannot exceed ${ChatMessage.MAX_CHARS} characters`,
          },
        ),
    }),
  ),
  'request-acknowledge-node-alert': zodRequestEvent(
    'request-acknowledge-node-alert',
    zod.object({
      alertId: zod.string(),
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
  'acknowledge-session-panel-alert': zodGenericEvent(
    'acknowledge-session-panel-alert',
    zod.union([
      zod.object({ panel: zod.enum(SESSION_PANEL_ALERTS_NO_MESSENGER) }),
      zod.object({ panel: zod.literal('Messenger'), channelId: zod.string() }),
    ]),
  ),
  'fetch-session-panel-alerts': zodGenericEvent(
    'fetch-session-panel-alerts',
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
    data: zod.object({}).catchall(zod.unknown()),
    requestId: zod.string().optional(),
  })
  .catchall(zod.unknown())

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

// /**
//  * Converts a regular interface to a Zod object type.
//  */
// export type TZodify<T extends object> = ZodObject<
//   Required<{
//     [K in keyof T]: Required<T>[K] extends object
//       ? {} extends Pick<T, K>
//         ? ZodOptional<TZodify<Required<T>[K]>>
//         : TZodify<Required<T>[K]>
//       : {} extends Pick<T, K>
//       ? ZodOptional<ZodType<T[K]>>
//       : ZodType<T[K]>
//   }>
// >

/**
 * Converts a regular interface to a Zod object type.
 */
export type TZodify<T extends object> = ZodObject<
  Required<{
    [K in keyof T]: Required<T>[K] extends Array<infer U>
      ? {} extends Pick<T, K>
        ? ZodOptional<ZodType<Required<T>[K]>>
        : ZodType<Required<T>[K]>
      : Required<T>[K] extends Record<string, any>
        ? {} extends Pick<T, K>
          ? ZodOptional<ZodType<Required<T>[K]>>
          : ZodType<Required<T>[K]>
        : Required<T>[K] extends object
          ? {} extends Pick<T, K>
            ? ZodOptional<TZodify<Required<T>[K]>>
            : TZodify<Required<T>[K]>
          : {} extends Pick<T, K>
            ? ZodOptional<ZodType<T[K]>>
            : ZodType<T[K]>
  }>
>
