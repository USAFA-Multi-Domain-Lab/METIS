import path from 'path'
import { context } from '../../context'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let fs: typeof import('fs')

if (context === 'express') {
  const fsLocation: string = 'fs'
  fs = require(fsLocation)
}

/**
 * A utility class for managing files.
 */
export class FileToolbox {
  /**
   * Gets the extension from the given file path.
   * @param path The file path or name from which to extract the extension.
   * @returns The file extension, including the dot (e.g., `.txt`, `.jpg`).
   */
  public static getExtension(path: string): string {
    const lastDotIndex = path.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === path.length - 1) {
      return '' // No extension
    }
    return path.slice(lastDotIndex).toLowerCase()
  }

  /**
   * @param mimetype The MIME type of a file.
   * @returns The label for the MIME type.
   * @example
   * FileToolbox.mimeTypeToLabel('image/png') // PNG Image
   * FileToolbox.mimeTypeToLabel('application/pdf') // PDF Document
   * FileToolbox.mimeTypeToLabel('application/zip') // ZIP Archive
   */
  public static mimeTypeToLabel(mimetype: string): string {
    const map: Record<string, string> = {
      // Documents
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'Word Document (DOCX)',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'Excel Spreadsheet (XLSX)',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'PowerPoint Presentation (PPTX)',
      'text/plain': 'Text File',
      'application/json': 'JSON File',
      'application/xml': 'XML File',

      // Images
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'image/svg+xml': 'SVG Image',
      'image/webp': 'WebP Image',
      'image/bmp': 'Bitmap Image',

      // Audio
      'audio/mpeg': 'MP3 Audio',
      'audio/wav': 'WAV Audio',
      'audio/ogg': 'OGG Audio',

      // Video
      'video/mp4': 'MP4 Video',
      'video/x-msvideo': 'AVI Video',
      'video/webm': 'WebM Video',
      'video/quicktime': 'MOV Video',

      // Archives
      'application/zip': 'ZIP Archive',
      'application/x-rar-compressed': 'RAR Archive',
      'application/x-7z-compressed': '7-Zip Archive',
      'application/gzip': 'GZIP Archive',
    }

    // Fallback: turns "image/tiff" → "TIFF Image"
    function formatFallbackMime(mime: string): string {
      const [type, subtype] = mime.split('/')
      if (!type || !subtype || mime === 'application/octet-stream') {
        return 'Unknown File Type'
      }

      const label = subtype.toUpperCase().replace(/[-_.]/g, ' ')
      const suffix =
        type === 'image'
          ? 'Image'
          : type === 'video'
          ? 'Video'
          : type === 'audio'
          ? 'Audio'
          : type === 'text'
          ? 'Text File'
          : 'File'

      return `${label} ${suffix}`
    }

    return map[mimetype] || formatFallbackMime(mimetype)
  }

  /**
   * @param bytes The size of the file in bytes.
   * @param decimals The number of decimal places to display.
   * @returns The formatted file size.
   * @example
   * FileToolbox.formatFileSize(1024) // 1 KB
   * FileToolbox.formatFileSize(2093823) // 2.09 MB
   * FileToolbox.formatFileSize(99234567890) // 99.23 GB
   * FileToolbox.formatFileSize(1539567810124) // 1.54 TB
   */
  public static formatFileSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes'

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = bytes / Math.pow(k, i)

    return `${parseFloat(size.toFixed(decimals))} ${units[i]}`
  }

  /**
   * Validates whether the given string is a valid mimetype.
   * @param mimetype The string to validate as a mimetype.
   * @returns Whether the value is valid.
   */
  public static isValidMimetype(mimetype: string): boolean {
    const regex = /^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/
    return regex.test(mimetype)
  }

  /**
   * This function is used to help track where calls are made.
   * A function or method can call this in order to determine
   * the file path of the code that made the function call.
   * @returns The file path of the caller.
   * @throws If the caller file can not be determined.
   */
  public static getCallerFilePath() {
    const origPrepare = Error.prepareStackTrace

    try {
      // Determine the file of the caller.
      Error.prepareStackTrace = (_, stack) => stack
      let err = new Error()
      Error.captureStackTrace(err, FileToolbox.getCallerFilePath)

      let rawStack = err.stack as unknown as NodeJS.CallSite[]
      let filePath = rawStack
        .map((frame) => frame.getFileName())
        .filter((filePath) => {
          let fileIsNull = filePath === null
          let isThisFile =
            path.normalize(__filename) === path.normalize(filePath ?? '')
          return !fileIsNull && !isThisFile
        })

      const callerFilePath = filePath[1] // 0 = called function, 1= caller

      // Handle missing caller file.
      if (!callerFilePath) {
        for (let frame of rawStack) {
          console.log('frame', frame.getFileName())
        }

        throw new Error('Could not determine caller file path.')
      }

      return callerFilePath
    } finally {
      Error.prepareStackTrace = origPrepare
    }
  }

  /**
   * This function is used to help track where calls are
   * made. A function or method can call this in order to
   * determine the directory path of the code that made
   * the function call.
   * @returns The directory path of the caller.
   * @throws If the directory can not be determined.
   */
  public static getCallerDirectory() {
    let filePath = FileToolbox.getCallerFilePath()
    return path.dirname(filePath)
  }

  /**
   * This function is used to help track where calls are
   * made. A function or method can call this in order to
   * determine the containing folder of the code that made
   * the function call.
   * @returns The name of the folder.
   * @throws If the folder can not be determined.
   */
  public static getCallerFolder() {
    // Determine the folder based on the file path.
    let filePath = FileToolbox.getCallerFilePath()
    return path.basename(path.dirname(filePath))
  }
}
