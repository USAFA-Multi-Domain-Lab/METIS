/* -- ARGUMENTS -- */

import type { TTargetArgJson } from '@shared/target-environments/args/Arg'

/**
 * The grouping ID used for all arguments in this target.
 */
const groupingId = 'node'

/**
 * Argument that specifies the node to which the alert
 * will be added.
 */
const nodeMetadataArg: TTargetArgJson = {
  type: 'node',
  _id: 'nodeMetadata',
  name: 'Node',
  required: true,
  groupingId: groupingId,
}

/**
 * Argument that specifies the message to be included
 * in the node alert, giving the user intel on what
 * happened and perhaps how they should respond.
 */
const messageArg: TTargetArgJson = {
  type: 'string',
  _id: 'message',
  name: 'Message',
  required: true,
  groupingId: groupingId,
  default: 'Enter your warning message here.',
}

/**
 * EXPERIMENTAL
 * A severity-level option that represents an alert
 * that is meant to provide general information or
 * guidance to the user, but does not necessarily
 * indicate that there is an issue.
 */
const infoOption = {
  _id: 'info',
  name: 'Info',
  value: 'info',
}

/**
 * A severity-level option that represents an alert
 * that has a lower-level of importance, but still
 * may warrant attention.
 */
const suspiciousOption = {
  _id: 'suspicious',
  name: 'Suspicious',
  value: 'suspicious',
}
/**
 * A severity-level option that represents an alert
 * that indicates a moderate level of concern. This
 * should be addressed in a timely manner.
 */
const warningOption = {
  _id: 'warning',
  name: 'Warning',
  value: 'warning',
}
/**
 * A severity-level option that represents an alert
 * that indicates a high level of concern and requires
 * immediate action.
 */
const dangerOption = {
  _id: 'danger',
  name: 'Danger',
  value: 'danger',
}

/**
 * Defines the level of importance/urgency for this alert.
 */
const severityLevelArg: TTargetArgJson = {
  _id: 'severityLevel',
  type: 'dropdown',
  name: 'Severity Level',
  required: true,
  groupingId: groupingId,
  options: [infoOption, suspiciousOption, warningOption, dangerOption],
  default: warningOption,
}

/* -- TARGET -- */

/**
 * A target available in the METIS target environment that enables effects to
 * add alerts to nodes. When a node alert is added, it will appear on a node
 * in the mission-map interface for members operating that node to see.
 */
const NodeAlert = new TargetSchema({
  _id: 'node-alert',
  name: 'Node Alert',
  description: 'Adds an alert to a node.',
  script: async (context) => {
    let nodeMetadata: TNodeMetadata = context.effect.args.nodeMetadata
    let message = context.effect.args.message
    let severityLevel = context.effect.args.severityLevel
    let { forceKey, nodeKey } = nodeMetadata
    context.addNodeAlert(message, severityLevel, { forceKey, nodeKey })
  },
  args: [nodeMetadataArg, messageArg, severityLevelArg],
})

export default NodeAlert
