import { describe, expect, test } from '@jest/globals'
import type { TMigratableEffect } from '@server/target-environments/TargetMigration'
import { TargetMigration } from '@server/target-environments/TargetMigration'
import { buildMigratableEffect } from 'tests/helpers/projects/unit/migrations/target-migration.helpers'

describe('TargetMigration', () => {
  test('Throws for an invalid version string', () => {
    expect(() => new TargetMigration('not-a-version', () => {})).toThrow()
    expect(() => new TargetMigration('1.0', () => {})).toThrow()
    expect(() => new TargetMigration('v1.0.0', () => {})).toThrow()
  })

  test('Accepts a valid semver version without throwing', () => {
    expect(() => new TargetMigration('1.0.0', () => {})).not.toThrow()
    expect(() => new TargetMigration('0.2.1', () => {})).not.toThrow()
  })

  test('Stores the version passed to the constructor', () => {
    let migration = new TargetMigration('1.2.3', () => {})

    expect(migration.version).toBe('1.2.3')
  })

  test('Stores the script passed to the constructor and is callable', () => {
    let args = { hostname: 'old' }
    let effect = buildMigratableEffect('0.1.0', args)
    let script = (effect: TMigratableEffect) => {
      effect.args.hostname = 'new'
    }

    let migration = new TargetMigration('1.0.0', script)
    migration.script(effect)

    expect(args.hostname).toBe('new')
  })
})
