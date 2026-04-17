import { describe, expect, test } from '@jest/globals'
import {
  clientEventSchemas,
  looseEventSchema,
} from '@server/connect/middleware/validate'
import { MemberRole } from '@shared/sessions/members/MemberRole'

describe('looseEventSchema', () => {
  test('Accepts a valid method with arbitrary data and extra keys', () => {
    let parsed = looseEventSchema.parse({
      method: 'request-current-session',
      data: { any: 'value' },
      requestId: 'req-1',
      extra: { nested: true },
    })

    expect(parsed.method).toBe('request-current-session')
    expect(parsed.data).toEqual({ any: 'value' })
    expect(parsed.requestId).toBe('req-1')
  })

  test('Rejects an unknown method', () => {
    expect(() =>
      looseEventSchema.parse({
        method: 'request-not-a-real-method',
        data: {},
      }),
    ).toThrow()
  })

  test('Rejects non-object payloads', () => {
    expect(() => looseEventSchema.parse('nope' as any)).toThrow()
    expect(() => looseEventSchema.parse(null as any)).toThrow()
  })
})

describe('clientEventSchemas', () => {
  test('Requires requestId for request events', () => {
    expect(() =>
      clientEventSchemas['request-current-session'].parse({
        method: 'request-current-session',
        data: {},
      }),
    ).toThrow()
  })

  test('Rejects invalid role IDs for request-assign-role', () => {
    expect(() =>
      clientEventSchemas['request-assign-role'].parse({
        method: 'request-assign-role',
        requestId: 'req-1',
        data: {
          memberId: 'member-1',
          roleId: 'not-a-real-role',
        },
      }),
    ).toThrow()

    let parsed = clientEventSchemas['request-assign-role'].parse({
      method: 'request-assign-role',
      requestId: 'req-2',
      data: {
        memberId: 'member-1',
        roleId: MemberRole.AVAILABLE_ROLE_IDS[0],
      },
    })

    expect(parsed.data.roleId).toBe(MemberRole.AVAILABLE_ROLE_IDS[0])
  })

  test('Rejects invalid accessibility in request-config-update', () => {
    expect(() =>
      clientEventSchemas['request-config-update'].parse({
        method: 'request-config-update',
        requestId: 'req-1',
        data: {
          config: {
            accessibility: 'definitely-not-valid',
          },
        },
      }),
    ).toThrow()
  })

  test('Allows valid request-config-update with partial config', () => {
    let parsed = clientEventSchemas['request-config-update'].parse({
      method: 'request-config-update',
      requestId: 'req-1',
      data: {
        config: {
          name: 'New name',
          disabledTargetEnvs: ['metis'],
          infiniteResources: true,
        },
      },
    })

    expect(parsed.data.config.name).toBe('New name')
    expect(parsed.data.config.disabledTargetEnvs).toEqual(['metis'])
    expect(parsed.data.config.infiniteResources).toBe(true)
  })
})
