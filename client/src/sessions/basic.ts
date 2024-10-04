import { TListItem } from 'src/components/content/data/lists/ListItem'
import {
  TSessionBasicJson,
  TSessionConfig,
} from '../../../shared/sessions/index'

/**
 * More basic representation of a session.
 */
export class SessionBasic implements TSessionBasicJson, TListItem {
  // Implemented
  public _id: string

  // Implemented
  public missionId: string

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
    this.name = data.name
    this.ownerId = data.ownerId
    this.ownerUsername = data.ownerUsername
    this.ownerFirstName = data.ownerFirstName
    this.ownerLastName = data.ownerLastName
    this.config = data.config
    this.participantIds = data.participantIds
    this.banList = data.banList
    this.observerIds = data.observerIds
    this.managerIds = data.managerIds
  }
}
