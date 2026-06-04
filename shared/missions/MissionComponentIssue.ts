import type {
  MissionComponent,
  TMissionComponentIssue,
} from './MissionComponent'
import type { MissionComponentIssueList } from './MissionComponentIssueList'

/**
 * Represents a single issue associated with a mission component.
 * When resolved, it removes itself from the {@link MissionComponentIssueList}
 * it belongs to.
 */
export class MissionComponentIssue<
  TComponent extends MissionComponent<any, any> = MissionComponent<any, any>,
> {
  /**
   * A unique identifier for the issue, used for tracking
   * and resolving the issue.
   */
  public readonly key: string

  /**
   * The type of issue that is present.
   * This affects how the issue is handled.
   */
  public readonly type: TMissionComponentIssueType

  /**
   * The message describing the issue.
   */
  public readonly message: string

  /**
   * The condition that determines whether the issue is still
   * present in the list.
   */
  public readonly condition: TMissionComponentIssueCondition

  /**
   * The list this issue belongs to, or `null` if not yet added to one.
   */
  public readonly list: MissionComponentIssueList<TComponent>

  /**
   * The component that has the issue.
   */
  public get component(): TComponent {
    return this.list.component
  }

  /**
   * @param key A unique identifier for the issue, used for tracking
   * and resolving the issue.
   * @param type The type of issue, which affects how the issue is handled.
   * @param message The message describing the issue.
   * @param condition The condition that determines whether the issue is still
   * present in the list. When the condition is no longer met, the issue will
   * be removed from the list.
   * @param list The list this issue belongs to.
   */
  public constructor(
    key: string,
    type: TMissionComponentIssue['type'],
    message: string,
    condition: TMissionComponentIssueCondition,
    list: MissionComponentIssueList<TComponent>,
  ) {
    this.key = key
    this.type = type
    this.message = message
    this.condition = condition
    this.list = list
  }
}

/* -- TYPES -- */

/**
 * A function that returns a boolean indicating whether
 * a certain condition is met. If met, the condition will
 * be included in the list. If not, it will be ignored or
 * removed from the list, if currently present.
 */
export type TMissionComponentIssueCondition = () => boolean

/**
 * The type of issue that is present.
 * This affects how the issue is handled.
 */
export type TMissionComponentIssueType = 'general' | 'outdated'
