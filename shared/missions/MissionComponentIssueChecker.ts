import type { MissionComponent } from './MissionComponent'

/**
 * Defines a condition-based rule for generating issues on components
 * that match the specified types. Registered with
 * {@link MissionComponentIssueRegistry} once and evaluated for every
 * matching component whenever a relevant trigger fires.
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
    /** The triggers that cause this checker to re-evaluate. */
    public readonly when: string[],
    /** A predicate that determines whether the issue is present. */
    public readonly condition: (component: TComponent) => boolean,
  ) {}
}

