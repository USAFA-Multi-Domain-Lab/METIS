import crypto from 'crypto'
import { RequestHandler } from 'express'
import { Response } from 'express-serve-static-core'
import fs from 'fs'
import FileReference, { TFileReferenceJson } from 'metis/files/references'
import MetisServer from 'metis/server'
import StringToolbox from 'metis/toolbox/strings'
import mime from 'mime-types'
import multer from 'multer'
import path from 'path'
import FileReferenceModel from '../database/models/file-references'
import ServerFileReference from './references'

/* -- CLASSES -- */

/**
 * A class for managing user files in a specified directory.
 */
export default class MetisFileStore {
  /**
   * The Metis server instance.
   */
  private _server: MetisServer
  /**
   * The Metis server instance.
   */
  public get server(): MetisServer {
    return this._server
  }

  /**
   * The Multer instance that manages file
   * uploads.
   */
  private multer: multer.Multer

  /**
   * The directory to store files in.
   */
  public readonly directory: string

  /**
   * Whether the file store is initialized.
   */
  private _initialized = false
  /**
   * Whether the file store is initialized.
   */
  public get initialized(): boolean {
    return this._initialized
  }

  /**
   * Creates upload middleware that can be used in a
   * route handler.
   * @example
   * ```ts
   * router.post(
   *  '/',
   *  fileStore.uploadMiddleware,
   *  uploadFiles,
   * )
   */
  public get uploadMiddleware(): RequestHandler {
    return this.multer.array('files') // todo: Determine file count limit.
  }

  /**
   * @param server The Metis server instance.
   * @param directory The directory to store files in.
   */
  public constructor(server: MetisServer, config: TMetisFileStoreConfig = {}) {
    // Parse config.
    const { directory = './files/store' } = config

    // Set properties.
    this._server = server
    this.directory = directory

    // Initialize Multer.
    let storage = multer.diskStorage({
      destination: (req, file, cb) => {
        if (!fs.existsSync(directory))
          fs.mkdirSync(directory, { recursive: true })
        cb(null, directory)
      },
      filename: (req, file, cb) => {
        const hash = crypto.randomBytes(16).toString('hex') // 32-char hex string
        const ext = path.extname(file.originalname)
        cb(null, `${hash}_${ext}`)
      },
    })
    this.multer = multer({
      storage,
    })

    // Create the store directory, if it doesn't exist.
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true })
    }

    this._initialized = true
  }

  /**
   * Provides the file for the given reference in an
   * Express response for the client to then download.
   * @param response The Express response in which to provide the file.
   * @param reference The reference to the file.
   */
  public provideInResponse(
    response: Response,
    reference: ServerFileReference,
  ): void {
    let pathToFile = path.join(this.directory, reference.path)
    response.download(pathToFile, reference.name)
  }

  /**
   * @param reference The reference to the file.
   * @returns The full path to the file.
   */
  public getFullPath(reference: FileReference | TFileReferenceJson): string {
    return StringToolbox.joinPaths(this.directory, reference.path)
  }

  /**
   * This will create and save a reference for a Multer
   * file to the database.
   * @param file The file for which to create a reference.
   * @returns The saved reference.
   */
  public async createReference(file: Express.Multer.File) {
    const { filename, originalname, mimetype, size } = file

    const doc = new FileReferenceModel({
      name: originalname,
      path: filename,
      mimetype,
      size,
    })

    return await doc.save()
  }

  /**
   * Imports a file from the given path into the
   * file store, automatically creating a reference
   * for it in the database.
   * @param sourcePath The path of the file to import.
   * @param referenceId The ID of the file reference to
   * create in the database.
   * @resolves With the new database reference to the file.
   * @rejects If an error occurs while importing the file or
   * creating the reference.
   */
  public async import(
    sourcePath: string,
    options: TFileStoreImportOptions = {},
  ): Promise<TFileReferenceJson> {
    // 1. Get original info
    const { referenceId } = options
    const name = path.basename(sourcePath)
    const extension = path.extname(sourcePath)
    const mimetype = mime.lookup(extension) || 'application/octet-stream'
    const size = fs.statSync(sourcePath).size

    // 2. Create hash
    const hash = crypto.randomBytes(16).toString('hex')
    const hashedName = `${hash}_${extension}`

    // 3. Define destination
    const destPath = path.join(this.directory, hashedName)

    // 4. Copy file into store
    fs.copyFileSync(sourcePath, destPath)

    // 5. Save reference
    let referenceDoc = await FileReferenceModel.create({
      _id: referenceId,
      name,
      path: hashedName,
      mimetype,
      size,
    })

    // 6. Return reference as JSON.
    let referenceData: TFileReferenceJson = referenceDoc.toJSON()
    return referenceData
  }
}

/* -- TYPES -- */

/**
 * The configuration for the file store.
 */
export type TMetisFileStoreConfig = {
  /**
   * The directory to store files in.
   * @default './files/store'
   */
  directory?: string
}

/**
 * A file uploaded with Multer.
 */
export type TMulterFile = Express.Multer.File

/**
 * Options for importing a file into the file store.
 */
export type TFileStoreImportOptions = {
  /**
   * The ID to use when creating the new file reference
   * in the database.
   * @note If not provided, a new ID will be generated.
   */
  referenceId?: string
}
