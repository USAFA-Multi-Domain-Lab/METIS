import fs from 'fs'
import MetisServer from 'metis/server'

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
   * @param server The Metis server instance.
   * @param directory The directory to store files in.
   */
  public constructor(server: MetisServer, config: TMetisFileStoreConfig = {}) {
    // Parse config.
    const { directory = './files/store' } = config

    // Set properties.
    this._server = server
    this.directory = directory
  }

  /**
   * Initializes the file store for use.
   */
  public async initialize(): Promise<void> {
    // Ensure the directory exists.
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true })
    }
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
