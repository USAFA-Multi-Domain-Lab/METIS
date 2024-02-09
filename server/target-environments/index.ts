import TargetEnvironment from 'metis/target-environments'
import ServerTarget from './targets'
import { TCommonTargetJson } from 'metis/target-environments/targets'
import { AnyObject } from 'metis/toolbox/objects'
import path from 'path'
import fs from 'fs'

export default class ServerTargetEnvironment extends TargetEnvironment<ServerTarget> {
  // Implemented
  public parseTargets(data: TCommonTargetJson[]): ServerTarget[] {
    return data.map((datum: TCommonTargetJson) => {
      return new ServerTarget(this, datum)
    })
  }

  /**
   * Grabs the target environments from the provided directory.
   * @param directory The directory to search.
   */
  public static scan(
    directory: string,
    targetEnvironmentJson: AnyObject[],
  ): ServerTargetEnvironment[] {
    // The blacklisted files.
    let blackListedFiles: string[] = [
      path.join(directory, '.DS_Store'),
      path.join(directory, '.gitkeep'),
    ]

    // If the directory is not blacklisted, search for typescript files.
    if (
      fs.lstatSync(directory).isDirectory() &&
      !blackListedFiles.includes(directory)
    ) {
      // Get the files in the directory.
      let directoryFiles: string[] = fs.readdirSync(directory)

      // Iterate over the files in the directory.
      directoryFiles.forEach((file: string) => {
        // If the file is a typescript file, add it to the list of target environment files.
        if (
          fs.lstatSync(path.join(directory, file)).isFile() &&
          file.endsWith('.ts')
        ) {
          // Grab the default export from the file.
          let exportDefault: any = require(path.join(directory, file)).default

          // If the default export has targets, then it is a target environment.
          if (
            exportDefault.id &&
            exportDefault.name &&
            exportDefault.description &&
            exportDefault.targets
          ) {
            // Add the target environment JSON.
            targetEnvironmentJson.push(exportDefault)
          }
        } else {
          // If the file is a directory, recursively search for typescript files.
          this.scan(path.join(directory, file), targetEnvironmentJson)
        }
      })
    }

    // Create the target environments.
    let targetEnvironments: ServerTargetEnvironment[] =
      targetEnvironmentJson.map(
        (targetEnvironment: AnyObject) =>
          new ServerTargetEnvironment(targetEnvironment),
      )

    // Return the target environments.
    return targetEnvironments
  }
}
