import type {
  TForceHostedLookUpData,
  TNodeHostedLookUpData,
} from '@shared/missions/Mission'
import type { TNodeAlertSeverityLevel } from '@shared/missions/nodes/NodeAlert'
import type { TSessionRealmJson } from '@shared/sessions/SessionRealm'
import type { TEnvironmentTaskJson } from '@shared/target-environments/TargetEnvironmentTask'
import type { MetisComponent } from '../MetisComponent'
import type {
  TActionExecutionJson,
  TExecutionCheats,
} from '../missions/actions/ActionExecution'
import type { TExecutionOutcomeJson } from '../missions/actions/ExecutionOutcome'
import type { TActionModifier } from '../missions/actions/MissionAction'
import type { TMissionFileJson } from '../missions/files/MissionFile'
import type { TOutputJson } from '../missions/forces/MissionOutput'
import type { TResourcePoolJson } from '../missions/forces/ResourcePool'
import type { TMissionNodeJson } from '../missions/nodes/MissionNode'
import type { TMissionPrototypeJson } from '../missions/nodes/MissionPrototype'
import type { TChatChannelJson } from '../sessions/chat/ChatChannel'
import type { TChatMessageJson } from '../sessions/chat/ChatMessage'
import type { MemberRole } from '../sessions/members/MemberRole'
import type {
  SessionMember,
  TSessionMemberJson,
} from '../sessions/members/SessionMember'
import type { TSessionConfig, TSessionJson } from '../sessions/MissionSession'
import type { TAnyObject } from '../toolbox/objects/ObjectToolbox'

/**
 * Represents the status of a server connection.
 */
export type TServerConnectionStatus = 'open' | 'closed' | 'connecting'

/**
 * Represents an event emitted by the client or server over a web socket connection.
 */
export interface TConnectEvent<TMethod extends string, TData extends {} = {}> {
  method: TMethod
  data: TData
}

/**
 * Represents an event emitted by the client that expects a response by the server.
 */
export interface TRequestEvent<
  TMethod extends string,
  TData extends {} = {},
> extends TConnectEvent<TMethod, TData> {
  requestId: string
}

/**
 * The request that triggered this response,
 * stored in the response for reference by
 * the client.
 */
export type TRequestOfResponse = {
  /**
   * The request event.
   */
  event: TRequestEvent<TClientMethod>
  /**
   * The ID of the client that made the request.
   */
  requesterId: string
  /**
   * Whether the request has been fulfilled.
   */
  fulfilled: boolean
}

/**
 * Represents an event emitted by the server in response to a request by the client.
 */
export interface TResponseEvent<
  TMethod extends string,
  TData extends {},
  TReqEvent extends TRequestEvent<string, {}>,
> extends TConnectEvent<TMethod, TData> {
  request: TRequestOfResponse
}

/**
 * Represents any event emitted by the server in response to a request by the client.
 */
export type TAnyResponseEvent = TResponseEvent<
  string,
  {},
  TRequestEvent<string, {}>
>

/**
 * Represents a type of generic event that occurs on the client that is sent to the server over a web
 * socket.
 */
export type TGenericClientMethod = keyof TGenericClientEvents

/**
 * Represents a type of event that occurs on the client that is sent to the server over a web
 * socket as a request, expecting a response.
 */
export type TRequestMethod = keyof TRequestEvents

/**
 * Represents the type of any event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientMethod = keyof TClientEvents

/**
 * Represents an event that occurs on the client that is sent to the server over a web socket.
 */
export type TClientEvent = TClientEvents[TClientMethod]

/**
 * Represents a type of generic event that occurs on the server that is sent to the client over a web socket.
 */
export type TGenericServerMethod = keyof TGenericServerEvents

/**
 * Represents a type of event that occurs on the server that is sent to the client over a web socket as a response
 * to a request.
 */
export type TResponseMethod = keyof TResponseEvents

/**
 * Represents a type of event that occurs on the server that is sent to the client over a web socket.
 */
export type TServerMethod = keyof TServerEvents

