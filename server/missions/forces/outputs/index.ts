import ServerCustomOutput from './custom'
import ServerExecutionFailedOutput from './execution-failed'
import ServerExecutionStartedOutput from './execution-started'
import ServerExecutionSucceededOutput from './execution-succeeded'
import ServerIntroOutput from './intro'
import ServerPreExecutionOutput from './pre-execution'

/**
 * Represents an output for a force's output panel that's used on the server.
 */
export type ServerOutput =
  | ServerIntroOutput
  | ServerPreExecutionOutput
  | ServerExecutionStartedOutput
  | ServerExecutionSucceededOutput
  | ServerExecutionFailedOutput
  | ServerCustomOutput
