import { RestApi } from '@integrations/api/RestApi'
import { describe, expect, test } from '@jest/globals'

describe('RestApi URL building', () => {
  test('fromConfig() falls back to localhost on the default port when no host is given', () => {
    expect(RestApi.fromConfig({}).baseUrl).toBe('http://localhost:80')
    expect(RestApi.fromConfig({ protocol: 'https' }).baseUrl).toBe(
      'https://localhost:443',
    )
    expect(RestApi.fromConfig({ port: 3000 }).baseUrl).toBe(
      'http://localhost:3000',
    )
  })

  test('A host without a port gets the port property or the default port', () => {
    expect(RestApi.fromConfig({ host: 'example.com' }).baseUrl).toBe(
      'http://example.com:80',
    )
    expect(
      RestApi.fromConfig({ protocol: 'https', host: 'example.com' }).baseUrl,
    ).toBe('https://example.com:443')
    expect(
      RestApi.fromConfig({ host: 'example.com', port: 9000 }).baseUrl,
    ).toBe('http://example.com:9000')
  })

  test('A port included in the host takes precedence over the port property', () => {
    expect(RestApi.fromConfig({ host: 'example.com:9000' }).baseUrl).toBe(
      'http://example.com:9000',
    )
    expect(
      RestApi.fromConfig({ host: 'example.com:9000', port: 1234 }).baseUrl,
    ).toBe('http://example.com:9000')
  })

  test('The port is placed before a path included in the host', () => {
    expect(RestApi.fromConfig({ host: 'example.com/api' }).baseUrl).toBe(
      'http://example.com:80/api',
    )
    expect(
      RestApi.fromConfig({ protocol: 'https', host: 'example.com/api' })
        .baseUrl,
    ).toBe('https://example.com:443/api')
    expect(
      RestApi.fromConfig({ host: 'example.com/api', port: 9000 }).baseUrl,
    ).toBe('http://example.com:9000/api')
    expect(RestApi.fromConfig({ host: 'example.com:9000/api' }).baseUrl).toBe(
      'http://example.com:9000/api',
    )
  })

  test('A colon and number inside the path is not mistaken for a port', () => {
    expect(RestApi.fromConfig({ host: 'example.com/api:1234' }).baseUrl).toBe(
      'http://example.com:80/api:1234',
    )
  })

  test('Bracketed IPv6 addresses get a port only when they lack one', () => {
    expect(RestApi.fromConfig({ host: '[::1]' }).baseUrl).toBe(
      'http://[::1]:80',
    )
    expect(RestApi.fromConfig({ host: '[::1]:9000/api' }).baseUrl).toBe(
      'http://[::1]:9000/api',
    )
  })
})
