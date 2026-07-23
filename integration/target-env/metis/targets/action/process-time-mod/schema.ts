import { migrations } from './migrations'

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
    { applyTo, processTimeHours, processTimeMinutes, processTimeSeconds },
  ) => {
    let processTime: number = 0

    // Update the process time based on the provided values.
    if (processTimeHours) processTime += processTimeHours * 3600 * 1000 /*ms*/
    if (processTimeMinutes) processTime += processTimeMinutes * 60 * 1000 /*ms*/
    if (processTimeSeconds) processTime += processTimeSeconds * 1000 /*ms*/

    // If the process time isn't 0, apply it to each selected component.
    if (Math.abs(processTime) > 0) {
      context.modifyProcessTime(applyTo, processTime)
    }
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'applyTo',
      name: 'Apply To',
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
      type: 'number',
      _id: hoursArgId,
      name: 'Hour(s)',
      required: true,
      min: -1,
      max: 1,
      groupingId,
      default: 0,
      integersOnly: true,
      tooltipDescription:
        `This allows you to offset the process time for all actions within the selected component range. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, entering 1 here will change a process time of 0h 3m 59s to 1h 3m 59s.\n` +
        `\t\n` +
        `*Note: A guard is in place which prevents the resulting process time from becoming less than 0 or greater than 1h 59m 59s.*`,
    },
    {
      type: 'number',
      _id: minutesArgId,
      name: 'Minute(s)',
      required: true,
      min: -59,
      max: 59,
      groupingId,
      default: 0,
      integersOnly: true,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all selected actions. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, entering 10 here will change a process time of 0h 3m 50s to 0h 13m 50s.\n` +
        `\t\n` +
        `*Note: A guard is in place which prevents the resulting process time from becoming less than 0 or greater than 1h 59m 59s.*`,
    },
    {
      type: 'number',
      _id: secondsArgId,
      name: 'Second(s)',
      required: true,
      min: -59,
      max: 59,
      groupingId,
      default: 0,
      integersOnly: true,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all selected actions. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, entering 15 here will change a process time of 0h 3m 50s to 0h 4m 5s.\n` +
        `\t\n` +
        `*Note: A guard is in place which prevents the resulting process time from becoming less than 0 or greater than 1h 59m 59s.*`,
    },
  ],
  migrations,
})

export default ProcessTimeMod
