import { FileReferenceModel } from '@metis/server/database/models/file-references'
import { MissionModel } from '@metis/server/database/models/missions'
import { UserModel } from '@metis/server/database/models/users'
import fs from 'fs'
import path from 'path'

/**
 * Middleware class for test suite teardown helpers.
 */
export abstract class TestSuiteTeardown {
  /**
   * Deletes any users matching a username prefix to keep the test DB tidy.
   * @param prefix Username prefix to match for deletion. Defaults to 'test_'.
   */
  public static async cleanupTestUsers(
    prefix: string = 'test_',
  ): Promise<void> {
    await UserModel.deleteMany({ username: { $regex: `^${prefix}` } }).exec()
  }

  /**
   * Deletes missions by name prefix to keep the test database tidy.
   * @param prefix Mission name prefix to match for deletion. Defaults to 'test_'.
   */
  public static async cleanupTestMissions(
    prefix: string = 'test_',
  ): Promise<void> {
    await MissionModel.deleteMany({ name: { $regex: `^${prefix}` } }).exec()
  }

  /**
   * Deletes file references and underlying files matching a name prefix to keep the test file store tidy.
   * @param prefix File name prefix to match for deletion. Defaults to 'test_'.
   */
  public static async cleanupTestFiles(
    prefix: string = 'test_',
  ): Promise<void> {
    let refs = await FileReferenceModel.find({ name: { $regex: `^${prefix}` } })

    let storeDir = process.env.FILE_STORE_DIR
      ? path.resolve(process.cwd(), process.env.FILE_STORE_DIR)
      : path.join(process.cwd(), 'server', 'files', 'store-test')

    for (let ref of refs) {
      let filePath = path.join(storeDir, ref.path)
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (err) {
        // best-effort cleanup; ignore errors
      }
    }

    await FileReferenceModel.deleteMany({
      name: { $regex: `^${prefix}` },
    }).exec()
  }
}
