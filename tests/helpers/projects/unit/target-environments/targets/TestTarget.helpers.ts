import { Target } from '@shared/target-environments/targets/Target'

/**
 * Minimal test `Target` with an explicit migration-version list.
 */
export class TestTarget extends Target {
  private _migrationVersions: Target['migrationVersions']
  public get migrationVersions(): Target['migrationVersions'] {
    return this._migrationVersions
  }

  public constructor(
    _id: Target['_id'],
    name: Target['name'],
    description: Target['description'],
    parameters: Target['parameters'],
    environment: Target['environment'],
    migrationVersions: Target['migrationVersions'],
  ) {
    super(_id, name, description, parameters, environment)

    this._migrationVersions = migrationVersions
  }
}
