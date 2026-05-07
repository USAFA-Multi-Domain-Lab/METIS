// Argument IDs for the process time modifier target.
const hoursArgId = 'processTimeHours'
const minutesArgId = 'processTimeMinutes'
const secondsArgId = 'processTimeSeconds'
const groupingId = 'processTimeModifier'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the process time of a specific action within a node or
 * all actions within a node.
 */
const ProcessTimeMod = TargetSchema.create({
  _id: 'process-time-mod',
  name: 'Process Time Modifier',
  description: '',
  script: async (
    context,
    components,
    processTimeHours,
    processTimeMinutes,
    processTimeSeconds,
  ) => {
    let processTime: number = 0

    // Update the process time based on the provided values.
    if (processTimeHours) processTime += processTimeHours * 3600 * 1000 /*ms*/
    if (processTimeMinutes) processTime += processTimeMinutes * 60 * 1000 /*ms*/
    if (processTimeSeconds) processTime += processTimeSeconds * 1000 /*ms*/

    // If the process time isn't 0, apply it to each selected component.
    if (Math.abs(processTime) > 0) {
      for (const component of components) {
        if (component.componentType === 'mission') {
          context.modifyProcessTime(processTime)
        } else if (component.componentType === 'force') {
          context.modifyProcessTime(processTime, {
            forceKey: component.localKey,
          })
        } else if (component.componentType === 'node') {
          context.modifyProcessTime(processTime, {
            forceKey: component.force.localKey,
            nodeKey: component.localKey,
          })
        } else if (component.componentType === 'action') {
          context.modifyProcessTime(processTime, {
            forceKey: component.force.localKey,
            nodeKey: component.node.localKey,
            actionKey: component.localKey,
          })
        }
      }
    }
  },
  parameters: [
    {
      type: 'mission-component' as const,
      _id: 'components', // todo: Write migration from 'actionMetadata' to 'applyTo'
      name: 'Apply To',
      required: true,
      multiSelect: true,
      validComponentTypes: ['mission', 'force', 'node', 'action'],
      tooltipDescription:
        'Select a group of components within the mission ' +
        'to which this modifier will be applied.\n' +
        '\t\n' +
        '*Selecting an action will apply the modifier to that action. ' +
        'Selecting a mission, force, or node, will apply the modifier ' +
        'to all actions within the selected item. ' +
        'Select multiple components to modify a broad range of actions.*',
    },
    {
      type: 'number' as const,
      _id: hoursArgId,
      name: 'Hour(s)',
      required: true,
      min: -1,
      max: 1,
      groupingId,
      dependencies: [TargetDependency.TRUTHY('applyTo')],
      default: 0,
      integersOnly: true,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 1h and you set the process time to +1h, then the process time will be 2h.\n` +
        `\t\n` +
        `*Note: If the result is less than 0h, then the process time will be 0h. If the result is greater than 1h, then the process time will be 1h.*`,
    },
    {
      type: 'number' as const,
      _id: minutesArgId,
      name: 'Minute(s)',
      required: true,
      min: -59,
      max: 59,
      groupingId,
      dependencies: [TargetDependency.TRUTHY('modifierScope')],
      default: 0,
      integersOnly: true,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 1m and you set the process time to +10m, then the process time will be 11m.\n` +
        `\t\n` +
        `*Note: If the result is less than 0m, then the process time will be 0m. If the result is greater than 59m, then the process time will be 59m.*`,
    },
    {
      type: 'number' as const,
      _id: secondsArgId,
      name: 'Second(s)',
      required: true,
      min: -59,
      max: 59,
      groupingId,
      dependencies: [TargetDependency.TRUTHY('modifierScope')],
      default: 0,
      integersOnly: true,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 60s and you set the process time to +10s, then the process time will be 70s.\n` +
        `\t\n` +
        `*Note: If the result is less than 0s, then the process time will be 0s. If the result is greater than 59s, then the process time will be 59s.*`,
    },
  ],
})

export default ProcessTimeMod
