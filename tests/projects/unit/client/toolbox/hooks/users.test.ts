import { useUserTextField } from '@client/toolbox/hooks/users'
import { ClientUser } from '@client/users/ClientUser'
import { describe, expect, jest, test } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

// The module the hook takes `usePostInitEffect` from imports the global
// context at its top, so the context has to stand in for it. Nothing else
// here is mocked.
jest.mock('@client/context/global', () => ({
  useGlobalContext: () => ({ actions: {} }),
}))

/**
 * Stands in for the re-render the page hands the hook. Nothing here reads
 * what it does, only that the hook can be given one.
 */
const forceUpdate = () => {}

/**
 * Shown beneath the username field when the username is malformed.
 */
const INVALID_USERNAME_MESSAGE: string = 'That username cannot be used.'

describe('useUserTextField', () => {
  /* -- UNTOUCHED FIELDS -- */

  test('Leaves a property alone while its field has not been edited', () => {
    let user = ClientUser.createNew({ passwordIsRequired: true })
    let { result, rerender } = renderHook(() =>
      useUserTextField({ user, property: 'password1', forceUpdate }),
    )

    // The field displays an empty string without putting one on the user,
    // which is what keeps an untouched password out of the request.
    expect(result.current.value).toBe('')
    expect(user.password1).toBeUndefined()

    rerender()

    expect(user.password1).toBeUndefined()
  })

  /* -- EDITED FIELDS -- */

  test('Writes the empty string onto the user when an edited field is cleared', () => {
    let user = ClientUser.createNew({ passwordIsRequired: true })
    let { result } = renderHook(() =>
      useUserTextField({ user, property: 'password1', forceUpdate }),
    )

    act(() => result.current.setValue('correcthorse'))

    expect(user.password1).toBe('correcthorse')

    act(() => result.current.setValue(''))

    // An empty string rather than undefined is the whole point: the user
    // cleared the field on purpose, and that is not the same as never
    // having touched it.
    expect(user.password1).toBe('')
  })

  test('Writes a value it reports as unacceptable onto the user', () => {
    let user = ClientUser.createNew({ passwordIsRequired: true })
    let { result } = renderHook(() =>
      useUserTextField({
        user,
        property: 'username',
        forceUpdate,
        isValid: (user) => user.hasValidUsername,
        invalidMessage: INVALID_USERNAME_MESSAGE,
      }),
    )

    act(() => result.current.setValue('abc'))

    expect(user.username).toBe('abc')
    expect(user.hasValidUsername).toBe(false)
    expect(result.current.errorMessage).toBe(INVALID_USERNAME_MESSAGE)
  })

  test('Reports a change only once the value is acceptable', () => {
    let user = ClientUser.createNew({ passwordIsRequired: true })
    let onChange = jest.fn<() => void>()
    let { result } = renderHook(() =>
      useUserTextField({
        user,
        property: 'username',
        forceUpdate,
        isValid: (user) => user.hasValidUsername,
        invalidMessage: INVALID_USERNAME_MESSAGE,
        onChange,
      }),
    )

    act(() => result.current.setValue('abc'))

    expect(onChange).not.toHaveBeenCalled()

    act(() => result.current.setValue('abcde'))

    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
