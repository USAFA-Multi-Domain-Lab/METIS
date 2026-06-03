import type { MissionComponent } from './MissionComponent'
import type {
  TMissionComponentIssueCondition,
  TMissionComponentIssueType,
} from './MissionComponentIssue'
import { MissionComponentIssue } from './MissionComponentIssue'

/**
 * Manages a collection of {@link MissionComponentIssue} instances.
 * Issues added to this list are wired back to it so that calling
 * `resolve()` on an issue removes it here.
 */
export class MissionComponentIssueList<
  TComponent extends MissionComponent<any, any>,
> {
  /**
   * The issues currently in the list.
   */
  private _items: MissionComponentIssue<TComponent>[]

  /**
   * All issues currently in the list.
   */
  public get items(): readonly MissionComponentIssue<TComponent>[] {
    return [...this._items]
  }

  /**
   * The number of issues in the list.
   */
  public get length(): number {
    return this._items.length
  }

  /**
   * Whether the list contains no issues.
   */
  public get isEmpty(): boolean {
    return this._items.length === 0
  }

  /**
   * The component this list belongs to.
   */
  public readonly component: TComponent

  /**
   * @param component The component this list belongs to.
   */
  public constructor(component: TComponent) {
    this.component = component
    this._items = []
  }

  /**
   * Adds an issue with the provided type, message, and condition to the list.
   * @param type The type of issue to include.
   * @param message The message of the issue to include.
   * @param condition The condition that will be used to remove the issue
   * from the list when resolved.
   */
  private include(
    type: TMissionComponentIssueType,
    message: string,
    condition: TMissionComponentIssueCondition,
  ): void {
    this._items.push(new MissionComponentIssue(type, message, condition, this))
  }

  /**
   * Includes an issue with the provided type and message
   * if the provided condition is met.
   * @param condition The condition that determines whether the issue is included.
   * @param type The type of issue to include if the condition is met.
   * @param message The message of the issue to include if the condition is met.
   */
  public includeIf(
    condition: TMissionComponentIssueCondition,
    type: TMissionComponentIssueType,
    message: string,
  ): void {
    if (condition()) {
      this.include(type, message, condition)
    }
  }
}
