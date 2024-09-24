import ClientCustomOutput from './custom'
import ClientExecutionFailedOutput from './execution-failed'
import ClientExecutionStartedOutput from './execution-started'
import ClientExecutionSucceededOutput from './execution-succeeded'
import ClientIntroOutput from './intro'
import ClientPreExecutionOutput from './pre-execution'

/**
 * Represents an output for a force's output panel that's used on the client.
 */
export type ClientOutput =
  | ClientIntroOutput
  | ClientPreExecutionOutput
  | ClientExecutionStartedOutput
  | ClientExecutionSucceededOutput
  | ClientExecutionFailedOutput
  | ClientCustomOutput
