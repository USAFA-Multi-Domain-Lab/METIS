import { ClientMissionFile } from '@client/missions/files/ClientMissionFile'
import { createClientSessionController } from './createClientSessionController'

/**
 * Handles the granting/revoking of access to a file.
 * @param member The client's session member.
 * @param event The event emitted by the server.
 */
export const onFileAccessUpdated =
  createClientSessionController<'file-access-updated'>(
    function (this, member, event) {
      let { data } = event
      let files = data.files
        .map((fileJson) => {
          let file = this.subscribedMission.getFileById(fileJson._id)
          // Create a new file instance from the JSON,
          // only if access is being granted. Otherwise,
          // there is no need.
          if (!file && data.granted) {
            file = ClientMissionFile.fromJson(fileJson, this.subscribedMission)
            this.subscribedMission.files.push(file)
          }
          return file
        })
        .filter((file) => file !== undefined)

      // Update access per force.
      for (let forceId of data.forceIds) {
        let force = this.subscribedMission.getForceById(forceId)

        if (!force) {
          console.warn(
            `Event "file-access-updated" was triggered with granted=true, but the force with the given forceId ("${forceId}") could not be found.`,
          )
          continue
        }

        // If the following conditions are met, remove
        // the files from the mission entirely:
        // 1. Access is being revoked.
        // 2. The member is assigned to the force in question.
        // 3. The member does not have complete visibility, which
        //    would otherwise negate file-access restrictions.
        if (
          !data.granted &&
          member.assignedForceId === forceId &&
          !member.isAuthorized('completeVisibility')
        ) {
          let revokedIds = new Set(data.files.map((fileJson) => fileJson._id))
          this.subscribedMission.files = this.subscribedMission.files.filter(
            (file) => !revokedIds.has(file._id),
          )
        }

        force.updateFileAccess(files, data.granted)
      }
    },
  )
