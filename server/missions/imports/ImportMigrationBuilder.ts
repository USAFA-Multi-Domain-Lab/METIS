import fs from 'fs'
import path from 'path'
import type { MissionImport } from './MissionImport'

/**
 * Responsible for running build scripts for {@link MissionImport}
 * data, transforming it from older formats to the latest format expected by
 * this version of METIS.
 */
export class ImportMigrationBuilder {
  /**
   * Initializes the builder for use. This should be called
   * before performing any migrations.
   */
  public initialize(): void {
    this.loadBuilds()
  }

  /**
   * Migrates the mission data if it is outdated.
   * @param missionData The mission data to migrate.
   */
  public migrateIfOutdated = (missionData: any): void => {
    for (const [
      targetBuildNumber,
      build,
    ] of ImportMigrationBuilder.MIGRATION_BUILDS) {
      this.processBuild(missionData, targetBuildNumber, build)
    }
  }

  /**
   * Loads the migration builds from the `builds` directory
   * into {@link MIGRATION_BUILDS}.
   */
  private loadBuilds(): void {
    let buildsDirectory = path.join(__dirname, 'builds')
    let seenBaseNames = new Set<string>()
    let buildBaseNames: string[] = []

    // Scan the builds directory for files matching the
    // correct pattern for a import build.
    for (let fileName of fs.readdirSync(buildsDirectory)) {
      let match = fileName.match(/^(build_\d{6})\.(js|ts)$/)
      let baseName = match ? match[1] : ''

      if (baseName && !seenBaseNames.has(baseName)) {
        seenBaseNames.add(baseName)
        buildBaseNames.push(baseName)
      }
    }

    buildBaseNames.sort()

    // Extract the scripts from the files found and
    // cache them for use later during the import process.
    ImportMigrationBuilder.MIGRATION_BUILDS = buildBaseNames.map((baseName) => {
      let targetBuildNumber = parseInt(baseName.slice('build_'.length), 10)
      let build: TMissionImportBuild = require(
        path.join(buildsDirectory, baseName),
      ).default
      return [targetBuildNumber, build] as [number, TMissionImportBuild]
    })
  }

  /**
   * Proccesses the given build number with the given build function.
   * @param missionData The mission data to process.
   * @param targetBuildNumber The target build number (non-padded). If the mission data's
   * schema build number is less than this number, the build function will be
   * executed.
   * @param build The build function to execute, if the data is outdated.
   */
  private processBuild(
    missionData: any,
    targetBuildNumber: number,
    build: TMissionImportBuild,
  ): void {
    let { schemaBuildNumber } = missionData
    if (schemaBuildNumber < targetBuildNumber) build(missionData)
  }

  /**
   * Ordered list of import migration builds. Each entry is a tuple of
   * [targetBuildNumber, buildFunction]. The builds will be executed in order
   * during the import process if the mission data's schemaBuildNumber is less
   * than the targetBuildNumber. This allows for seamless migration of old
   * mission data to the latest schema as the import is executed.
   */
  private static MIGRATION_BUILDS: [number, TMissionImportBuild][] = []
}

/* -- TYPES -- */

/**
 * A build function that migrates mission import data
 * for a specific schema build number.
 */
export type TMissionImportBuild = (missionData: any) => void