/**
 * Represents an event that occurs on the server that is sent to the client over a web socket.
 */
export type TServerEvent = TServerEvents[TServerMethod]

/**
 * The data emitted when one or more alerts are added to nodes.
 */
export type TNodeAlertAddedData = {
  /**
   * The alert message, shared across all affected nodes.
   */
  message: string
  /**
   * The severity level, shared across all affected nodes.
   */
  severityLevel: TNodeAlertSeverityLevel
  /**
   * The node IDs paired with the IDs of their newly created alerts.
   */
  ids: Array<{
    /**
     * The ID of the node to which the alert was added.
     */
    nodeId: string
    /**
     * The ID of the alert that was added to the node.
     */
    alertId: string
  }>
}

/**
 * The data emitted when the process time of one or more actions is updated.
 */
export type TActionProcessTimeUpdatedData = {
  /**
   * Data that can be used to quickly look up and find the affected
   * actions within the mission.
   */
  lookUpData: Array<TNodeHostedLookUpData>
  /**
   * The modifier to apply to the actions.
   */
  modifier: TActionModifier
}

/**
 * The data emitted when the success chance of one or more actions is updated.
 */
export type TActionSuccessChanceUpdatedData = {
  /**
   * Data that can be used to quickly look up and find the affected
   * actions within the mission.
   */
  lookUpData: Array<TNodeHostedLookUpData>
  /**
   * The modifier to apply to the actions.
   */
  modifier: TActionModifier
}

/**
 * The data emitted when the resource cost of one or more actions is updated.
 */
export type TActionResourceCostUpdatedData = {
  /**
   * Data that can be used to quickly look up and find the affected
   * actions within the mission.
   */
  lookUpData: Array<TNodeHostedLookUpData>
  /**
   * The modifier to apply to the actions.
   */
  modifier: TActionModifier
}

/**
 * The data necessary to send a message to the output panel.
 */
type TOutputData = [
  {
    /**
     * Used to identify the data structure.
     * @option `"pre-execution":` The data needed to send a node's pre-execution message to the output panel.
     */
    key: 'pre-execution'
    /**
     * The ID of the node with the pre-execution message to send.
     */
    nodeId: string
  },
]

/**
 * The data needed to send a message to the output panel.
 */
export type TOutputDatum = TOutputData[number]

/**
 * The data needed to open or close a node, determining if its descendants are revealed.
 */
export type TNodeOpenStateData = TForceHostedLookUpData & {
  /**
   * Whether the node is open or closed.
   */
  opened: boolean
  /**
   * The structure of the nodes that were revealed as a result of opening the node.
   */
  structure: TAnyObject
  /**
   * The nodes that were revealed as a result of opening the node.
   */
  revealedDescendants: TMissionNodeJson[]
  /**
   * The prototypes of the nodes that were revealed as a result of opening the node.
   */
  revealedDescendantPrototypes: TMissionPrototypeJson[]
}

/**
 * The data emitted when the open/closed state of one or more nodes is updated in batch.
 */
export type TNodeOpenStateBatchData = {
  /**
   * Whether the nodes are opened or closed.
   */
  opened: boolean
  /**
   * Per-node data for each node whose open state changed.
   */
  nodes: Array<Omit<TNodeOpenStateData, 'opened'>>
}

/**
 * The data emitted when the block status of one or more nodes is updated.
 */
export type TNodeBlockStatusData = {
  /**
   * Data that can be used to quickly look up and find the affected
   * nodes within the mission.
   */
  lookUpData: Array<TForceHostedLookUpData>
  /**
   * Whether the nodes are now blocked or unblocked.
   */
  blocked: boolean
}

/**
 * The data emitted when one or more files are granted access to one or more forces.
 */
/**
 * The data emitted when the access to a file is granted or revoked for a force.
 */
export type TFileAccessData = {
  /**
   * Whether access was granted or revoked.
   */
  granted: boolean
  /**
   * The IDs of the forces affected.
   */
  forceIds: string[]
  /**
   * The serialized data for each file affected.
   */
  files: TMissionFileJson[]
}

/**
 * The data emitted when a resource pool is modified.
 */
