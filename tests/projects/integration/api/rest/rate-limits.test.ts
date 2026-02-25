import { describe, expect, test } from '@jest/globals'
import { TestSuiteSetup } from 'tests/middleware/TestSuiteSetup'
import { TestToolbox } from 'tests/toolbox/TestToolbox'

describe('Rate limiting', () => {
  const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  test('HTTP: returns 429 when the per-IP rate limit is exceeded (and resets the user web session)', async () => {
    let { client } = await TestSuiteSetup.createTestContext()

    let username = `test_http_rate_limit_${TestToolbox.generateRandomId()}`
    let password = TestToolbox.DEFAULT_PASSWORD

    await TestSuiteSetup.createTestUser({
      username,
      password,
      accessId: 'instructor',
    })

    let loginResponse = await client.post('/api/v1/logins/', {
      username,
      password,
    })
    expect(loginResponse.status).toBe(200)

    let changelogBefore = await client.get('/api/v1/info/changelog/')
    expect(changelogBefore.status).toBe(200)

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

    // After the window resets, the user should be logged out.
    await sleep(windowMs + 250)

    let postResetChangelog = await client.get('/api/v1/info/changelog/')
    expect(postResetChangelog.status).toBe(401)
  }, 20000)
})
