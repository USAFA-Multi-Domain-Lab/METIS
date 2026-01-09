import { describe, expect, test } from '@jest/globals'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'

describe('Rate limiting', () => {
  const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  test('HTTP: returns 429 when the per-IP rate limit is exceeded (and resets after window)', async () => {
    let { client } = await TestSuiteSetup.createTestContext()

    let httpRateLimit = Number(process.env.HTTP_RATE_LIMIT ?? 100)
    let httpRateLimitDurationSeconds = Number(
      process.env.HTTP_RATE_LIMIT_DURATION ?? 1,
    )
    let windowMs = Math.ceil(httpRateLimitDurationSeconds * 1000)

    // Avoid interference from previous test traffic.
    await sleep(windowMs + 250)

    let requestCount = Math.max(httpRateLimit + 50, 150)
    let responses = await Promise.all(
      Array.from({ length: requestCount }).map(() =>
        client.get('/api/v1/info/'),
      ),
    )

    let statusCodes = responses.map((r) => r.status)
    let okCount = statusCodes.filter((s) => s === 200).length
    let limitedCount = statusCodes.filter((s) => s === 429).length

    expect(okCount).toBeGreaterThan(0)
    expect(limitedCount).toBeGreaterThan(0)

    // After the window resets, requests should be allowed again.
    await sleep(windowMs + 250)

    let postReset = await client.get('/api/v1/info/')
    expect(postReset.status).toBe(200)
  }, 20000)
})
