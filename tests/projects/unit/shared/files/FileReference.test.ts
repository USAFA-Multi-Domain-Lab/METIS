import { describe, expect, test } from '@jest/globals'
import { FileReference } from '@shared/files/FileReference'

describe('FileReference', () => {
  test('Derives extension from name with multiple dots', () => {
    let fakeUser: TFakeUser = {
      toCreatedByJson: () => ({
        _id: 'u1',
        username: 'tester',
        firstName: 'Test',
        lastName: 'User',
      }),
    }

    let file = new TestFileReference({
      name: 'archive.tar.gz',
      path: 'uploads/archive.tar.gz',
      mimetype: 'application/gzip',
      size: 2048,
      createdBy: fakeUser,
    })

    expect(file.extension).toBe('.gz')
  })

  test('toJson serializes dates and createdBy correctly without mutation', () => {
    let fakeUser: TFakeUser = {
      toCreatedByJson: () => ({
        _id: 'u2',
        username: 'creator',
        firstName: 'Create',
        lastName: 'Or',
      }),
    }

    let createdAt = new Date('2023-03-01T10:00:00.000Z')
    let updatedAt = new Date('2023-04-01T10:00:00.000Z')
    let file = new TestFileReference({
      _id: 'file-2',
      name: 'diagram.png',
      path: 'uploads/diagram.png',
      mimetype: 'image/png',
      size: 4096,
      createdAt,
      updatedAt,
      createdBy: fakeUser,
      createdByUsername: 'creator',
      deleted: true,
    })

    let json = file.toJson()

    expect(json._id).toBe('file-2')
    expect(json.name).toBe('diagram.png')
    expect(json.path).toBe('uploads/diagram.png')
    expect(json.mimetype).toBe('image/png')
    expect(json.size).toBe(4096)
    expect(json.createdAt).toBe(createdAt.toISOString())
    expect(json.updatedAt).toBe(updatedAt.toISOString())
    expect(json.createdBy).toEqual({
      _id: 'u2',
      username: 'creator',
      firstName: 'Create',
      lastName: 'Or',
    })
    expect(json.createdByUsername).toBe('creator')
    expect(json.deleted).toBe(true)

    // Ensure original dates and user object were not mutated.
    expect(file.createdAt).toBe(createdAt)
    expect(file.updatedAt).toBe(updatedAt)
    expect(file.createdBy.toCreatedByJson()).toEqual({
      _id: 'u2',
      username: 'creator',
      firstName: 'Create',
      lastName: 'Or',
    })
  })
})

/**
 * Test-only FileReference implementation.
 * @note This class exists only to unit-test shared FileReference behavior.
 */
class TestFileReference extends FileReference {
  public constructor({
    _id = 'file-1',
    name = 'report.final.docx',
    path = 'uploads/report.final.docx',
    mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size = 1024,
    createdAt = new Date('2024-01-01T00:00:00.000Z'),
    updatedAt = new Date('2024-02-01T00:00:00.000Z'),
    createdBy,
    createdByUsername = 'tester',
    deleted = false,
  }: {
    _id?: string
    name?: string
    path?: string
    mimetype?: string
    size?: number
    createdAt?: Date
    updatedAt?: Date
    createdBy: TFakeUser
    createdByUsername?: string
    deleted?: boolean
  }) {
    super(
      _id,
      name,
      path,
      mimetype,
      size,
      createdAt,
      updatedAt,
      createdBy,
      createdByUsername,
      deleted,
    )
  }
}

/* -- TYPES -- */

/**
 * Minimal user shape needed for FileReference serialization.
 */
type TFakeUser = {
  /**
   * @returns The created-by JSON used by FileReference serialization.
   */
  toCreatedByJson: () => {
    _id: string
    username: string
    firstName: string
    lastName: string
  }
}