export type TResourcePoolUpdatedData = {
  /**
   * Data that can be used to quickly look up and find the affected
   * resource pools within the mission.
   */
  lookUpData: Array<TForceHostedLookUpData>
  /**
   * The operand used to modify the balance of the resource pools.
   */
  operand: number
}

/*
 * The session panels that can carry an alert, excluding Messenger (which
 * requires a channel ID to acknowledge).
 */
export const SESSION_PANEL_ALERTS_NO_MESSENGER = [
  'Output',
  'Files',
  'Members',
] as const

/**
 * All session panels that can carry an alert.
 */
const SESSION_PANEL_ALERTS = [
  ...SESSION_PANEL_ALERTS_NO_MESSENGER,
  'Messenger',
] as const

/**
 * The session panels that can carry an alert.
 */
export type TSessionPanelAlert = (typeof SESSION_PANEL_ALERTS)[number]

/**
 * General WS events emitted by the server, or caused due to a change in the connection with the server.
 */
export type TGenericServerEvents = {
  /**
   * Occurs when any activity occurs with the connection to the server.
   * @note Includes emitted events to and from the server, connection changes, and errors.
   * @note This will be the last in the call chain, and will be handled after all other event types
   * by the connection.
   */
  'activity': TConnectEvent<'activity'>
  /**
   * Occurs when the client is successful in its initial connection to the server.
   */
  'connection-success': TConnectEvent<'connection-success'>
  /**
   * Occurs when the connection with the server is closed purposefully.
   */
  'connection-closed': TConnectEvent<'connection-closed'>
  /**
   * Occurs when the client loses connection to the server unexpectedly.
   */
  'connection-loss': TConnectEvent<'connection-loss'>
  /**
   * Occurs when the client fails to connect to the server.
   */
  'connection-failure': TConnectEvent<'connection-failure'>
  /**
   * Occurs when the client successfully reconnects to the server.
   */
  'reconnection-success': TConnectEvent<'reconnection-success'>
  /**
   * Occurs when the client fails to reconnect to the server.
   */
  'reconnection-failure': TConnectEvent<'reconnection-failure'>
  /**
   * Occurs during any change in the connection status of the client.
   */
  'connection-change': TConnectEvent<
    'connection-change',
    {
      /**
       * The new status of the connection, after the change.
       */
      status: TServerConnectionStatus
    }
  >
  /**
   * Occurs for a member who was dismissed from the session,
   * due to not being assigned to a force when the session starts.
   */
  'dismissed': TConnectEvent<'dismissed', {}>
  /**
   * Occurs when a user joins or quits the session.
   */
  'session-members-updated': TConnectEvent<
    'session-members-updated',
    {
      /**
       * The updated list of members in the session.
       */
      members: TSessionMemberJson[]
    }
  >
  /**
   * Occurs when the open state of one or more nodes is updated.
   */
  'node-open-state-updated': TConnectEvent<
    'node-open-state-updated',
    TNodeOpenStateBatchData
  >
  /**
   * Occurs when the block status of one or more nodes is updated.
   */
  'node-block-status-updated': TConnectEvent<
    'node-block-status-updated',
    TNodeBlockStatusData
  >
  /**
   * Occurs when the access to a file is granted or revoked for a force.
   */
  'file-access-updated': TConnectEvent<'file-access-updated', TFileAccessData>
  /**
   * Occurs when a resource pool is modified.
   */
  'resource-pool-updated': TConnectEvent<
    'resource-pool-updated',
    TResourcePoolUpdatedData
  >
  /**
   * Occurs when an alert is added to a node.
   */
  'node-alert-added': TConnectEvent<'node-alert-added', TNodeAlertAddedData>
  /**
   * Occurs when the process time of one or more actions is updated.
   */
  'action-process-time-updated': TConnectEvent<
    'action-process-time-updated',
    TActionProcessTimeUpdatedData
  >
  /**
   * Occurs when the success chance of one or more actions is updated.
   */
  'action-success-chance-updated': TConnectEvent<
    'action-success-chance-updated',
    TActionSuccessChanceUpdatedData
  >
  /**
   * Occurs when the resource cost of one or more actions is updated.
   */
  'action-resource-cost-updated': TConnectEvent<
    'action-resource-cost-updated',
    TActionResourceCostUpdatedData
  >
  /**
   * Occurs when the session has been destroyed while the participant was in it.
   */

  'session-destroyed': TConnectEvent<
    'session-destroyed',
    {
      /**
       * The ID of the session that was destroyed.
       */
      sessionId: string
    }
  >
  /**
   * Occurs when a message is sent to the output panel.
   */
  'send-output': TConnectEvent<
    'send-output',
    {
      /**
       * The message to send to the force's output panel.
       */
      outputData: TOutputJson
    }
  >
  /**
   * Occurs when the client needs to be logged out due to the user account being updated.
   */
  'logout-user-update': TConnectEvent<'logout-user-update', {}>
  /**
   * Occurs when the server intentionally emits an error to client.
   */
  'error': {
    /**
     * The event method (Always "error").
     */
    method: 'error'
    /**
     * The error code (See shared/connect/errors.ts).
     */
    code: number
    /**
     * The message explaining the error.
     */
    message: string
    /**
     * The request that caused the error, if any.
     */
    request?: TRequestOfResponse
  }
  /**
   * Provides feedback to members of a session authorized to view target
   * environment tasks about a single task (a hook or an effect),
   * across the setup, teardown, and live phases.
   * @note Emitted when a task is announced (`queued`), when it begins
   * (`running`), and when it resolves. Recipients reconcile by the
   * task's `_id`, updating an existing entry rather than appending a
   * duplicate.
   */
  'session-task-update': TConnectEvent<
    'session-task-update',
    {
      /**
       * The task that was announced or updated.
       */
      task: TEnvironmentTaskJson
    }
  >
  /**
   * Occurs when a chat message is broadcast to members of a channel.
   */
  'chat-message-received': TConnectEvent<
    'chat-message-received',
    {
      /**
       * The chat message that was received.
       */
      message: TChatMessageJson
    }
  >
  /**
   * Occurs when the server determines that one or more session panel
   * tabs require the member's attention.
   */
  'session-panel-alert': TConnectEvent<
    'session-panel-alert',
    {
      /**
       * The full set of session panels that currently have active alerts
       * for an individual member.
       * @see {@link TSessionPanelAlert}
       */
      panels: TSessionPanelAlert[]
    }
  >
}

