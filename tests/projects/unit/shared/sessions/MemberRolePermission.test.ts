import { describe, expect, test } from '@jest/globals'
import { MemberPermission } from '@shared/sessions/members/MemberPermission'
import { MemberRole } from '@shared/sessions/members/MemberRole'

describe('MemberPermission.hasPermissions', () => {
  test('Returns true when the member has the required permission', () => {
    let memberPermissions = MemberPermission.get(['manipulateNodes'])

    let allowed = MemberPermission.hasPermissions(
      memberPermissions,
      'manipulateNodes',
    )

    expect(allowed).toBe(true)
  })

  test('Returns false when the member lacks the required permission', () => {
    let memberPermissions = MemberPermission.get(['forceAssignable'])

    let allowed = MemberPermission.hasPermissions(
      memberPermissions,
      'manipulateNodes',
    )

    expect(allowed).toBe(false)
  })

  test('Returns false for unknown permission ids', () => {
    let memberPermissions = MemberPermission.get(['forceAssignable'])

    let allowed = MemberPermission.hasPermissions(
      memberPermissions,
      'totally_fake_perm' as any,
    )

    expect(allowed).toBe(false)
  })

  test('Treats empty required permission list as satisfied', () => {
    let memberPermissions = MemberPermission.get(['forceAssignable'])

    let allowed = MemberPermission.hasPermissions(memberPermissions, [])

    expect(allowed).toBe(true)
  })
})

describe('MemberRole.isAuthorized', () => {
  test('Returns true when role has the permission', () => {
    let roles = MemberRole.AVAILABLE_ROLES
    let permissions = MemberPermission.AVAILABLE_PERMISSIONS

    let manager = roles.manager

    expect(manager.isAuthorized('manipulateNodes')).toBe(true)
    expect(manager.isAuthorized([permissions.cheats])).toBe(true)
  })

  test('Allows common manager-only permissions', () => {
    let manager = MemberRole.AVAILABLE_ROLES.manager

    expect(manager.isAuthorized('manageSessionMembers')).toBe(true)
    expect(manager.isAuthorized('startEndSessions')).toBe(true)
  })

  test('Reflects role-specific session permissions', () => {
    let roles = MemberRole.AVAILABLE_ROLES

    expect(roles.participant.isAuthorized('manipulateNodes')).toBe(true)

    expect(roles.observer.isAuthorized('completeVisibility')).toBe(true)
    expect(roles.observer.isAuthorized('manipulateNodes')).toBe(false)

    expect(roles.observer_limited.isAuthorized('completeVisibility')).toBe(
      false,
    )
  })

  test('Requires all permissions when an array is provided', () => {
    let manager = MemberRole.AVAILABLE_ROLES.manager

    expect(manager.isAuthorized(['manipulateNodes', 'configureSessions'])).toBe(
      true,
    )
    expect(manager.isAuthorized(['manipulateNodes', 'roleAssignable'])).toBe(
      false,
    )
  })

  test('Treats an empty required list as satisfied', () => {
    let observerLimited = MemberRole.AVAILABLE_ROLES.observer_limited

    expect(observerLimited.isAuthorized([])).toBe(true)
  })

  test('Returns false when role lacks the permission', () => {
    let roles = MemberRole.AVAILABLE_ROLES

    let observerLimited = roles.observer_limited

    expect(observerLimited.isAuthorized('manipulateNodes')).toBe(false)
  })

  test('Returns false for unknown permission ids without throwing', () => {
    let roles = MemberRole.AVAILABLE_ROLES

    let participant = roles.participant

    expect(() =>
      participant.isAuthorized('totally_fake_perm' as any),
    ).not.toThrow()
    expect(participant.isAuthorized('totally_fake_perm' as any)).toBe(false)
  })
})
