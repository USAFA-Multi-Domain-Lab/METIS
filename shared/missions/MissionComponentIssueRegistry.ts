import type { MissionComponent } from './MissionComponent'
import { MissionComponentIssue } from './MissionComponentIssue'

/**
 * A centralized registry of {@link MissionComponentIssue} instances
 * for all components within a mission. Checkers are registered once and
 * apply to every component that matches their {@link MissionComponentIssueChecker.what},
 * so memory scales with the number of rules, not the number of components.
 */
export class MissionComponentIssueRegistry {
  private _checkers: MissionComponentIssueChecker<any>[] = []
  private _issues: Map<
    MissionComponent<any, any>,
    MissionComponentIssue<any>[]
  > = new Map()

  /**
   * Constructs a {@link MissionComponentIssueChecker} from the provided options
   * and registers it with this registry.
   * @param options Options for the checker.
   * @return Itself for chaining.
   */
  public check<TComponent extends MissionComponent<any, any>>(
    options: TIssueCheckerOptions<TComponent>,
  ): MissionComponentIssueRegistry {
    let {
      key,
      message,
      what,
      when = ['initialization'],
      if: condition,
    } = options
    let checker = new MissionComponentIssueChecker<TComponent>(
      key,
      message,
      what,
      when,
      condition,
    )
    this._checkers.push(checker)
    return this
  }

  /**
   * Fires an event for a specific component. All checkers whose
   * {@link MissionComponentIssueChecker.when} list includes the event and
   * whose {@link MissionComponentIssueChecker.what} match the
   * component are re-evaluated. Matching issues are scrubbed and
   * conditionally re-added.
   * @param event The event name to emit.
   * @param component The component for which to emit the event.
   */
  public emit(event: string, component: MissionComponent<any, any>): void {
    for (let checker of this._checkers) {
      if (
        checker.what.some((type) => component instanceof type) &&
        checker.when.includes(event)
      ) {
        let componentIssues = (this._issues.get(component) ?? []).filter(
          (issue) => issue.key !== checker.key,
        )

        if (checker.condition(component)) {
          componentIssues.push(
            new MissionComponentIssue(
              checker.key,
              'general',
              checker.message(component),
              component,
            ),
          )
        }

        if (componentIssues.length > 0) {
          this._issues.set(component, componentIssues)
        } else {
          this._issues.delete(component)
        }
      }
    }
  }

  /**
   * Returns all issues currently registered for the provided component.
   * @param component The component to retrieve issues for.
   */
  public getFor(
    component: MissionComponent<any, any>,
  ): MissionComponentIssue<any>[] {
    return this._issues.get(component) ?? []
  }

  /**
   * All issues currently in the registry across all components.
   */
  public get allIssues(): MissionComponentIssue<any>[] {
    return [...this._issues.values()].flat()
  }
}

/**
 * Defines a condition-based rule for generating issues on components
 * that match the specified types. Registered with
 * {@link MissionComponentIssueRegistry} once and evaluated for every
 * matching component whenever a relevant event fires.
 */
export class MissionComponentIssueChecker<
  TComponent extends MissionComponent<any, any> = MissionComponent<any, any>,
> {
  public constructor(
    /** A unique key identifying the issue this checker produces. */
    public readonly key: string,
    /** A function that produces the issue message for the component. */
    public readonly message: (component: TComponent) => string,
    /** The component types this checker applies to. */
    public readonly what: Array<Function & { prototype: TComponent }>,
    /** The events that trigger this checker to re-evaluate. */
    public readonly when: string[],
    /** A predicate that determines whether the issue is present. */
    public readonly condition: (component: TComponent) => boolean,
  ) {}
}

/* -- TYPES -- */

/**
 * Options for constructing a {@link MissionComponentIssueChecker} via
 * {@link MissionComponentIssueRegistry.check}.
 */
export type TIssueCheckerOptions<
  TComponent extends MissionComponent<any, any> = MissionComponent<any, any>,
> = {
  /**
   * A unique key identifying the issue the checker produces.
   */
  key: string
  /**
   * A function that produces the issue message for the component.
   */
  message: (component: TComponent) => string
  /**
   * The component types this checker applies to.
   */
  what: Array<Function & { prototype: TComponent }>
  /**
   * The events that trigger this checker to re-evaluate.
   * @default ['initialization']
   */
  when?: string[]
  /**
   * A predicate that determines whether the issue should be present.
   */
  if: (component: TComponent) => boolean
}