/**
 * WS events emitted by the server as a response to a request made by the client.
 */
export type TResponseEvents = {
  /**
   * Occurs when the session is starting (transitionary state).
   */
  'session-starting': TResponseEvent<
    'session-starting',
    {},
    TClientEvents['request-start-session']
  >
  /**
   * Occurs when the session starts while the client is joined.
   */
  'session-started': TResponseEvent<
    'session-started',
    {
      /**
       * The realm the member is subscribed to, containing the filtered
       * mission data they are permitted to see.
       */
      subscribedRealm: TSessionRealmJson
      /**
       * The chat channels available in this session.
       */
      chatChannels: TChatChannelJson[]
    },
    TClientEvents['request-start-session']
  >
  /**
   * Occurs when the session is ending (transitionary state).
   */
  'session-ending': TResponseEvent<
    'session-ending',
    {},
    TClientEvents['request-end-session']
  >
  /**
   * Occurs when the session ends while the client is joined.
   */
  'session-ended': TResponseEvent<
    'session-ended',
    {},
    TClientEvents['request-end-session']
  >
  /**
   * Occurs when the session is resetting (transitionary state).
   */
  'session-resetting': TResponseEvent<
    'session-resetting',
    {},
    TClientEvents['request-reset-session']
  >
  /**
   * Occurs when the session has been reset.
   */
  'session-reset': TResponseEvent<
    'session-reset',
    {
      /**
       * The realm the member is subscribed to, containing the filtered
       * mission data they are permitted to see.
       */
      subscribedRealm: TSessionRealmJson
      /**
       * The chat channels available in this session.
       */
      chatChannels: TChatChannelJson[]
    },
    TClientEvents['request-reset-session']
  >
  /**
   * Occurs when configuration of the session is updated.
   */
  'session-config-updated': TResponseEvent<
    'session-config-updated',
    {
      /**
       * The updated configuration of the session.
       */
      config: TSessionConfig
    },
    TClientEvents['request-config-update']
  >
  /**
   * Occurs for a member who has been kicked from the session.
   */
  'kicked': TResponseEvent<
    'kicked',
    {
      /**
       * The ID of the session from which the member was kicked.
       */
      sessionId: string
      /**
       * The ID of the member who was kicked.
       */
      memberId: string
      /**
       * The ID of the user who was kicked.
       */
      userId: string
    },
    TClientEvents['request-kick']
  >
  /**
   * Occurs for a member who has been banned from the session.
   */
  'banned': TResponseEvent<
    'banned',
    {
      /**
       * The ID of the session from which the member was banned.
       */
      sessionId: string
      /**
       * The ID of the member who was banned.
       */
      memberId: string
      /**
       * The ID of the user who was kicked.
       */
      userId: string
    },
    TClientEvents['request-ban']
  >
  /**
   * Occurs for a member whose ban has been lifted, allowing
   * them to rejoin the session.
   */
  'unbanned': TResponseEvent<
    'unbanned',
    {
      /**
       * The ID of the session for which the member's ban was lifted.
       */
      sessionId: string
      /**
       * The ID of the member whose ban was lifted.
       */
      memberId: string
      /**
       * The ID of the user whose ban was lifted.
       */
      userId: string
    },
    TClientEvents['request-unban']
  >
  /**
   * Occurs when a force assignment change has been made.
   */
  'force-assigned': TResponseEvent<
    'force-assigned',
    {
      /**
       * The ID of the member who was assigned to the force.
       */
      memberId: SessionMember['_id']
      /**
       * The ID of the force to which the member was assigned.
       * @note If `null`, the member is now unassigned from any force.
       */
      forceId: string | null
    },
    TClientEvents['request-assign-force']
  >
  /**
   * Occurs when a role assignment change has been made.
   */
  'role-assigned': TResponseEvent<
    'role-assigned',
    {
      /**
       * The ID of the member who was assigned the role.
       */
      memberId: string
      /**
       * The ID of the role assigned to the member.
       */
      roleId: MemberRole['_id']
    },
    TClientEvents['request-assign-role']
  >
  /**
   * Occurs when a node has been opened on the server.
   */
  'node-opened': TResponseEvent<
    'node-opened',
    TNodeOpenStateData,
    TClientEvents['request-open-node']
  >
  /**
   * Occurs when the execution of an action is initiated on the server.
   */
  'action-execution-initiated': TResponseEvent<
    'action-execution-initiated',
    {
      /**
       * The action that was executed.
       */
      execution: TActionExecutionJson
      /**
       * The resource pool instances of the force after the
       * action's execution costs were deducted.
       */
      resourcePools: TResourcePoolJson[]
    },
    TClientEvents['request-execute-action']
  >
  /**
   * Occurs when the execution of an action has finished on the server.
   */
  'action-execution-completed': TResponseEvent<
    'action-execution-completed',
    {
      /**
       * The outcome of the action being executed.
       */
      outcome: TExecutionOutcomeJson
    } & Partial<TNodeOpenStateData>,
    TClientEvents['request-execute-action']
  >
  /**
   * Occurs when the client has successfully sent a message to the output panel.
   */
  'output-sent': TResponseEvent<
    'output-sent',
    TOutputDatum,
    TClientEvents['request-send-output']
  >
  /**
   * Occurs when the client has successfully sent a chat message.
   */
  'chat-message-sent': TResponseEvent<
    'chat-message-sent',
    TChatMessageJson,
    TClientEvents['request-send-chat-message']
  >
  /**
   * Occurs when a node alert has been acknowledged successfully on the server.
   */
  'node-alert-acknowledged': TResponseEvent<
    'node-alert-acknowledged',
    {
      /**
       * The ID of the node alert that was acknowledged.
       */
      alertId: string
      /**
       * The ID of the node to which the alert belongs.
       */
      nodeId: string
    },
    TClientEvents['request-acknowledge-node-alert']
  >
  /**
   * Occurs to send the requested, currently-joined session to the client.
   */
  'current-session': TResponseEvent<
    'current-session',
    {
      /**
       * The session that is currently joined by the client.
       * @note If null, no session is currently joined.
       */
      session: TSessionJson | null
      /**
       * The ID of the member associated with the session client.
       */
      memberId: MetisComponent['_id']
    },
    TClientEvents['request-current-session']
  >
  /**
   * Occurs when the client has successfully joined a session on the server.
   */
  'session-joined': TResponseEvent<
    'session-joined',
    {
      /**
       * The session that was joined.
       */
      session: TSessionJson
      /**
       * The ID of the member in the session.
       */
      memberId: MetisComponent['_id']
    },
    TClientEvents['request-join-session']
  >
  /**
   * Occurs when the client has successfully quit a session on the server.
   */
  'session-quit': TResponseEvent<
    'session-quit',
    {},
    TClientEvents['request-quit-session']
  >
  /**
   * Occurs when a play-test has been launched, auto-joined, and started
   * on the server, carrying the fully-started session so the client can
   * navigate straight into it.
   */
  'play-test-started': TResponseEvent<
    'play-test-started',
    {
      /**
       * The started play-test session.
       */
      session: TSessionJson
      /**
       * The ID of the owner's member in the session.
       */
      memberId: MetisComponent['_id']
    },
    TClientEvents['request-play-test']
  >
}

