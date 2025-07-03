import { MetisComponent } from '../../../shared'
import {
  TSessionAccessibility,
  TSessionBasicJson,
  TSessionConfig,
  TSessionState,
} from '../../../shared/sessions/index'
import User from '../../../shared/users'

/**
 * More basic representation of a session.
 */
export class SessionBasic
  extends MetisComponent
  implements Omit<TSessionBasicJson, 'launchedAt'>
{
  // Implemented
  public missionId: string

  // Implemented
  public state: TSessionState

  // Implemented
  public ownerId: string

  // Implemented
  public ownerUsername: string

  // Implemented
  public ownerFirstName: string

  // Implemented
  public ownerLastName: string

  /**
   * The full name of the session owner.
   */
  public get ownerFullName(): string {
    return User.getFullName(this.ownerFirstName, this.ownerLastName)
  }

  /**
   * The date/time the session was launched.
   */
  public launchedAt: Date

  /**
   * The time elapsed since the session was launched.
   */
  public get runtime(): number {
    return Date.now() - this.launchedAt.getTime()
  }

  /**
   * The formatted runtime of the session.
   */
  public get runtimeFormatted(): string {
    // Calculate the total amount of seconds,
    // minutes, hours, and days that have passed.
    let totalSeconds = Math.floor(this.runtime / 1000)
    let totalMinutes = Math.floor(totalSeconds / 60)
    let totalHours = Math.floor(totalMinutes / 60)
    let totalDays = Math.floor(totalHours / 24)

    // Calculate the net amount of seconds, minutes,
    // hours, and days that have passed.
    let netSeconds = totalSeconds % 60
    let netMinutes = totalMinutes % 60
    let netHours = totalHours % 24
    let netDays = totalDays

    // Pad the net values with zeroes if necessary.
    let paddedSeconds = netSeconds.toString().padStart(2, '0')
    let paddedMinutes = netMinutes.toString().padStart(2, '0')
    let paddedHours = netHours.toString().padStart(2, '0')
    let paddedDays = netDays.toString()

    // Piece all of the padded values together
    // into a single display string.
    let result = `${paddedDays}:${paddedHours}:${paddedMinutes}:${paddedSeconds}`

    // Return the result.
    return result
  }

  // Implemented
  public config: TSessionConfig

  /**
   * The accessiblity of the session to students, defined
   * in `config.accessibility`.
   * @default 'public'
   */
  public get accessibility(): TSessionAccessibility {
    return this.config.accessibility
  }

  // Implemented
  public participantIds: string[]

  // Implemented
  public banList: string[]

  // Implemented
  public observerIds: string[]

  // Implemented
  public managerIds: string[]

  /**
   * The number of members joined to the session.
   */
  public get memberCount(): number {
    return (
      this.participantIds.length +
      this.observerIds.length +
      this.managerIds.length
    )
  }

  public constructor(data: TSessionBasicJson) {
    super(data._id, data.name, false)

    // Parse the data.
    this.missionId = data.missionId
    this.state = data.state
    this.name = data.name
    this.ownerId = data.ownerId
    this.ownerUsername = data.ownerUsername
    this.ownerFirstName = data.ownerFirstName
    this.ownerLastName = data.ownerLastName
    this.launchedAt = new Date(data.launchedAt)
    this.config = data.config
    this.participantIds = data.participantIds
    this.banList = data.banList
    this.observerIds = data.observerIds
    this.managerIds = data.managerIds
  }

  /**
   * @param text Text entered by the user as a game
   * code to join.
   * @returns A {@link SessionBasic} object inaccurately
   * representing the session that the user is trying to
   * join. However, this object can be manipulated as
   * more information is obtained concerning the session.
   */
  public static createManualJoin(text: string): SessionBasic {
    return new SessionBasic({
      _id: text,
      name: 'manual-join',
      missionId: '-1',
      ownerId: '-1',
      ownerFirstName: 'Unknown',
      ownerLastName: 'Unknown',
      ownerUsername: 'Unknown',
      state: 'started',
      launchedAt: new Date().toISOString(),
      participantIds: [],
      observerIds: [],
      managerIds: [],
      banList: [],
      config: {
        accessibility: 'id-required',
        autoAssign: false,
        infiniteResources: false,
        effectsEnabled: true,
      },
    })
  }
}
