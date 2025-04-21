import crypto from 'crypto'
import { RequestHandler } from 'express'
import { Response } from 'express-serve-static-core'
import fs from 'fs'
import FileReference, { TFileReferenceJson } from 'metis/files/references'
import MetisServer from 'metis/server'
import StringToolbox from 'metis/toolbox/strings'
import multer from 'multer'
import path from 'path'
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
