import Dependency from 'metis/target-environments/dependencies'
import TargetSchema from '../../../../library/target-env-classes/targets'

/**
 * A target available in the METIS target environment that enables a user
 * to send a message to the output panel of a force.
 */
const Output = new TargetSchema({
  name: 'Output Panel',
  description: '',
  script: async (context) => {
    // Extract the effect and its arguments from the context.
    let { effect } = context
    let { forceMetadata, message } = effect.args
    let { forceId } = forceMetadata

    // Output the message to the force.
    context.sendOutput(message, { forceId })
  },
  args: [
    {
      type: 'force',
      _id: 'forceMetadata',
      name: 'Force',
      required: true,
      groupingId: 'output',
    },
    {
      type: 'large-string',
      _id: 'message',
      name: 'Message',
      required: false,
      groupingId: 'output',
      dependencies: [Dependency.FORCE('forceMetadata')],
      tooltipDescription:
        `This is the message that will be displayed in the output panel for the force selected above.\n` +
        `\t\n` +
        `**Note: If this field is left blank, then nothing will be displayed in the output panel.**`,
    },
  ],
})

export default Output
