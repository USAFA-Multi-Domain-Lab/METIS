import { migrations } from './migrations'

/**
 * A target available in the METIS target environment that enables a user
 * to send a message to the output panel of a force.
 */
const Output = TargetSchema.create({
  _id: 'output',
  name: 'Output Panel',
  description: '',
  script: async (context, to, message = '') => {
    context.sendOutput(message, to)
  },
  parameters: [
    {
      type: 'mission-component',
      _id: 'to',
      name: 'Force',
      groupingId: 'output',
      validComponentTypes: ['mission', 'force'],
    },
    {
      type: 'large-string',
      _id: 'message',
      name: 'Message',
      required: false,
      groupingId: 'output',
      tooltipDescription:
        `This is the message that will be displayed in the output panel for the force selected above.\n` +
        `\t\n` +
        `**Note: If this field is left blank, then nothing will be displayed in the output panel.**`,
    },
  ],
  migrations,
})

export default Output
