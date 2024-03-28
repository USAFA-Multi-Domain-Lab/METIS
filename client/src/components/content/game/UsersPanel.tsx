import GameClient from 'src/games'
import GameUsers from './GameUsers'
import './UsersPanel.scss'

/**
 * A panel displaying the users in the game.
 */
export default function UsersPanel({
  game,
}: TUsersPanel_P): JSX.Element | null {
  /* -- RENDER -- */

  return (
    <div className='UsersPanel'>
      <div className='BorderBox'>
        <GameUsers game={game} />
      </div>
    </div>
  )
}

/**
 * The props for `UsersPanel` component.
 */
export type TUsersPanel_P = {
  /**
   * The game client with the users to display.
   */
  game: GameClient
}
