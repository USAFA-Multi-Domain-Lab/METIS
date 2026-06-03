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
   * Tracks whether call to {@link if} or {@link elseIf}
   * methods were met, to determine whether subsequent
   * {@link elseIf} calls should be evaluated.
   */
  private lastIfMet: boolean | null = null

  /**
   * @param component The component this list belongs to.
   */
  public constructor(component: TComponent) {
    this.component = component
    this._items = []
  }

  /**
   * Adds an issue with the provided type, message, and condition to the list.
   * @param condition The condition that will be used to remove the issue
   * from the list when resolved.
   * @param options Options for creating the new issues.
   */
  private add(
    condition: TMissionComponentIssueCondition,
    ...options: TIssueAddOptions[]
  ): void {
    for (let { message, type = 'general' } of options) {
      this._items.push(
        new MissionComponentIssue(type, message, condition, this),
      )
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
      add: (...options: TIssueAddOptions[]) => {
        let ifMet = condition()
        if (ifMet) {
          this.add(condition, ...options)
        }
        this.lastIfMet = ifMet
        return this
      },
    }
  }

  /**
   * Calls {@link if} with the provided condition and message
   * only if the previous call to {@link if} or {@link elseIf}
   * in the chain was not met.
   * @param condition A condition to check, which will only be checked if the
   * previous condition in the chain was not met.
   * @returns An object with follow up operation options, which, when called,
   * will perform that operation only if the provided condition is met and
   * the previous condition in the chain was not met.
   * @throws If this method is called before any other if call.
   */
  public elseIf(
    condition: TMissionComponentIssueCondition,
  ): TIfReturn<TComponent> {
    if (this.lastIfMet === null) {
      throw new Error('elseIf called before any if call')
    }
    return {
      add: (...options: TIssueAddOptions[]) => {
        if (!this.lastIfMet) {
          let ifMet = condition()
          if (ifMet) {
            this.add(condition, ...options)
          }
          this.lastIfMet = ifMet
        }
        return this
      },
    }
  }
}

/* -- TYPES -- */

/**
 * Options to provide when adding an issue to the list.
 */
export type TIssueAddOptions = {
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
export type TIfReturn<TComponent extends MissionComponent<any, any>> = {
  /**
   * Adds an issue with the provided message to the list.
   * @param options Options for creating the new issues.
   * @returns The list itself for chaining.
   * @note The previous condition provided in the chain is used
   * to determine when the issue should be removed.
   */
  add(...options: TIssueAddOptions[]): MissionComponentIssueList<TComponent>
}
