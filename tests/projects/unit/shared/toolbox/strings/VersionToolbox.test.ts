import { describe, expect, test } from '@jest/globals'
import { VersionToolbox } from '@shared/toolbox/strings/VersionToolbox'

describe('VersionToolbox', () => {
  test('Validates semantic versions', () => {
    expect(VersionToolbox.isValidVersion('0.0.1')).toBe(true)
    expect(VersionToolbox.isValidVersion('1.2.3')).toBe(true)
    expect(VersionToolbox.isValidVersion('1.2')).toBe(false)
    expect(VersionToolbox.isValidVersion('v1.2.3')).toBe(false)
  })

  test('Compares versions correctly', () => {
    expect(VersionToolbox.compareVersions('1.0.0', '1.0.0')).toBe('equal')
    expect(VersionToolbox.compareVersions('1.0.1', '1.0.0')).toBe('later')
    expect(VersionToolbox.compareVersions('1.0.0', '1.0.1')).toBe('earlier')
  })

  test('Throws for invalid versions', () => {
    expect(() => VersionToolbox.compareVersions('1.0', '1.0.0')).toThrow()
    expect(() => VersionToolbox.compareVersions('1.0.0', 'x.y.z')).toThrow()
    expect(() => VersionToolbox.compareVersions('1.0.0.0', '1.0.0')).toThrow()
    expect(() => VersionToolbox.compareVersions('1.0.0', '1.0.0.0')).toThrow()
  })

  test('Handles leading zeros according to validator', () => {
    expect(VersionToolbox.isValidVersion('01.0.0')).toBe(false)
    expect(() => VersionToolbox.compareVersions('01.0.0', '1.0.0')).toThrow()
  })
})
