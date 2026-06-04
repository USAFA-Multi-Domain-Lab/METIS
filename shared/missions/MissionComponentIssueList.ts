import type { MissionComponent } from './MissionComponent'
import type {
  TMissionComponentIssueCondition,
  TMissionComponentIssueType,
} from './MissionComponentIssue'
import { MissionComponentIssue } from './MissionComponentIssue'

/**
 * Manages a collection of {@link MissionComponentIssue} instances for a single
 * component. Issues are keyed so they can be scrubbed and re-evaluated whenever
 * a relevant event fires via {@link handle}.
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
   * Tracks handlers registered by {@link when} method.
   */
  private whenHandlers: Map<
    string,
    Array<[TMissionComponentIssueCondition, () => void]>
  > = new Map()

  /**
   * @param component The component this list belongs to.
   */
  public constructor(component: TComponent) {
    this.component = component
    this._items = []
  }

  /**
   * Scrubs any issues currently in the list with the provided keys,
   * then, if the condition is met, adds new issues based on the provided
   * options.
   * @param condition The condition that will be used to determine whether
   * the issues should be included in the list or not.
   * @param options Options for generating the new issues.
   */
  private includeIf(
    condition: TMissionComponentIssueCondition,
    ...options: TIssueIncludeOptions[]
  ): void {
    for (let { key } of options) {
      this._items = this._items.filter((item) => item.key !== key)
    }
    if (condition()) {
      for (let { key, message, type = 'general' } of options) {
        this._items.push(
          new MissionComponentIssue(key, type, message, this.component),
        )
      }
    }
  }

  /**
   * @param condition A condition to check.
   * @returns Returns an object with follow up operation options,
   * which, when called, will perform that operation only
   * if the provided condition is met.
   */
  public if(condition: TMissionComponentIssueCondition): TIfReturn<TComponent> {
    return {
      include: (...options: TIssueIncludeOptions[]) => {
        this.includeIf(condition, ...options)
        return this
      },
    }
  }

  /**
   * Allows the conditional inclusion of issues based on the
   * occurrence of the provided events.
   * @param events The events to subscribe to, which will trigger a
   * recheck of conditions.
   * @return An object with follow up operation options, which, when called,
   * will register conditions that will be checked whenever one of the provided
   * events occurs.
   */
  public when(...events: string[]): TWhenReturn<TComponent> {
    return {
      if: (condition: TMissionComponentIssueCondition) => {
        return {
          include: (...options: TIssueIncludeOptions[]) => {
            let handler = () => {
              this.includeIf(condition, ...options)
            }
            for (let event of events) {
              if (!this.whenHandlers.has(event)) {
                this.whenHandlers.set(event, [])
              }
              this.whenHandlers.get(event)!.push([condition, handler])
            }
            return this
          },
        }
      },
    }
  }

  /**
   * Fires all handlers registered under the provided event name,
   * causing each associated condition to be re-evaluated and its
   * issues to be scrubbed and optionally re-added.
   * @param event The name of the event to fire.
   * @returns The list itself for chaining.
   */
  public handle(event: string): MissionComponentIssueList<TComponent> {
    let handlers = this.whenHandlers.get(event)
    if (handlers) {
      for (let [, handler] of handlers) {
        handler()
      }
    }
    return this
  }
}

/* -- TYPES -- */

/**
 * Options to provide when adding an issue to the list.
 */
export type TIssueIncludeOptions = {
  /**
   * A unique identifier for the issue, used for tracking
   * and resolving the issue.
   */
  key: string
  /**
   * The message describing the issue.
   */
  message: string
  /**
   * The type of issue to add.
   * @default 'general'
   */
  type?: TMissionComponentIssueType
}

/**
 * Returned by {@link if} method, as well as related methods,
 * to allow a follow up operation in the case the condition was
 * met.
 */
type TIfReturn<TComponent extends MissionComponent<any, any>> = {
  /**
   * Scrubs any existing issues matching the provided keys, then re-adds
   * them if the associated condition is met.
   * @param options Options for creating the new issues.
   * @returns The list itself for chaining.
   */
  include(
    ...options: TIssueIncludeOptions[]
  ): MissionComponentIssueList<TComponent>
}

/**
 * Returned by {@link when} method, as well as related methods,
 * to allow follow up operations based on events.
 */
type TWhenReturn<TComponent extends MissionComponent<any, any>> = {
  /**
   * See {@link if} for details.
   */
  if: (condition: TMissionComponentIssueCondition) => TIfReturn<TComponent>
}
