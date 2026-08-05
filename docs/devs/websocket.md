# WebSocket System

METIS uses Socket.IO for real-time communication between clients and the server.

## Table of Contents

- [Connecting](#connecting)
- [Rate Limiting](#rate-limiting)
- [The Event Model](#the-event-model)
- [Event Reference](#event-reference)
  - [Client Requests](#client-requests)
  - [Server Responses](#server-responses)
  - [Server Broadcasts](#server-broadcasts)
  - [Client Notifications](#client-notifications)
- [Errors](#errors)
- [Related Documentation](#related-documentation)

## Connecting

A WebSocket connection is authenticated by the login the caller already holds. There is no separate token: the handshake carries the Express session cookie established by the [Logins API](../api/logins.md), and the server resolves the login from it.

Two conditions are checked before the connection is accepted:

- **The caller must be signed in.** Without a login, the connection is refused with `UNAUTHENTICATED`.
- **The login must not already hold a connection.** A second connection for the same login is refused with `DUPLICATE_CLIENT`.

To take over instead of being refused, send a `disconnect-existing` header on the handshake. This is the WebSocket counterpart of the `forceful` header on login, and it exists for the same reason — a user returning in a new tab or on another machine.

One login holds at most one connection, so a user's permissions and their session membership follow the connection automatically.

## Rate Limiting

- **100 messages per second**, by default
- Enforced **per connection**, and therefore per user account rather than per IP address
- [Configurable via environment variables](../setup/environment.md)
- Exceeding the limit produces a `MESSAGE_RATE_LIMIT` error event rather than a disconnection

## The Event Model

Events fall into four groups along two axes — who sent it, and whether it answers something.

| Group                                         | Direction       | Purpose                                                 |
| --------------------------------------------- | --------------- | ------------------------------------------------------- |
| [Client requests](#client-requests)           | client → server | Ask the server to do something; each expects a response |
| [Server responses](#server-responses)         | server → client | Answer a specific request, carrying a reference to it   |
| [Server broadcasts](#server-broadcasts)       | server → client | State changes and connection events, unprompted         |
| [Client notifications](#client-notifications) | client → server | Tell the server something without expecting an answer   |

The request/response pairing is the part worth understanding. A response event carries a `request` property holding the originating event, the ID of the client that sent it, and whether it has been fulfilled. That is what lets a client correlate an answer with the thing it asked, and it is why most responses are named as completed facts (`session-started`) rather than as commands.

Responses are not private. A request from one member usually produces a response delivered to everyone who should see it — `force-assigned` reaches the whole session, not just the manager who asked.

**Realms scope delivery.** A member receives events for the realm they are subscribed to. In a standalone session, where every participant has their own realm, one participant's action produces no events for another. See [Realms](architecture.md#the-realm-model).

## Event Reference

Every event METIS defines, grouped as above.

### Client Requests

| Event                            | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `request-start-session`          | Start a session from the lobby                        |
| `request-end-session`            | End a running session                                 |
| `request-reset-session`          | Return a session to `unstarted` so it can be replayed |
| `request-config-update`          | Change the session configuration                      |
| `request-join-session`           | Join a session                                        |
| `request-quit-session`           | Leave a session                                       |
| `request-current-session`        | Fetch the caller's current session state              |
| `request-play-test`              | Launch a throwaway play-test bound to this connection |
| `request-switch-realm`           | Subscribe the caller to a different realm             |
| `request-kick`                   | Remove a member from the session                      |
| `request-ban`                    | Remove a member and bar them from rejoining           |
| `request-unban`                  | Lift a ban                                            |
| `request-assign-force`           | Assign a member to a force                            |
| `request-assign-role`            | Change a member's role                                |
| `request-open-node`              | Open a node                                           |
| `request-execute-action`         | Execute an action on a node                           |
| `request-send-output`            | Send a message to the output panel                    |
| `request-acknowledge-node-alert` | Acknowledge a node alert                              |

### Server Responses

| Event                                                       | Answers                          |
| ----------------------------------------------------------- | -------------------------------- |
| `session-starting` / `session-started`                      | `request-start-session`          |
| `session-ending` / `session-ended`                          | `request-end-session`            |
| `session-resetting` / `session-reset`                       | `request-reset-session`          |
| `session-config-updated`                                    | `request-config-update`          |
| `session-joined`                                            | `request-join-session`           |
| `session-quit`                                              | `request-quit-session`           |
| `current-session`                                           | `request-current-session`        |
| `play-test-started`                                         | `request-play-test`              |
| `realm-switched`                                            | `request-switch-realm`           |
| `kicked`                                                    | `request-kick`                   |
| `banned`                                                    | `request-ban`                    |
| `unbanned`                                                  | `request-unban`                  |
| `force-assigned`                                            | `request-assign-force`           |
| `role-assigned`                                             | `request-assign-role`            |
| `node-opened`                                               | `request-open-node`              |
| `action-execution-initiated` / `action-execution-completed` | `request-execute-action`         |
| `output-sent`                                               | `request-send-output`            |
| `node-alert-acknowledged`                                   | `request-acknowledge-node-alert` |

### Server Broadcasts

**Connection state:**

| Event                  | Meaning                                  |
| ---------------------- | ---------------------------------------- |
| `connection-success`   | The connection was established           |
| `connection-closed`    | The connection closed                    |
| `connection-loss`      | The connection dropped unexpectedly      |
| `connection-failure`   | The connection could not be established  |
| `reconnection-success` | A dropped connection was re-established  |
| `reconnection-failure` | Reconnection was abandoned               |
| `connection-change`    | The connection's status changed          |
| `activity`             | Connection activity                      |
| `dismissed`            | The client was dismissed                 |
| `error`                | An error occurred; see [Errors](#errors) |

**Session and mission state:**

| Event                           | Meaning                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `session-members-updated`       | Membership or member details changed                                  |
| `session-destroyed`             | The session was destroyed                                             |
| `session-task-update`           | A target-environment task moved between queued, running, and resolved |
| `session-panel-alert`           | An alert was raised for the session panel                             |
| `node-open-state-updated`       | A node was opened or closed                                           |
| `node-block-status-updated`     | A node was blocked or unblocked                                       |
| `node-alert-added`              | An alert was added to a node                                          |
| `file-access-updated`           | File access was granted or revoked                                    |
| `resource-pool-updated`         | A resource pool changed                                               |
| `action-process-time-updated`   | An action's process time was modified                                 |
| `action-success-chance-updated` | An action's success chance was modified                               |
| `action-resource-cost-updated`  | An action's resource cost was modified                                |
| `send-output`                   | Output was sent to the panel                                          |
| `logout-user-update`            | The signed-in account changed and the client must sign in again       |

### Client Notifications

| Event   | Purpose                              |
| ------- | ------------------------------------ |
| `close` | The client is closing the connection |
| `error` | The client is reporting an error     |

## Errors

Errors arrive as an `error` event carrying a numeric code. The codes are grouped by family, which is the quickest way to tell what kind of problem occurred:

| Range   | Family                                                                                     |
| ------- | ------------------------------------------------------------------------------------------ |
| `10000` | Connection and protocol — authentication, duplicate clients, rate limiting, malformed data |
| `20000` | Session — not found, unauthorized, banned, conflicting state                               |
| `20100` | Node and action — not found, not openable                                                  |

Codes worth knowing by name:

| Code    | Meaning                                                            |
| ------- | ------------------------------------------------------------------ |
| `10002` | `DUPLICATE_CLIENT` — the login already holds a connection          |
| `10003` | `MESSAGE_RATE_LIMIT` — too many messages                           |
| `10004` | `UNAUTHENTICATED` — no login on the handshake                      |
| `10005` | `SWITCHED_CLIENT` — this connection was taken over by a newer one  |
| `10006` | `FORCE_DISCONNECT_SELF` — the user signed out forcefully elsewhere |

## Related Documentation

- [Architecture Documentation](architecture.md) - Realms, sessions, and how the pieces fit
- [API Overview](../api/overview.md) - The REST half of the system
- [Sessions API](../api/sessions.md) - Launching and destroying sessions
- [Target Environment Integration](../target-env-integration/index.md) - Effects that run during a session
