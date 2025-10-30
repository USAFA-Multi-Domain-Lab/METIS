import { describe, expect, test } from '@jest/globals'
import ServerFileToolbox from 'metis/server/toolbox/files'
import ClassList from 'metis/toolbox/html/class-lists'

describe('ClassList class.', () => {
  test('ClassList with args "class1" and "class2" will yield a value of "class1 class2"', () => {
    expect(new ClassList('class1', 'class2').value).toBe('class1 class2')
  })
})

describe('ServerFileToolbox class.', () => {
  test('isFolder returns true for a folder path', () => {
    const folderPath = __dirname // Current directory is a folder
    expect(ServerFileToolbox.isFolder(folderPath)).toBe(true)
  })
})
