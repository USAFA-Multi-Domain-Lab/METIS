import { beforeEach, describe, expect, test } from '@jest/globals'
import type { MissionComponent } from '@shared/missions/MissionComponent'
import { MissionComponentIssueRegistry } from '@shared/missions/MissionComponentIssueRegistry'

/**
 * Casts a lightweight fake to the {@link MissionComponent} shape the registry
 * API expects. The registry only ever uses an `instanceof` check against the
 * types passed as `what` and the object's identity as a map key, so a bare
 * class instance is enough to exercise it in isolation without constructing a
 * full mission.
 */
function asComponent(instance: object): MissionComponent<any, any> {
  return instance as unknown as MissionComponent<any, any>
}

/**
 * Two distinct fake component types so that type-based checker matching can be
 * verified independently of any real mission component.
 */
class FakeEffect {}
class FakeNode {}

describe('MissionComponentIssueRegistry', () => {
  let registry: MissionComponentIssueRegistry

  beforeEach(() => {
    registry = new MissionComponentIssueRegistry()
  })

  test('adds an issue to a matching component when a registered checker is triggered', () => {
    let effect = asComponent(new FakeEffect())
    registry.check({
      key: 'broken',
      message: () => 'It is broken.',
      what: [FakeEffect] as any,
      when: ['check'],
      if: () => true,
    })

    registry.trigger('check', effect)

    expect(registry.componentHasIssue(effect, 'broken')).toBe(true)
    expect(registry.getMessage('broken', effect)).toBe('It is broken.')
  })

  test('applies a single registered checker to every matching component and ignores non-matching types', () => {
    registry.check({
      key: 'broken',
      message: () => 'broken',
      what: [FakeEffect] as any,
      when: ['check'],
      if: () => true,
    })

    let effects = [
      asComponent(new FakeEffect()),
      asComponent(new FakeEffect()),
      asComponent(new FakeEffect()),
    ]
    let node = asComponent(new FakeNode())

    for (let effect of effects) registry.trigger('check', effect)
    registry.trigger('check', node)

    for (let effect of effects) {
      expect(registry.componentHasIssue(effect, 'broken')).toBe(true)
    }
    // The node is not one of the checker's `what` types, so it is left alone.
    expect(registry.componentHasIssue(node, 'broken')).toBe(false)
    expect(registry.allIssues).toHaveLength(3)
  })

  test('re-evaluates a checker only when one of its `when` triggers fires', () => {
    let conditionMet = true
    registry.check({
      key: 'broken',
      message: () => 'broken',
      what: [FakeEffect] as any,
      when: ['relevant'],
      if: () => conditionMet,
    })
    let effect = asComponent(new FakeEffect())

    // An unrelated trigger must not evaluate the checker, even though the
    // condition currently holds.
    registry.trigger('irrelevant', effect)
    expect(registry.componentHasIssue(effect, 'broken')).toBe(false)

    // The matching trigger evaluates the checker and adds the issue.
    registry.trigger('relevant', effect)
    expect(registry.componentHasIssue(effect, 'broken')).toBe(true)
  })

  test('removes a previously added issue once the checker condition becomes false', () => {
    let conditionMet = true
    registry.check({
      key: 'broken',
      message: () => 'broken',
      what: [FakeEffect] as any,
      when: ['check'],
      if: () => conditionMet,
    })
    let effect = asComponent(new FakeEffect())

    registry.trigger('check', effect)
    expect(registry.componentHasIssue(effect, 'broken')).toBe(true)

    conditionMet = false
    registry.trigger('check', effect)
    expect(registry.componentHasIssue(effect, 'broken')).toBe(false)
    // With no issues left, the component is dropped from the registry entirely.
    expect(registry.allIssues).toHaveLength(0)
  })

  test('deduplicates issues by key so re-triggering does not create duplicates', () => {
    registry.check({
      key: 'broken',
      message: () => 'broken',
      what: [FakeEffect] as any,
      when: ['check'],
      if: () => true,
    })
    let effect = asComponent(new FakeEffect())

    registry.trigger('check', effect)
    registry.trigger('check', effect)
    registry.trigger('check', effect)

    expect(registry.getComponentIssues(effect)).toHaveLength(1)
  })

  test('emits a `change` event only when the issue set actually changes', () => {
    let changeEvents = 0
    let conditionMet = true
    registry.addEventListener('change', () => {
      changeEvents += 1
    })
    registry.check({
      key: 'broken',
      message: () => 'broken',
      what: [FakeEffect] as any,
      when: ['check'],
      if: () => conditionMet,
    })
    let effect = asComponent(new FakeEffect())

    // Adding the issue modifies the set.
    registry.trigger('check', effect)
    expect(changeEvents).toBe(1)

    // Re-triggering with the same outcome produces no net change.
    registry.trigger('check', effect)
    expect(changeEvents).toBe(1)

    // Removing the issue modifies the set again.
    conditionMet = false
    registry.trigger('check', effect)
    expect(changeEvents).toBe(2)
  })
})
