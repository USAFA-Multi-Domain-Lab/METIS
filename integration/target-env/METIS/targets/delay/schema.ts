// Argument IDs for the delay target.
const hoursArgId = 'delayTimeHours'
const minutesArgId = 'delayTimeMinutes'
const secondsArgId = 'delayTimeSeconds'
const groupingId = 'delayTime'

/**
 * A target available in the METIS target environment that enables a user
 * to add a delay in a series of effects being processed.
 */
const Delay = new TargetSchema({
  name: 'Delay',
  description: '',
  script: (context) => {
    return new Promise<void>((resolve, reject) => {
      let args = context.effect.args
      let delayTimeSeconds = args[secondsArgId]
      let delayTimeMinutes = args[minutesArgId]
      let delayTimeHours = args[hoursArgId]
      let delayTime: number = 0

      let errorMessage =
        `Bad request. The arguments sent with the effect are invalid. Please check the arguments within the effect.\n` +
        `Effect ID: "${context.effect._id}"\n` +
        `Effect Name: "${context.effect.name}"`

      if (
        typeof delayTimeHours !== 'number' ||
        typeof delayTimeMinutes !== 'number' ||
        typeof delayTimeSeconds !== 'number'
      ) {
        reject(errorMessage)
      }

      // Update the delay time based on the provided values.
      if (delayTimeHours) delayTime += delayTimeHours * 3600 * 1000 /*ms*/
      if (delayTimeMinutes) delayTime += delayTimeMinutes * 60 * 1000 /*ms*/
      if (delayTimeSeconds) delayTime += delayTimeSeconds * 1000 /*ms*/

      // Only resolve after the delay time has passed.
      setTimeout(() => {
        resolve()
      }, delayTime)
    })
  },
  args: [
    {
      type: 'number',
      _id: hoursArgId,
      name: 'Hour(s)',
      required: true,
      min: 0,
      max: 576,
      groupingId,
      default: 0,
      integersOnly: true,
    },
    {
      type: 'number',
      _id: minutesArgId,
      name: 'Minute(s)',
      required: true,
      min: 0,
      max: 59,
      groupingId,
      default: 0,
      integersOnly: true,
    },
    {
      type: 'number',
      _id: secondsArgId,
      name: 'Second(s)',
      required: true,
      min: 0,
      max: 59,
      groupingId,
      default: 0,
      integersOnly: true,
    },
  ],
})

export default Delay
