import { describe, expect, test } from '@jest/globals'
import { TargetMigrationRegistry } from '@server/target-environments/TargetMigrationRegistry'
import { buildMigratableEffect } from 'tests/helpers/projects/unit/migrations/target-migration.helpers'

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
          const arg = effect.arguments.find((a) => a.parameterId === 'original')
          if (arg) arg.parameterId = 'renamed'
        },
      )
      let effect = buildMigratableEffect('0.9.0', [
        { _id: '1', parameterId: 'original', type: 'number', value: 42 },
      ])

      registry.migrate(effect)

      expect(effect.result.data[0].parameterId).toBe('renamed')
    })

    test('Does not throw and leaves args unchanged for an unregistered version', () => {
      let registry = new TargetMigrationRegistry()
      let effect = buildMigratableEffect('9.9.9', [
        { _id: '1', parameterId: 'value', type: 'string', value: 'unchanged' },
      ])

      registry.migrate(effect)

      expect(effect.result.data[0].value).toBe('unchanged')
    })

    test('Does not throw and leaves args unchanged for a later version.', () => {
      let registry = new TargetMigrationRegistry().register(
        '2.0.0',
        (effect) => {
          const arg = effect.arguments.find((a) => a.parameterId === 'updated')
          if (arg && arg.type === 'boolean') arg.value = true
        },
      )
      let effect = buildMigratableEffect('3.0.0', [
        { _id: '1', parameterId: 'updated', type: 'boolean', value: false },
      ])

      registry.migrate(effect)

      expect(effect.result.data[0].value).toBe(false)
    })

    test('Applies migrations in sequence when called for multiple versions', () => {
      let registry = new TargetMigrationRegistry()
      registry
        .register('1.0.0', (effect) => {
          const arg = effect.arguments.find((a) => a.parameterId === 'step')
          if (arg && arg.type === 'string') arg.value = 'first'
        })
        .register('2.0.0', (effect) => {
          const arg = effect.arguments.find((a) => a.parameterId === 'step')
          if (arg && arg.type === 'string') arg.value = arg.value + '-second'
        })
      let effect = buildMigratableEffect('0.9.0', [
        { _id: '1', parameterId: 'step', type: 'string', value: '' },
      ])

      registry.migrate(effect)

      expect(effect.result.data[0].value).toBe('first-second')
    })
  })
})
