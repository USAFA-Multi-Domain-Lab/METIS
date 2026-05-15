import type { TMigratableEffect } from '../../../../server/target-environments/TargetMigration'

/**
 * Utility functions for writing target environment migration scripts.
 */
export class MigrationToolbox {
  /**
   * Updates the parameter ID of the argument with the given ID to a new ID.
   * @param effect The migratable effect whose arguments will be updated.
   * @param oldId The current parameter ID of the argument to rename.
   * @param newId The new parameter ID to assign to the argument.
   * @throws Will throw an error if no argument with the given oldId
   * is found in the effect's arguments.
   */
  public static updateParameterId(
    effect: TMigratableEffect,
    oldId: string,
    newId: string,
  ): void {
    let argument = effect.arguments.find(
      (argument) => argument.parameterId === oldId,
    )
    if (!argument) {
      throw new Error(
        `Migration failed. No argument with ID "${oldId}" found in effect arguments.`,
      )
    }
    argument.parameterId = newId
  }
}