/**
 * All WS events emitted by the server, or caused due to a change in the connection with the server.
 */
export type TServerEvents = TGenericServerEvents & TResponseEvents

/**
 * General WS events emitted by the client, or caused due to a change in the connection with the client.
 */

export type TGenericClientEvents = {
  /**
   * Occurs when the connection to the client is closed.
   */
  'close': TConnectEvent<'close'>
  /**
   * Occurs when the client emits an error.
   */
  'error': {
    /**
     * The event method (Always "error").
     */
    method: 'error'
    /**
     * The error code (See shared/connect/errors.ts).
     */
    code: number
    /**
     * The message explaining the error.
     */
    message: string
    data: {}
  }
  /**
   * Occurs when the client acknowledges the activity that
   * triggered a session panel alert.
   */
  'acknowledge-session-panel-alert': TConnectEvent<
    'acknowledge-session-panel-alert',
    | {
        /**
         * The session panel that has been acknowledged.
         */
        panel: Exclude<TSessionPanelAlert, 'Messenger'>
      }
    | {
        /**
         * The session panel that has been acknowledged.
         */
        panel: 'Messenger'
        /**
         * The ID of the channel within the Messenger panel that has been acknowledged.
         */
        channelId: string
      }
  >
  /**
   * Occurs when the client requests the server to fetch
   * the current session panels with alerts triggered by activity.
   */
  'fetch-session-panel-alerts': TConnectEvent<'fetch-session-panel-alerts'>
}

