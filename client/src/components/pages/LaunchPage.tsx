import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import GameClient from 'src/games'
import ClientMission from 'src/missions'
import { compute } from 'src/toolbox'
import { useMountHandler } from 'src/toolbox/hooks'
import { DefaultLayout } from '.'
import Game from '../../../../shared/games'
import GameConfig from '../content/game/GameConfig'
import { HomeLink, TNavigation } from '../content/general-layout/Navigation'
import './LaunchPage.scss'

export default function GameConfigPage({
  missionID,
}: TGameConfigPage_P): JSX.Element | null {
  /* -- state -- */

  const globalContext = useGlobalContext()
  const [server] = globalContext.server
  const { beginLoading, finishLoading, handleError, notify, navigateTo } =
    globalContext.actions
  const [mission, setMission] = useState<ClientMission>(
    new ClientMission({ missionID }),
  )
  const [gameConfig, setGameConfig] = useState(Game.DEFAULT_CONFIG)

  /* -- effects -- */

  useMountHandler(async (done) => {
    // Handle the editing of an existing mission.
    if (missionID !== null) {
      try {
        // Notify user of loading.
        beginLoading('Loading mission...')
        // Load mission.
        let mission = await ClientMission.$fetchOne(missionID)
        // Store mission in the state.
        setMission(mission)
      } catch {
        handleError('Failed to load launch page.')
      }
    }

    // Finish loading.
    finishLoading()
    // Mark mount as handled.
    done()
  })

  /* -- computed -- */

  /**
   * Props for navigation.
   */
  const navigation = compute(
    (): TNavigation => ({
      links: [HomeLink(globalContext, { text: 'Cancel' })],
      boxShadow: 'alt-7',
    }),
  )

  /* -- functions -- */

  /**
   * Callback for saving the game configuration, which
   * launches the game.
   */
  const launch = async () => {
    if (server !== null) {
      try {
        // Notify user of game launch.
        beginLoading('Launching game...')
        // Launch game from mission ID.
        await GameClient.$launch(mission.missionID, gameConfig)
        // Navigate to home page.
        navigateTo('HomePage', {})
        // Notify user of success.
        notify('Successfully launched game.')
      } catch (error) {
        handleError({
          message: 'Failed to launch game. Contact system administrator.',
          notifyMethod: 'bubble',
        })
      }
    } else {
      handleError({
        message: 'No server connection. Contact system administrator',
        notifyMethod: 'bubble',
      })
    }
  }

  /* -- render -- */

  return (
    <div className='LaunchPage Page'>
      <DefaultLayout navigation={navigation}>
        <div className='MissionName'>{mission.name}</div>
        <GameConfig
          gameConfig={gameConfig}
          saveButtonText={'Launch'}
          onSave={launch}
        />
      </DefaultLayout>
    </div>
  )
}

/**
 * Props for `GameConfigPage` component.
 */
export type TGameConfigPage_P = {
  /**
   * The ID of the game to configure.
   */
  missionID: string
}
