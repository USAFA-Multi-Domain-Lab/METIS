export class MissionSession {
  public readonly missionID: string

  public constructor(missionID: string) {
    this.missionID = missionID
  }

  public addParticipant(user: any): void {}
}

export default {
  MissionSession,
}
