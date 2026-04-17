import { manageMetisService } from 'util/services'
import { StandardCommand } from './StandardCommand'

/**
 * Outputs the status of the METIS service.
 */
export const command_status = new StandardCommand(
  'status',
  'Outputs the status of the METIS service.',
  [],
  async () => {
    manageMetisService('status')
  },
)
