import { describe, expect, test } from '@jest/globals'
import { TargetMigrationRegistry } from '@server/target-environments/TargetMigrationRegistry'

describe('TargetMigrationRegistry', () => {
  describe('.versions', () => {
    test('Is empty on a freshly constructed registry', () => {
      let registry = new TargetMigrationRegistry()

      expect(registry.versions).toEqual([])
    })

    test('Contains the version after register() is called', () => {
      let registry = new TargetMigrationRegistry()
      registry.register('1.0.0', () => {})

      expect(registry.versions).toContain('1.0.0')
    })

    test('Contains all versions when chaining register() calls', () => {
      let registry = new TargetMigrationRegistry()
      registry.register('1.0.0', () => {}).register('2.0.0', () => {})

      expect(registry.versions).toContain('1.0.0')
      expect(registry.versions).toContain('2.0.0')
      expect(registry.versions).toHaveLength(2)
    })
  })

  describe('.migrate()', () => {
    test('Runs the registered script and mutates the args in place', () => {
      let registry = new TargetMigrationRegistry()
      registry.register('1.0.0', (effectArgs) => {
        effectArgs.renamed = effectArgs.original
        delete effectArgs.original
      })

      let args = { original: 42 }
      registry.migrate('1.0.0', args)

      expect(args).toEqual({ renamed: 42 })
    })

    test('Does not throw and leaves args unchanged for an unknown version', () => {
      let registry = new TargetMigrationRegistry()

      let args = { value: 'unchanged' }
      registry.migrate('9.9.9', args)

      expect(args).toEqual({ value: 'unchanged' })
    })

    test('Applies migrations in sequence when called for multiple versions', () => {
      let registry = new TargetMigrationRegistry()
      registry
        .register('1.0.0', (effectArgs) => {
          effectArgs.step = 'first'
        })
        .register('2.0.0', (effectArgs) => {
          effectArgs.step = effectArgs.step + '-second'
        })

      let args: Record<string, any> = {}
      registry.migrate('1.0.0', args)
      registry.migrate('2.0.0', args)

      expect(args.step).toBe('first-second')
    })
  })
})
