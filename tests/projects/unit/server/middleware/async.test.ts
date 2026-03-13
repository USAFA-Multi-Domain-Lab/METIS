import { describe, expect, jest, test } from '@jest/globals'
import { asyncHandler } from '@server/middleware/async'

describe('asyncHandler', () => {
  test('Does not call next when the wrapped handler resolves successfully', async () => {
    let handler = jest.fn<any>().mockResolvedValue(undefined)
    let request: any = {}
    let response: any = {}
    let next = jest.fn()

    await asyncHandler(handler)(request, response, next)

    expect(next).not.toHaveBeenCalled()
  })

  test('Calls next with the error when the wrapped handler rejects', async () => {
    let error = new Error('something went wrong')
    let handler = jest.fn<any>().mockRejectedValue(error)
    let request: any = {}
    let response: any = {}
    let next = jest.fn()

    await asyncHandler(handler)(request, response, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(error)
  })
})
