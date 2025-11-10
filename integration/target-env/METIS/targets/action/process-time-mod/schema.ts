// Argument IDs for the process time modifier target.
const actionArgId = 'actionMetadata'
const hoursArgId = 'processTimeHours'
const minutesArgId = 'processTimeMinutes'
const secondsArgId = 'processTimeSeconds'
const groupingId = 'processTimeModifier'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the process time of a specific action within a node or
 * all actions within a node.
 */
const ProcessTimeMod = new TargetSchema({
  name: 'Process Time Modifier',
  description: '',
  script: async (context) => {
    const args = context.effect.args
    const actionMetadata = args[actionArgId]
    const processTimeSeconds = args[secondsArgId]
    const processTimeMinutes = args[minutesArgId]
    const processTimeHours = args[hoursArgId]
    const { forceKey, nodeKey, actionKey } = actionMetadata as TActionMetadata
    let processTime: number = 0
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    if (
      typeof forceKey !== 'string' ||
      typeof nodeKey !== 'string' ||
      typeof processTimeHours !== 'number' ||
      typeof processTimeMinutes !== 'number' ||
      typeof processTimeSeconds !== 'number'
    ) {
      throw new Error(errorMessage)
    }

    // Update the process time based on the provided values.
    if (processTimeHours) processTime += processTimeHours * 3600 * 1000 /*ms*/
    if (processTimeMinutes) processTime += processTimeMinutes * 60 * 1000 /*ms*/
    if (processTimeSeconds) processTime += processTimeSeconds * 1000 /*ms*/

    // If the process time isn't 0, then modify the process time.
    if (Math.abs(processTime) > 0) {
      context.modifyProcessTime(processTime, { forceKey, nodeKey, actionKey })
    }
  },
  args: [
    {
      type: 'action',
      _id: actionArgId,
      name: 'Action',
      required: false,
      groupingId,
    },
    {
      type: 'number',
      _id: hoursArgId,
      name: 'Hour(s)',
      required: true,
      min: -1,
      max: 1,
      groupingId,
      dependencies: [TargetDependency.ACTION(actionArgId)],
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
      type: 'number',
      _id: minutesArgId,
      name: 'Minute(s)',
      required: true,
      min: -59,
      max: 59,
      groupingId,
      dependencies: [TargetDependency.ACTION(actionArgId)],
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
      type: 'number',
      _id: secondsArgId,
      name: 'Second(s)',
      required: true,
      min: -59,
      max: 59,
      groupingId,
      dependencies: [TargetDependency.ACTION(actionArgId)],
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
