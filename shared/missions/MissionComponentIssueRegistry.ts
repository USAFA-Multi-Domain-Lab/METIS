import {
  EventManager,
  type TListenerTargetEmittable,
} from '../events/EventManager'
import type { MissionComponent } from './MissionComponent'
import { MissionComponentIssue } from './MissionComponentIssue'
import { MissionComponentIssueChecker } from './MissionComponentIssueChecker'

/**
 * A centralized registry of {@link MissionComponentIssue} instances
 * for all components within a mission. Checkers are registered once and
 * apply to every component that matches their {@link MissionComponentIssueChecker.what},
 * so memory scales with the number of rules, not the number of components.
 *
 * Implements {@link TListenerTargetEmittable} with a single `'change'` event
 * that fires whenever the issue set is modified.
 */
export class MissionComponentIssueRegistry implements TListenerTargetEmittable<TMissionIssueRegistryEvent> {
  /**
   * The checkers registered with this registry, evaluated on each {@link trigger} call.
   */
  private _checkers: MissionComponentIssueChecker<any>[] = []

  /**
   * The current issues keyed by the component they belong to.
   */
  private _issues: Map<
    MissionComponent<any, any>,
    MissionComponentIssue<any>[]
  > = new Map()

  /**
   * All issues currently in the registry across all components.
   */
  public get allIssues(): MissionComponentIssue<any>[] {
    return [...this._issues.values()].flat()
  }

  /**
   * Manages {@link TListenerTargetEmittable} event listeners for this registry.
   */
  private eventManager: EventManager<TMissionIssueRegistryEvent>

  public constructor() {
    this.eventManager = new EventManager(this)
    this.addEventListener = this.eventManager.addEventListener
    this.removeEventListener = this.eventManager.removeEventListener
    this.emitEvent = this.eventManager.emitEvent
  }

  // Implemented
  public addEventListener: TListenerTargetEmittable<TMissionIssueRegistryEvent>['addEventListener']

  // Implemented
  public removeEventListener: TListenerTargetEmittable<TMissionIssueRegistryEvent>['removeEventListener']

  // Implemented
  public emitEvent: TListenerTargetEmittable<TMissionIssueRegistryEvent>['emitEvent']

  /**
   * Constructs a {@link MissionComponentIssueChecker} from the provided options
   * and registers it with this registry.
   * @param options Options for the checker.
   * @returns Itself for chaining.
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
    this._checkers.push(
      new MissionComponentIssueChecker<TComponent>(
        key,
        message,
        what,
        when,
        condition,
      ),
    )
    return this
  }

  /**
   * Re-evaluates all checkers whose {@link MissionComponentIssueChecker.when}
   * list includes the trigger name and whose
   * {@link MissionComponentIssueChecker.what} matches the component type.
   * Matching issues are removed if no longer relevant or added if newly
   * relevant. Fires a `'change'` event if the issue set for the component
   * was modified.
   * @param triggerName The trigger to fire.
   * @param component The component for which to fire the trigger.
   */
  public trigger(
    triggerName: string,
    component: MissionComponent<any, any>,
  ): void {
    let changed = false

    // Loop through all checkers and evaluate those
    // that match the trigger and component type.
    for (let checker of this._checkers) {
      if (
        checker.what.some((type) => component instanceof type) &&
        checker.when.includes(triggerName)
      ) {
        let componentIssues = this._issues.get(component) ?? []
        let hasIssue = componentIssues.some(
          (issue) => issue.key === checker.key,
        )
        let shouldHaveIssue = checker.condition(component)

        // Skip if the current state is correct for this checker.
        if (hasIssue === shouldHaveIssue) continue

        // If the issue needs to be there, add it.
        if (shouldHaveIssue) {
          componentIssues = [
            ...componentIssues,
            new MissionComponentIssue(
              checker.key,
              'general',
              checker.message(component),
              component,
            ),
          ]
        }
        // If the issue shouldn't be there, remove it.
        else {
          componentIssues = componentIssues.filter(
            (issue) => issue.key !== checker.key,
          )
        }

        changed = true

        // Update the registry with the new issue set
        // for the component. If there are no issues
        // for the component, exclude the component from
        // the registry entirely.
        if (componentIssues.length > 0) {
          this._issues.set(component, componentIssues)
        } else {
          this._issues.delete(component)
        }
      }
    }

    if (changed) {
      this.emitEvent('change')
    }
  }

  /**
   * Returns all issues currently registered for the provided component.
   * @param component The component to retrieve issues for.
   */
  public getFor<TComponent extends MissionComponent<any, any>>(
    component: TComponent,
  ): MissionComponentIssue<TComponent>[] {
    return this._issues.get(component) ?? []
  }

  /**
   * Handles the deletion of a component by removing it from the
   * registry, if present.
   * @param component The component that was deleted.
   * @note Emits a `'change'` event if the component was
   * present in the registry.
   */
  public onDelete(component: MissionComponent<any, any>): void {
    if (this._issues.has(component)) {
      this._issues.delete(component)
      this.emitEvent('change')
    }
  }
}

/* -- TYPES -- */

/**
 * Events emitted by {@link MissionComponentIssueRegistry}.
 */
export type TMissionIssueRegistryEvent = 'change'

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
   * The triggers that cause this checker to re-evaluate.
   * @default ['initialization']
   */
  when?: string[]
  /**
   * A predicate that determines whether the issue is present.
   */
  if: (component: TComponent) => boolean
}
