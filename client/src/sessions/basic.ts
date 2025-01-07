import { TListItem } from 'src/components/content/data/lists/pages/ListItem'
import {
  TSessionBasicJson,
  TSessionConfig,
  TSessionState,
} from '../../../shared/sessions/index'
import User from '../../../shared/users'

/**
 * More basic representation of a session.
 */
export class SessionBasic
  implements Omit<TSessionBasicJson, 'launchedAt'>, TListItem
{
  // Implemented
  public _id: string

  // Implemented
  public missionId: string

  // Implemented
  public state: TSessionState

  // Implemented
  public name: string

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

  // Implemented
  public config: TSessionConfig

  // Implemented
  public participantIds: string[]

  // Implemented
  public banList: string[]

  // Implemented
  public observerIds: string[]

  // Implemented
  public managerIds: string[]

  public constructor(data: TSessionBasicJson) {
    // Parse the data.
    this._id = data._id
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
}