/**
 * WS events emitted by the client as a request to the server, expecting a response or responses of some kind.
 */
export type TRequestEvents = {
  /**
   * Occurs when the client requests to start the joined
   * session.
   */
  'request-start-session': TRequestEvent<'request-start-session'>
  /**
   * Occurs when the client requests to end the joined
   * session.
   */
  'request-end-session': TRequestEvent<'request-end-session'>
  /**
   * Occurs when the client requests to reset the joined
   * session.
   */
  'request-reset-session': TRequestEvent<'request-reset-session'>
  /**
   * Occurs when the client requests to update the configuration
   * of the joined session.
   */
  'request-config-update': TRequestEvent<
    'request-config-update',
    {
      /**
       * The updated configuration of the session.
       */
      config: Partial<TSessionConfig>
    }
  >
  /**
   * Occurs when the client requests to kick a member from the session.
   */
  'request-kick': TRequestEvent<
    'request-kick',
    {
      /**
       * The ID of the member to kick.
       */
      memberId: string
    }
  >
  /**
   * Occurs when the client requests to ban a member from the session.
   */
  'request-ban': TRequestEvent<
    'request-ban',
    {
      /**
       * The ID of the member to ban.
       */
      memberId: string
    }
  >
  /**
   * Occurs when the client requests to lift a member's ban from the session.
   */
  'request-unban': TRequestEvent<
    'request-unban',
    {
      /**
       * The ID of the member whose ban to lift.
       */
      memberId: string
    }
  >
  /**
   * Occurs when the client requests to assign a force to a member.
   */
  'request-assign-force': TRequestEvent<
    'request-assign-force',
    {
      /**
       * The ID of the member to assign the force to.
       */
      memberId: string
      /**
       * The ID of the force to assign to the member.
       * @note If `null`, the member will be unassigned from any force.
       */
      forceId: string | null
    }
  >
  /**
   * Occurs when the client requests to assign a different role to a member.
   */
  'request-assign-role': TRequestEvent<
    'request-assign-role',
    {
      /**
       * The ID of the member to assign the role to.
       */
      memberId: SessionMember['_id']
      /**
       * The ID of the role to assign to the member.
       */
      roleId: MemberRole['_id']
    }
  >
  /**
   * Occurs when the client requests to open a node.
   */
  'request-open-node': TRequestEvent<'request-open-node', { nodeId: string }>
  /**
   * Occurs when the client requests to execute an action.
   */
  'request-execute-action': TRequestEvent<
    'request-execute-action',
    {
      /**
       * The ID of the action to execute.
       */
      actionId: string
      /**
       * Cheats to apply when executing the action.
       * @note Any cheats ommitted will be treated
       * as `false`, or disabled.
       * @note Only relevant to members authorized to perform
       * cheats.
       */
      cheats?: Partial<TExecutionCheats>
    }
  >
  /**
   * Occurs when the client requests to send a pre-execution message to the output panel.
   */
  'request-send-output': TRequestEvent<'request-send-output', TOutputDatum>
  /**
   * Occurs when the client requests to send a chat message to a channel.
   */
  'request-send-chat-message': TRequestEvent<
    'request-send-chat-message',
    {
      /**
       * The ID of the channel to send the message to.
       */
      channelId: string
      /**
       * The HTML content of the message.
       */
      message: string
    }
  >
  /**
   * Occurs when the client requests to mark a node alert as acknowledged,
   * which will dismiss it from view.
   */
  'request-acknowledge-node-alert': TRequestEvent<
    'request-acknowledge-node-alert',
    {
      /**
       * The ID of the node alert to acknowledge.
       */
      alertId: string
      /**
       * The node to which the alert is tied (Helps speed up
       * lookup).
       */
      nodeId: string
    }
  >
  /**
   * Occurs when the client requests to fetch the currently joined session.
   */
  'request-current-session': TRequestEvent<'request-current-session'>
  /**
   * Occurs when the client requests to join a session.
   */
  'request-join-session': TRequestEvent<
    'request-join-session',
    {
      /**
       * The ID of the session to join.
       */
      sessionId: string
    }
  >
  /**
   * Occurs when the client requests to quit a session.
   */
  'request-quit-session': TRequestEvent<'request-quit-session'>
  /**
   * Occurs when the client (a mission author) requests to launch a
   * disposable play-test of a mission. The server launches, auto-joins
   * the owner, and auto-starts the session, then responds with
   * `play-test-started`.
   */
  'request-play-test': TRequestEvent<
    'request-play-test',
    {
      /**
       * The ID of the mission to play-test.
       */
      missionId: string
      /**
       * Optional configuration overrides for the play-test. Merged over
       * the default config; `isTest` and `accessibility` are always
       * forced by the server regardless of what is provided here.
       */
      config?: Partial<TSessionConfig>
    }
  >
}

/**
 * WS events emitted by the client, or caused due to a change in the connection with the client.
 */
export type TClientEvents = TGenericClientEvents & TRequestEvents
