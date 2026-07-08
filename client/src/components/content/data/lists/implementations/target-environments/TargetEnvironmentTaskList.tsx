import type { ClientEnvironmentTask } from '@client/target-environments/ClientEnvironmentTask'
import { ClassList } from '@shared/toolbox/html/ClassList'
import List from '../../List'
import './TargetEnvironmentTaskList.scss'

/**
 * A presentational component for displaying target-environment tasks
 * (setup, teardown, or live effects) for a session.
 * @note Wrapper for the {@link List} component.
 */
export default function TargetEnvironmentTaskList({
  tasks,
}: TTargetEnvironmentTaskList_P): TReactElement | null {
  /* -- FUNCTIONS -- */

  /**
   * Gets the column label for the task list.
   */
  const getColumnLabel = (column: keyof ClientEnvironmentTask): string => {
    switch (column) {
      case 'environmentVersion':
        return 'Version'
      case 'statusDescription':
        return 'Status'
      default:
        return 'Unknown column'
    }
  }

  /**
   * Gets the column width for the task list.
   */
  const getColumnWidth = (column: keyof ClientEnvironmentTask) => {
    switch (column) {
      case 'environmentVersion':
        return '6em'
      default:
        return '16em'
    }
  }

  /**
   * Gets the tooltip for a task's row, exposing the full error
   * message for failed tasks.
   */
  const getItemTooltip = (task: ClientEnvironmentTask): string => {
    return task.error?.message ?? ''
  }

  /**
   * Gets status-based classes for a task's row, used to drive
   * row-level styling (e.g. red text for failed tasks, a faded
   * treatment while queued, or a pulsing treatment while running).
   */
  const getAdditionalItemClasses = (task: ClientEnvironmentTask): ClassList =>
    new ClassList().switch(
      {
        queued: 'SetupStatus_Queued',
        running: 'SetupStatus_Running',
        success: 'SetupStatus_Success',
        failure: 'SetupStatus_Failure',
        skipped: 'SetupStatus_Skipped',
      },
      task.status,
    )

  /* -- RENDER -- */

  // If no tasks exist yet, show a message in place of the list.
  if (tasks.length === 0) {
    return (
      <div className='TargetEnvironmentTaskList'>
        <div className='NoResultsMessage'>
          No task information available yet.
        </div>
      </div>
    )
  }

  // Render the list of tasks.
  return (
    <div className='TargetEnvironmentTaskList'>
      <List<ClientEnvironmentTask>
        name={'Tasks'}
        items={tasks}
        initialSorting={{ method: 'unsorted' }}
        columns={['environmentVersion', 'statusDescription']}
        getColumnWidth={getColumnWidth}
        getColumnLabel={getColumnLabel}
        getItemTooltip={getItemTooltip}
        getAdditionalItemClasses={getAdditionalItemClasses}
      />
    </div>
  )
}

/**
 * Props for `TargetEnvironmentTaskList`.
 */
export type TTargetEnvironmentTaskList_P = {
  /**
   * The target-environment tasks to display.
   */
  tasks: ClientEnvironmentTask[]
}
