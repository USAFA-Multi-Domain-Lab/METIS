import fs from 'fs'
import path from 'path'
import { TargetEnvSchema } from '../schema/TargetEnvSchema'

/**
 * This function is used to help track where calls are made.
 * A function or method can call this in order to determine
 * the file path of the code that made the function call.
 * @returns The file path of the caller.
 * @throws If the caller file can not be determined.
 */
export function getCallerFilePath() {
  const origPrepare = Error.prepareStackTrace

  try {
    // Determine the file of the caller.
    Error.prepareStackTrace = (_, stack) => stack
    const err = new Error()
    Error.captureStackTrace(err, getCallerFilePath)
    const stack = err.stack as unknown as NodeJS.CallSite[]
    const caller = stack[2] // 0 = this function, 1 = called function, 2 = caller
    const callerFilePath = caller?.getFileName()

    // Handle missing caller file.
    if (!callerFilePath) {
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
 * determine the containing folder of the code that made
 * the function call.
 * @returns The name of the folder.
 * @throws If the folder can not be determined.
 */
export function getCallerFolder() {
  // Determine the folder based on the file path.
  let filePath = getCallerFilePath()
  return path.basename(path.dirname(filePath))
}

/**
 * This function is used to help track where calls are made.
 * A function or method can call this in order to determine
 * from within which target environment the call was made.
 * @returns The target environment schema.
 * @throws If the target environment schema can not be determined.
 */
export function getCallerTargetEnv(): TargetEnvSchema {
  let filePath = getCallerFilePath()

  const algorithm = (folder = path.dirname(filePath)): TargetEnvSchema => {
    // If we have reached outside the target-env directory,
    // throw an error.
    if (
      /(?:[/\\])integration[/\\]target-env$/.test(folder) ||
      folder === path.dirname(folder)
    ) {
      throw new Error('No target environment schema file found in path.')
    }

    // If a schema file does not exist here,
    // move up one folder and try again.
    let schemaPath = path.join(folder, 'schema.ts')

    if (!fs.existsSync(schemaPath)) {
      return algorithm(path.dirname(folder))
    }

    // Determine if the schema file is valid.
    let schema = require(schemaPath).default

    if (!schema || !(schema instanceof TargetEnvSchema)) {
      return algorithm(path.dirname(folder))
    }

    // If all checks pass, return the schema.
    return schema
  }

  return algorithm()
}
