import { afterEach, describe, expect, jest, test } from '@jest/globals'
import {
  UserModel,
  checkLoginLockout,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
} from '@server/database/models/users'

/* -- MOCKS -- */

// Break the circular dependency that occurs when users.ts imports from '.':
// models/index.ts → MetisDatabase → MetisFileStore → file-references.ts → models/index.ts
// (causing buildToJson to be undefined on re-entry).
jest.mock('@server/database/models', () => ({
  buildToJson: jest.fn(() => (_doc: any, ret: any) => ret),
  excludeDeletedForFinds: jest.fn(),
  excludeSensitiveForFinds: jest.fn(),
  populateCreatedByIfFlagged: jest.fn(),
  ensureNoNullCreatedBy: jest.fn(),
}))

jest.mock('@server/logging', () => ({
  databaseLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

/**
 * Builds a minimal mock exec chain compatible with Mongoose query chaining.
 * @param doc The document to resolve with.
 * @returns An object with an exec method that resolves to the given document.
 */
function makeExecReturning(doc: any) {
  return { exec: jest.fn<any>().mockResolvedValue(doc) }
}

/* -- checkLoginLockout -- */

describe('checkLoginLockout', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('Returns isLocked false and null unlockTime when loginLockedUntil is not set', async () => {
    jest
      .spyOn(UserModel, 'findById')
      .mockReturnValue(makeExecReturning({ loginLockedUntil: null }) as any)

    let result = await checkLoginLockout('user-id')

    expect(result).toEqual({ isLocked: false, unlockTime: null })
  })

  test('Returns isLocked true and the unlock date when loginLockedUntil is in the future', async () => {
    let futureDate = new Date(Date.now() + 10 * 60 * 1000)
    jest
      .spyOn(UserModel, 'findById')
      .mockReturnValue(
        makeExecReturning({ loginLockedUntil: futureDate }) as any,
      )

    let result = await checkLoginLockout('user-id')

    expect(result).toEqual({ isLocked: true, unlockTime: futureDate })
  })

  test('Returns isLocked false and null unlockTime when loginLockedUntil is in the past', async () => {
    let pastDate = new Date(Date.now() - 1000)
    jest
      .spyOn(UserModel, 'findById')
      .mockReturnValue(makeExecReturning({ loginLockedUntil: pastDate }) as any)
    jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)

    let result = await checkLoginLockout('user-id')

    expect(result).toEqual({ isLocked: false, unlockTime: null })
  })

  test('Clears lockout fields in the database when loginLockedUntil is in the past', async () => {
    let pastDate = new Date(Date.now() - 1000)
    jest
      .spyOn(UserModel, 'findById')
      .mockReturnValue(makeExecReturning({ loginLockedUntil: pastDate }) as any)
    let findByIdAndUpdateSpy = jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)

    await checkLoginLockout('user-id')

    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({
        loginLockedUntil: null,
        failedLoginAttempts: 0,
      }),
    )
  })

  test('Uses the provided userDoc instead of querying when options.userDoc is given and not locked', async () => {
    let findByIdSpy = jest.spyOn(UserModel, 'findById')
    let userDoc = { loginLockedUntil: null } as any

    let result = await checkLoginLockout(userDoc)

    expect(findByIdSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ isLocked: false, unlockTime: null })
  })

  test('Uses the provided userDoc instead of querying when options.userDoc is given and locked', async () => {
    let futureDate = new Date(Date.now() + 10 * 60 * 1000)
    let findByIdSpy = jest.spyOn(UserModel, 'findById')
    let userDoc = { loginLockedUntil: futureDate } as any

    let result = await checkLoginLockout(userDoc)

    expect(findByIdSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ isLocked: true, unlockTime: futureDate })
  })
})

/* -- recordFailedLoginAttempt -- */

