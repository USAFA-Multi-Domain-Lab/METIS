import { manageMetisService } from 'util/services'
import { StandardCommand } from './StandardCommand'

/**
 * Restarts the METIS service.
 */
export const command_restart = new StandardCommand(
  'restart',
  'Restarts the METIS service.',
  [],
  async () => {
    manageMetisService('restart')
  },
)
