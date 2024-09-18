import { TBaseOutput, TBaseOutputJson } from '.'
import { TCommonMission, TCommonMissionJson } from '../..'

/**
 * The properties needed to display the intro message for a mission in the output panel.
 */
export type TIntro = TBaseOutput & {
  /**
   * The type of output.
   */
  type: 'intro'
  /**
   * The mission's intro message.
   */
  message: TCommonMission['introMessage']
}

/**
 * Plain JSON representation of an intro output.
 */
export type TIntroJson = TBaseOutputJson & {
  /**
   * The type of output.
   */
  type: 'intro'
  /**
   * The mission's intro message.
   */
  message: TCommonMissionJson['introMessage']
}