describe('recordFailedLoginAttempt', () => {
  const MAX_ATTEMPTS = 5
  const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in ms
  const ATTEMPT_WINDOW = 5 * 60 * 1000 // 5 minutes in ms

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('Increments failedLoginAttempts on each call within the attempt window', async () => {
    let recentAttemptTime = new Date(Date.now() - 60 * 1000) // 1 minute ago
    jest.spyOn(UserModel, 'findById').mockReturnValue(
      makeExecReturning({
        failedLoginAttempts: 2,
        lastFailedLoginAt: recentAttemptTime,
      }) as any,
    )
    let findByIdAndUpdateSpy = jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)

    await recordFailedLoginAttempt(
      'user-id',
      MAX_ATTEMPTS,
      LOCKOUT_DURATION,
      ATTEMPT_WINDOW,
    )

    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ failedLoginAttempts: 3 }),
      expect.anything(),
    )
  })

  test('Sets loginLockedUntil to a future date and resets failedLoginAttempts to 0 when maxAttempts is reached', async () => {
    let recentAttemptTime = new Date(Date.now() - 60 * 1000)
    jest.spyOn(UserModel, 'findById').mockReturnValue(
      makeExecReturning({
        failedLoginAttempts: 4, // this call makes it 5 — the threshold
        lastFailedLoginAt: recentAttemptTime,
      }) as any,
    )
    let findByIdAndUpdateSpy = jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)

    let before = Date.now()
    await recordFailedLoginAttempt(
      'user-id',
      MAX_ATTEMPTS,
      LOCKOUT_DURATION,
      ATTEMPT_WINDOW,
    )
    let after = Date.now()

    let updateArg = findByIdAndUpdateSpy.mock.calls[0][1] as any
    expect(updateArg.failedLoginAttempts).toBe(0)
    expect(updateArg.loginLockedUntil).toBeInstanceOf(Date)
    expect(updateArg.loginLockedUntil.getTime()).toBeGreaterThanOrEqual(
      before + LOCKOUT_DURATION,
    )
    expect(updateArg.loginLockedUntil.getTime()).toBeLessThanOrEqual(
      after + LOCKOUT_DURATION,
    )
  })

  test('Resets the attempt counter to 1 when the last failed attempt was outside the attempt window', async () => {
    let oldAttemptTime = new Date(Date.now() - ATTEMPT_WINDOW - 1000) // expired window
    jest.spyOn(UserModel, 'findById').mockReturnValue(
      makeExecReturning({
        failedLoginAttempts: 3,
        lastFailedLoginAt: oldAttemptTime,
      }) as any,
    )
    let findByIdAndUpdateSpy = jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)

    await recordFailedLoginAttempt(
      'user-id',
      MAX_ATTEMPTS,
      LOCKOUT_DURATION,
      ATTEMPT_WINDOW,
    )

    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ failedLoginAttempts: 1 }),
      expect.anything(),
    )
  })

  test('Uses the provided userDoc instead of querying when a doc is passed directly', async () => {
    let recentAttemptTime = new Date(Date.now() - 60 * 1000)
    let findByIdSpy = jest.spyOn(UserModel, 'findById')
    let findByIdAndUpdateSpy = jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)
    let userDoc = {
      id: 'user-id',
      failedLoginAttempts: 1,
      lastFailedLoginAt: recentAttemptTime,
    } as any

    await recordFailedLoginAttempt(
      userDoc,
      MAX_ATTEMPTS,
      LOCKOUT_DURATION,
      ATTEMPT_WINDOW,
    )

    expect(findByIdSpy).not.toHaveBeenCalled()
    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ failedLoginAttempts: 2 }),
      expect.anything(),
    )
  })
})

/* -- resetFailedLoginAttempts -- */

describe('resetFailedLoginAttempts', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('Sets failedLoginAttempts to 0, lastFailedLoginAt to null, and loginLockedUntil to null', async () => {
    let findByIdAndUpdateSpy = jest
      .spyOn(UserModel, 'findByIdAndUpdate')
      .mockReturnValue(makeExecReturning(null) as any)

    await resetFailedLoginAttempts('user-id')

    expect(findByIdAndUpdateSpy).toHaveBeenCalledWith('user-id', {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      loginLockedUntil: null,
    })
  })
})
