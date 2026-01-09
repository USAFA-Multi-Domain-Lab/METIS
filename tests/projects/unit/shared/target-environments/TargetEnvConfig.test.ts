import { describe, expect, test } from '@jest/globals'
import { TargetEnvConfig } from '@shared/target-environments/TargetEnvConfig'

describe('TargetEnvConfig.schema', () => {
  test('Defaults data to an empty object', () => {
    let parsed = TargetEnvConfig.schema.parse({
      _id: 'config-1',
      name: 'Config',
      targetEnvId: 'metis',
    })

    expect(parsed.data).toEqual({})
  })

  test('Rejects empty required fields', () => {
    expect(() =>
      TargetEnvConfig.schema.parse({
        _id: '',
        name: 'Config',
        targetEnvId: 'metis',
      }),
    ).toThrow()

    expect(() =>
      TargetEnvConfig.schema.parse({
        _id: 'config-1',
        name: '',
        targetEnvId: 'metis',
      }),
    ).toThrow()

    expect(() =>
      TargetEnvConfig.schema.parse({
        _id: 'config-1',
        name: 'Config',
        targetEnvId: '',
      }),
    ).toThrow()
  })
})

describe('TargetEnvConfig helpers', () => {
  test('setTargetEnvIds overwrites the targetEnvId for each config', () => {
    let configs = [
      { _id: 'a', name: 'A', targetEnvId: 'old', data: { a: 1 } },
      { _id: 'b', name: 'B', targetEnvId: 'old', data: {} },
    ]

    let updated = TargetEnvConfig.setTargetEnvIds(configs as any, 'new')

    expect(updated.every((c) => c.targetEnvId === 'new')).toBe(true)
  })

  test('setTargetEnvIds does not mutate the original array', () => {
    let configs = [
      { _id: 'a', name: 'A', targetEnvId: 'old', data: { a: 1 } },
      { _id: 'b', name: 'B', targetEnvId: 'old', data: {} },
    ]

    let updated = TargetEnvConfig.setTargetEnvIds(configs as any, 'new')

    expect(configs.every((c) => c.targetEnvId === 'old')).toBe(true)
    expect(updated).not.toBe(configs)
    expect(updated[0]).not.toBe(configs[0])
    expect(updated[1]).not.toBe(configs[1])
  })

  test('toJson strips sensitive data', () => {
    let config = {
      _id: 'config-1',
      name: 'Config',
      targetEnvId: 'metis',
      data: { secret: 'nope', safe: 'also nope' },
    }

    let safe = TargetEnvConfig.toJson(config as any)

    expect(safe.data).toEqual({})
  })

  test('toJson preserves non-data fields and keeps empty data unchanged', () => {
    let config = {
      _id: 'config-2',
      name: 'Config 2',
      targetEnvId: 'metis',
      description: 'desc',
      data: {},
    }

    let safe = TargetEnvConfig.toJson(config as any)

    expect(safe._id).toBe('config-2')
    expect(safe.name).toBe('Config 2')
    expect(safe.targetEnvId).toBe('metis')
    expect(safe.description).toBe('desc')
    expect(safe.data).toEqual({})
  })
})
