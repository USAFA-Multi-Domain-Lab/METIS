import { describe, expect, test } from '@jest/globals'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'
import { TargetMigrationRegistry } from '@server/target-environments/TargetMigrationRegistry'

function buildMigratableEffect(
  version: string,
  args: Record<string, any>,
): TMigratableEffect {
  const effect: TMigratableEffect = {
    args,
    versionCursor: version,
    get result() {
      return { version: this.versionCursor, data: this.args }
    },
  } as TMigratableEffect
  return effect
}

describe('TargetMigrationRegistry', () => {
  describe('.versions', () => {
    test('Contains the version after register() is called', () => {
      let registry = new TargetMigrationRegistry().register('1.0.0', () => {})
      expect(registry.versions).toContain('1.0.0')
    })

    test('Contains all versions when chaining register() calls', () => {
      let registry = new TargetMigrationRegistry()
        .register('1.0.0', () => {})
        .register('2.0.0', () => {})

      expect(registry.versions).toContain('1.0.0')
      expect(registry.versions).toContain('2.0.0')
      expect(registry.versions).toHaveLength(2)
    })
  })

  describe('.migrate()', () => {
    test('Runs the registered script and results reflect changes', () => {
      let registry = new TargetMigrationRegistry().register(
        '1.0.0',
        (effect) => {
          effect.args.renamed = effect.args.original
          delete effect.args.original
        },
      )
      let args = { original: 42 }
      let effect = buildMigratableEffect('0.9.0', args)

      registry.migrate(effect)

      expect(effect.result.data).toEqual({ renamed: 42 })
    })

    test('Does not throw and leaves args unchanged for an unregistered version', () => {
      let registry = new TargetMigrationRegistry()
      let effect = buildMigratableEffect('9.9.9', { value: 'unchanged' })

      registry.migrate(effect)

      expect(effect.result.data).toEqual({ value: 'unchanged' })
    })

    test('Does not throw and leaves args unchanged for a later version.', () => {
      let registry = new TargetMigrationRegistry().register(
        '2.0.0',
        (effect) => {
          effect.args.updated = true
        },
      )
      let effect = buildMigratableEffect('3.0.0', { updated: false })

      registry.migrate(effect)

      expect(effect.result.data).toEqual({ updated: false })
    })

    test('Applies migrations in sequence when called for multiple versions', () => {
      let registry = new TargetMigrationRegistry()
      registry
        .register('1.0.0', (effect) => {
          effect.args.step = 'first'
        })
        .register('2.0.0', (effect) => {
          effect.args.step = effect.args.step + '-second'
        })
      let effect = buildMigratableEffect('0.9.0', {})

      registry.migrate(effect)

      expect(effect.result.data.step).toBe('first-second')
    })
  })
})
