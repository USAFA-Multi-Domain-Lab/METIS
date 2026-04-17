import { manageMetisService } from 'util/services'
import { StandardCommand } from './StandardCommand'

/**
 * Starts the METIS service.
 */
export const command_start = new StandardCommand(
  'start',
  'Starts the METIS service.',
  [],
  async () => {
    manageMetisService('start')
  },
)
