import archiver from 'archiver'
import fs from 'fs'
import FileToolbox from 'metis/toolbox/files'
import path from 'path'

export default class ServerFileToolbox extends FileToolbox {
  /**
   * @param dir The directory to check.
   * @returns Whether the given directory is a folder.
   */
  public static isFolder(dir: string): boolean {
    try {
      return fs.lstatSync(dir).isDirectory()
    } catch (error) {
      return false
    }
  }

  /**
   * @param outputPath The path to the output zip file.
   * @param files The path to the files to zip.
   * @resolves When the files have been zipped.
   * @rejects If an error occurs while zipping the files.
   */
  public static async zipFiles(outputPath: string, inputPaths: string[]) {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    /**
     * Recursively adds files and folders to an archive.
     * @param entryPath The path of the file to add relative to the
     * base directory.
     * @param baseDir The base directory containing files.
     */
    function addToArchive(entryPath: string, baseDir: string) {
      const stats = fs.statSync(entryPath)

      if (stats.isDirectory()) {
        const entries = fs.readdirSync(entryPath)
        for (const entry of entries) {
          const fullPath = path.join(entryPath, entry)
          addToArchive(fullPath, baseDir)
        }
      } else {
        const relativePath = path.relative(baseDir, entryPath)
        archive.file(entryPath, { name: relativePath })
      }
    }

    return new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        console.log(
          `✅ Zipped ${archive.pointer()} total bytes to ${outputPath}`,
        )
        resolve()
      })

      archive.on('error', reject)
      archive.pipe(output)

      for (const inputPath of inputPaths) {
        const absPath = path.resolve(inputPath)
        addToArchive(absPath, path.dirname(absPath))
      }

      archive.finalize()
    })
  }
}
