import { IUserJSON, User } from '../src/modules/users'
import {
  BaseMissionSession,
  IMissionSessionJSON,
  Mission,
} from '../src/modules/missions'

/**
 * This class represents a server-side instance of a mission being executed by a group of participating users. This will control access to the mission instance as it is being executed by the participants.
 */
export class ServerMissionSession extends BaseMissionSession {
  /**
   * @param mission The mission being executed.
   * @param participants A list of users participating in the mission.
   */
  public constructor(mission: Mission, participants: Array<User> = []) {
    super(mission, participants)
  }

  /**
   * Adds a participant to the mission session.
   * @param participant The user to add to the mission session.
   */
  public addParticipant(participant: User): void {
    this.participants.push(participant)
  }

  /**
   * Converts IMissionSessionJSON to a mission session object.
   * @return {ServerMissionSession} The mission session object.
   */
  public static fromJSON(json: IMissionSessionJSON): ServerMissionSession {
    return new ServerMissionSession(
      Mission.fromJSON(json.mission),
      json.participants.map((participant: IUserJSON) =>
        User.fromJSON(participant),
      ),
    )
  }
}

export class MissionControl {
  private static _missionSessions: Array<ServerMissionSession> = []

  public static get missionSessions(): Array<ServerMissionSession> {
    return [...this._missionSessions]
  }

  public static startMission(
    request: any,
    mission: Mission,
  ): ServerMissionSession {
    let user: User | undefined = request.session.user

    // Throw an error if user was not
    // found.
    if (user === undefined) {
      throw new Error('User is not logged in.')
    }

    const missionSession = new ServerMissionSession(mission, [user])
    this._missionSessions.push(missionSession)
    request.session.missionSession = missionSession
    return missionSession
  }
}

export default {
  ServerMissionSession,
}
