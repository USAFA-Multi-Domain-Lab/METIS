import { TActionMetadata } from 'metis/target-environments/args/mission-component/action-arg'
import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to manipulate the process time of a specific action within a node or
 * all actions within a node.
 */
const ProcessTimeMod = new TargetSchema({
  name: 'Process Time Modifier',
  description: '',
  script: async (context) => {
    // Gather details.
    const {
      actionMetadata,
      processTimeInSeconds,
      processTimeInMinutes,
      processTimeInHours,
    } = context.effect.args
    const { forceKey, nodeKey, actionKey } = actionMetadata as TActionMetadata
    let processTime: number | undefined = undefined
    const errorMessage =
      `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
      `Effect ID: "${context.effect._id}"\n` +
      `Effect Name: "${context.effect.name}"`

    if (typeof forceKey !== 'string' || typeof nodeKey !== 'string') {
      throw new Error(errorMessage)
    }

    // Check if the process time is in seconds.
    if (processTimeInSeconds && typeof processTimeInSeconds === 'number') {
      processTime = processTimeInSeconds * 1000 /*ms*/
    }
    // Check if the process time is in minutes.
    else if (processTimeInMinutes && typeof processTimeInMinutes === 'number') {
      processTime = processTimeInMinutes * 60000 /*ms*/
    }
    // Check if the process time is in hours.
    else if (processTimeInHours && typeof processTimeInHours === 'number') {
      processTime = processTimeInHours * 3600000 /*ms*/
    }

    // If the process time is a number, then modify the process time.
    if (processTime && typeof processTime === 'number') {
      context.modifyProcessTime(processTime, { forceKey, nodeKey, actionKey })
    }
    // Otherwise, throw an error.
    else if (processTime && typeof processTime !== 'number') {
      throw new Error(errorMessage)
    }
  },
  args: [
    {
      type: 'action',
      _id: 'actionMetadata',
      name: 'Action',
      required: false,
      groupingId: 'action',
    },
    {
      type: 'dropdown',
      _id: 'processTimeUnit',
      name: 'Unit',
      required: false,
      groupingId: 'action',
      dependencies: [Dependency.ACTION('actionMetadata')],
      options: [
        {
          _id: 'seconds',
          name: 'Seconds',
          value: 'seconds',
        },
        {
          _id: 'minutes',
          name: 'Minutes',
          value: 'minutes',
        },
        {
          _id: 'hours',
          name: 'Hours',
          value: 'hours',
        },
      ],
    },
    {
      type: 'number',
      _id: 'processTimeInSeconds',
      name: 'Process Time (seconds)',
      required: true,
      min: -3600,
      max: 3600,
      unit: 'sec',
      groupingId: 'action',
      dependencies: [
        Dependency.ACTION('actionMetadata'),
        Dependency.EQUALS('processTimeUnit', 'seconds'),
      ],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 60s and you set the process time to +10s, then the process time will be 70s.\n` +
        `\t\n` +
        `*Note: If the result is less than 0s, then the process time will be 0s. If the result is greater than 3600s, then the process time will be 3600s.*`,
    },
    {
      type: 'number',
      _id: 'processTimeInMinutes',
      name: 'Process Time (minutes)',
      required: true,
      min: -60,
      max: 60,
      unit: 'min',
      groupingId: 'action',
      dependencies: [
        Dependency.ACTION('actionMetadata'),
        Dependency.EQUALS('processTimeUnit', 'minutes'),
      ],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 1m and you set the process time to +10m, then the process time will be 11m.\n` +
        `\t\n` +
        `*Note: If the result is less than 0m, then the process time will be 0m. If the result is greater than 60m, then the process time will be 60m.*`,
    },
    {
      type: 'number',
      _id: 'processTimeInHours',
      name: 'Process Time (hours)',
      required: true,
      min: -1,
      max: 1,
      unit: 'hr',
      groupingId: 'action',
      dependencies: [
        Dependency.ACTION('actionMetadata'),
        Dependency.EQUALS('processTimeUnit', 'hours'),
      ],
      default: 0,
      tooltipDescription:
        `This allows you to positively or negatively affect the process time for all actions within the node. A positive value increases the process time, while a negative value decreases the process time.\n` +
        `\t\n` +
        `For example, if the process time is 1h and you set the process time to +10h, then the process time will be 11h.\n` +
        `\t\n` +
        `*Note: If the result is less than 0h, then the process time will be 0h. If the result is greater than 1h, then the process time will be 1h.*`,
    },
  ],
})

export default ProcessTimeMod
