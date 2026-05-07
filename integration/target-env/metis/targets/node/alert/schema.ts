/* -- ARGUMENTS -- */

/**
 * The grouping ID used for all arguments in this target.
 */
const groupingId = 'node'

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

/* -- TARGET -- */

/**
 * A target available in the METIS target environment that enables effects to
 * add alerts to nodes. When a node alert is added, it will appear on a node
 * in the mission-map interface for members operating that node to see.
 */
const NodeAlert = TargetSchema.create({
  _id: 'node-alert',
  name: 'Node Alert',
  description: 'Adds an alert to a node.',
  script: async (context, nodeMetadata, severityLevel, message) => {
    const [node] = nodeMetadata
    context.addNodeAlert(message, severityLevel, {
      forceKey: node.force.localKey,
      nodeKey: node.localKey,
    })
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'nodeMetadata',
      name: 'Node',
      required: true,
      groupingId: groupingId,
      validComponentTypes: ['node'] as const,
    },
    {
      _id: 'severityLevel',
      type: 'dropdown' as const,
      name: 'Severity Level',
      required: true,
      groupingId: groupingId,
      options: [infoOption, suspiciousOption, warningOption, dangerOption],
      default: warningOption,
    },
    {
      type: 'large-string' as const,
      _id: 'message',
      name: 'Message',
      required: true,
      groupingId: groupingId,
      default: 'Enter your message here.',
    },
  ],
})

export default NodeAlert
