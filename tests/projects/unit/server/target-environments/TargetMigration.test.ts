import { describe, expect, test } from '@jest/globals'
import { TargetMigration } from '@server/target-environments/TargetMigration'

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
    let script = (effectArgs: Record<any, any>) => {
      effectArgs.hostname = 'new'
    }

    let migration = new TargetMigration('1.0.0', script)
    migration.script(args)

    expect(args.hostname).toBe('new')
  })
})
