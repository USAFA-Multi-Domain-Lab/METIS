import { describe, expect, test } from '@jest/globals'

describe('MetisServer class.', () => {
  test('MetisServer has defined port.', async () => {
    let metisServer = await useMetisServer()

    expect(metisServer.port).toBeDefined()
  })

  test('MetisServer has defined host.', async () => {
    let metisServer = await useMetisServer()

    expect(metisServer.envType).toBe('test')
  })
})
