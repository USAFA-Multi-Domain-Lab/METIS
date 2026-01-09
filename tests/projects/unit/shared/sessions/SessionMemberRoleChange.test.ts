import { describe, expect, test } from '@jest/globals'
import { MemberRole } from '@shared/sessions/members/MemberRole'
import { SessionMember } from '@shared/sessions/members/SessionMember'

describe('SessionMember role changes', () => {
  test('Immediately revokes manager-only permissions after role downgrade', () => {
    let member = TestSessionMember.createWithRole('manager')

    expect(member.isAuthorized('manageSessionMembers')).toBe(true)
    expect(member.isManager).toBe(true)

    member.role = MemberRole.AVAILABLE_ROLES.participant

    expect(member.isAuthorized('manageSessionMembers')).toBe(false)
    expect(member.isManager).toBe(false)
    expect(member.isParticipant).toBe(true)
  })

  test('Immediately grants manager-only permissions after role upgrade', () => {
    let member = TestSessionMember.createWithRole('participant')

    expect(member.isAuthorized('manageSessionMembers')).toBe(false)
    expect(member.isAuthorized('manipulateNodes')).toBe(true)
    expect(member.isParticipant).toBe(true)

    member.role = MemberRole.AVAILABLE_ROLES.manager

    expect(member.isAuthorized('manageSessionMembers')).toBe(true)
    expect(member.isAuthorized('configureSessions')).toBe(true)
    expect(member.isManager).toBe(true)
  })

  test('Role flag getters reflect the current role across transitions', () => {
    let member = TestSessionMember.createWithRole('participant')

    expect(member.isParticipant).toBe(true)
    expect(member.isLimitedObserver).toBe(false)
    expect(member.isObserver).toBe(false)
    expect(member.isManager).toBe(false)

    member.role = MemberRole.AVAILABLE_ROLES.observer_limited

    expect(member.isParticipant).toBe(false)
    expect(member.isLimitedObserver).toBe(true)
    expect(member.isObserver).toBe(false)
    expect(member.isManager).toBe(false)

    member.role = MemberRole.AVAILABLE_ROLES.observer

    expect(member.isParticipant).toBe(false)
    expect(member.isLimitedObserver).toBe(false)
    expect(member.isObserver).toBe(true)
    expect(member.isManager).toBe(false)

    member.role = MemberRole.AVAILABLE_ROLES.manager

    expect(member.isParticipant).toBe(false)
    expect(member.isLimitedObserver).toBe(false)
    expect(member.isObserver).toBe(false)
    expect(member.isManager).toBe(true)
  })
})

/**
 * Minimal test-only `SessionMember` implementation.
 */
class TestSessionMember extends SessionMember {
  public constructor(_id: string, role: MemberRole) {
    super(
      _id,
      {
        _id: 'user-1',
        username: 'test user',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        toExistingJson: () => ({
          _id: 'user-1',
          username: 'test user',
          firstName: 'Test',
          lastName: 'User',
          accessId: 'student',
          expressPermissionIds: [],
        }),
      },
      role,
      null,
      {
        mission: {
          getForceById: () => null,
        },
      },
    )
  }

  public static createWithRole(
    roleId: keyof typeof MemberRole.AVAILABLE_ROLES,
  ) {
    return new TestSessionMember('member-1', MemberRole.AVAILABLE_ROLES[roleId])
  }
}
