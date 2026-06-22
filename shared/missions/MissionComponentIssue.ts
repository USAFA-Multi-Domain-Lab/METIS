import type { MissionComponent } from './MissionComponent'

/**
 * Represents a single issue associated with a mission component.
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
   * The component to which this issue belongs.
   */
  public readonly component: TComponent

  /**
   * @param key A unique identifier for the issue, used for deduplication.
   * @param type The type of issue, which affects how it is handled.
   * @param message The message describing the issue.
   * @param component The component this issue belongs to.
   */
  public constructor(
    key: string,
    type: TMissionComponentIssueType,
    message: string,
    component: TComponent,
  ) {
    this.key = key
    this.type = type
    this.message = message
    this.component = component
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
