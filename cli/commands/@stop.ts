import { manageMetisService } from 'util/services'
import { StandardCommand } from './StandardCommand'

/**
 * Starts the METIS service.
 */
export const command_stop = new StandardCommand(
  'stop',
  'Stops the METIS service.',
  [],
  async () => {
    manageMetisService('stop')
  },
)
