import { migrations } from './migrations'

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
} as const

/**
 * A severity-level option that represents an alert
 * that has a lower-level of importance, but still
 * may warrant attention.
 */
const suspiciousOption = {
  _id: 'suspicious',
  name: 'Suspicious',
  value: 'suspicious',
} as const
/**
 * A severity-level option that represents an alert
 * that indicates a moderate level of concern. This
 * should be addressed in a timely manner.
 */
const warningOption = {
  _id: 'warning',
  name: 'Warning',
  value: 'warning',
} as const
/**
 * A severity-level option that represents an alert
 * that indicates a high level of concern and requires
 * immediate action.
 */
const dangerOption = {
  _id: 'danger',
  name: 'Danger',
  value: 'danger',
} as const

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
  script: async (context, applyTo, severityLevel, message) => {
    context.addNodeAlert(applyTo, message, severityLevel)
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Node',
      groupingId: groupingId,
      validComponentTypes: ['mission', 'force', 'node'],
    },
    {
      _id: 'severityLevel',
      type: 'dropdown',
      name: 'Severity Level',
      required: true,
      groupingId: groupingId,
      options: [
        infoOption,
        suspiciousOption,
        warningOption,
        dangerOption,
      ] as const,
      default: 'warning',
      dependencies: [TargetDependency.NOT_EMPTY('applyTo')],
    },
    {
      type: 'large-string',
      _id: 'message',
      name: 'Message',
      required: true,
      groupingId: groupingId,
      default: 'Enter your message here.',
      dependencies: [TargetDependency.NOT_EMPTY('applyTo')],
    },
  ],
  migrations,
})

export default NodeAlert
