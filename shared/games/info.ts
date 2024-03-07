import StringToolbox from 'metis/toolbox/strings'

/**
 * General information about a game.
 */
export class GameInfo {
  /**
   * The unique identifier for the game.
   */
  public readonly gameID: string

  /**
   * The unique identifier for the mission being executed in the game.
   */
  public readonly missionID: string

  /**
   * The accessiblity of the game to students.
   * @option 'public' The game is accessible to all students.
   * @option 'id-required' The game is accessible to students with the game ID.
   * @option 'invite-only' The game is accessible to students with an invite.
   */
  public accessibility: 'public' | 'id-required' | 'invite-only'

  /**
   * Whether students will be auto-assigned to their roles.
   */
  public autoAssign: boolean

  /**
   * Whether resources will be enabled in the game.
   */
  public resourcesEnabled: boolean

  /**
   * Whether effects will be enabled in the game.
   */
  public effectsEnabled: boolean

  /**
   * @param data The game data from which to create the game. Any ommitted
   * values will be set to the default properties defined in
   * Mission.DEFAULT_PROPERTIES.
   * @param options The options for creating the mission.
   */
  public constructor(
    data: Partial<TGameInfoJson>,
    options: TGameInfoOptions = {},
  ) {
    this.gameID = data.gameID ?? GameInfo.DEFAULT_PROPERTIES.gameID
    this.missionID = data.missionID ?? GameInfo.DEFAULT_PROPERTIES.missionID
    this.accessibility =
      data.accessibility ?? GameInfo.DEFAULT_PROPERTIES.accessibility
    this.autoAssign = data.autoAssign ?? GameInfo.DEFAULT_PROPERTIES.autoAssign
    this.resourcesEnabled =
      data.resourcesEnabled ?? GameInfo.DEFAULT_PROPERTIES.resourcesEnabled
    this.effectsEnabled =
      data.effectsEnabled ?? GameInfo.DEFAULT_PROPERTIES.effectsEnabled
  }

  /**
   * Converts the GameInfo object to JSON.
   * @returns A JSON representation of the game.
   */
  public toJson(): TGameInfoJson {
    return {
      gameID: this.gameID,
      missionID: this.missionID,
      accessibility: this.accessibility,
      autoAssign: this.autoAssign,
      resourcesEnabled: this.resourcesEnabled,
      effectsEnabled: this.effectsEnabled,
    }
  }

  /**
   * The default properties for a `GameInfo` object.
   */
  public static get DEFAULT_PROPERTIES(): Required<TGameInfoJson> {
    return {
      gameID: StringToolbox.generateRandomID().substring(0, 12),
      // ? Should this be a random ID?
      missionID: StringToolbox.generateRandomID(),
      accessibility: 'public',
      autoAssign: true,
      resourcesEnabled: true,
      effectsEnabled: true,
    }
  }
}

/* -- types -- */

/**
 * Options for `GameInfo` constructor.
 */
export type TGameInfoOptions = {}

/**
 * A JSON representation of a game.
 */
export type TGameInfoJson = {
  /**
   * The unique identifier for the game.
   * @default StringToolbox.generateRandomID()
   */
  gameID: string
  /**
   * The unique identifier for the mission being executed in the game.
   * @default StringToolbox.generateRandomID()
   */
  missionID: string
  /**
   * The accessiblity of the game to students.
   * @option 'public' The game is accessible to all students.
   * @option 'id-required' The game is accessible to students with the game ID.
   * @option 'invite-only' The game is accessible to students with an invite.
   * @default 'public'
   */
  accessibility: 'public' | 'id-required' | 'invite-only'
  /**
   * Whether students will be auto-assigned to their roles.
   * @default true
   */
  autoAssign: boolean
  /**
   * Whether resources will be enabled in the game.
   * @default true
   */
  resourcesEnabled: boolean
  /**
   * Whether effects will be enabled in the game.
   * @default true
   */
  effectsEnabled: boolean
}
