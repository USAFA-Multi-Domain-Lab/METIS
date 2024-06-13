import { useGlobalContext } from 'src/context'
import ClientMissionPrototype from 'src/missions/nodes/prototypes'
import { compute } from 'src/toolbox'
import { DetailString } from '../form/DetailString'
import './index.scss'

/**
 * This will render the basic editable details of a mission prototype.
 */
export default function PrototypeEntry({
  prototype,
  handleChange,
}: TPrototypeEntry): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */

  /* -- COMPUTED -- */
  /**
   * The name of the prototype.
   */
  const prototypeName = compute(() => prototype.name)
  /**
   * The name of the mission.
   */
  const missionName: string = compute(() => prototype.mission.name)
  /**
   * The current location within the prototype.
   */
  const prototypePath: string[] = compute(() => [missionName, prototypeName])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the back button.
   */
  const renderBackButtonJsx = (): JSX.Element | null => {
    return (
      <div className='BackContainer'>
        <div className='BackButton Disabled'>&lt;</div>
      </div>
    )
  }
  /**
   * Renders JSX for the path of the prototype.
   */
  const renderPathJsx = (): JSX.Element | null => {
    return (
      <div className='Path'>
        Location:{' '}
        {prototypePath.map((position: string, index: number) => {
          return (
            <span className='Position' key={`position-${index}`}>
              <span className='PositionText'>{position}</span>{' '}
              {index === prototypePath.length - 1 ? '' : ' > '}
            </span>
          )
        })}
      </div>
    )
  }

  /* -- RENDER -- */

  return (
    <div className='Entry PrototypeEntry SidePanel'>
      <div className='BorderBox'>
        {/* -- TOP OF BOX -- */}
        <div className='BoxTop'>
          <div className='ErrorMessage Hidden'></div>
          {renderBackButtonJsx()}
          {renderPathJsx()}
        </div>

        {/* -- MAIN CONTENT -- */}
        <div className='SidePanelSection MainDetails'>
          <DetailString
            fieldType='required'
            handleOnBlur='repopulateValue'
            label='ID'
            stateValue={prototype._id}
            setState={() => {}}
            defaultValue={prototype._id}
            key={`${prototype._id}_name`}
          />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- TYPES FOR PROTOTYPE ENTRY ---------------------------- */

export type TPrototypeEntry = {
  /**
   * The prototype to be edited.
   */
  prototype: ClientMissionPrototype
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
