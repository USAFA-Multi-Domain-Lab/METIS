import { useState } from 'react'
import { useGlobalContext } from 'src/context'
import ClientMission from 'src/missions'
import { ClientEffect } from 'src/missions/effects'
import { compute } from 'src/toolbox'
import { useMountHandler, usePostInitEffect } from 'src/toolbox/hooks'
import { SingleTypeObject } from '../../../../../../shared/toolbox/objects'
import { DetailLargeString } from '../../form/DetailLargeString'
import { DetailNumber } from '../../form/DetailNumber'
import { DetailString } from '../../form/DetailString'
import List, { ESortByMethod } from '../../general-layout/List'
import ButtonSvgPanel, {
  TValidPanelButton,
} from '../../user-controls/ButtonSvgPanel'
import './index.scss'
import EntryNavigation from './navigation/EntryNavigation'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
  handleDeleteEffectRequest,
  handleChange,
}: TMissionEntry_P): JSX.Element | null {
  /* -- GLOBAL CONTEXT -- */
  const globalContext = useGlobalContext()
  const { forceUpdate } = globalContext.actions
  const [targetEnvironments] = globalContext.targetEnvironments

  /* -- STATE -- */
  const [missionName, setMissionName] = useState<string>(mission.name)
  const [introMessage, setIntroMessage] = useState<string>(mission.introMessage)
  const [initialResources, setInitialResources] = useState<number>(
    mission.initialResources,
  )
  const [invalidEffects] = useState<ClientEffect[]>([])

  /* -- EFFECTS -- */

  // componentDidMount
  const [mountHandled] = useMountHandler((done) => {
    mission.forces.forEach((force) => {
      force.nodes.forEach((node) => {
        node.actions.forEach((action) => {
          action.effects.forEach((effect) => {
            // Check if the effect is invalid.
            const isInvalid = effect.validate(targetEnvironments) === false
            // If the effect is invalid then add it to the list of invalid effects.
            if (isInvalid) invalidEffects.push(effect)
          })
        })
      })
    })

    forceUpdate()
    done()
  })

  // Sync the component state with the mission name.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = missionName

    // This is to show the change to
    // the name of the mission shown
    // on the mission map.
    forceUpdate()
    // Allow the user to save the changes.
    handleChange()
  }, [missionName])

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the introduction message.
    mission.introMessage = introMessage
    // Update the initial resources.
    mission.initialResources = initialResources

    // Allow the user to save the changes.
    handleChange()
  }, [introMessage, initialResources])

  /* -- FUNCTIONS -- */

  /**
   * Renders JSX for the effect list item.
   */
  const renderEffectListItem = (effect: ClientEffect) => {
    /* -- COMPUTED -- */

    /**
     * The buttons for the effect list.
     */
    const buttons = compute(() => {
      // Create a default list of buttons.
      let buttons: TValidPanelButton[] = []

      // If the action is available then add the edit and remove buttons.
      let availableMiniActions: SingleTypeObject<TValidPanelButton> = {
        warning: {
          icon: 'warning-transparent',
          key: 'warning',
          onClick: () => {},
          cursor: 'help',
          tooltipDescription: effect.invalidMessage,
        },
        edit: {
          icon: 'edit',
          key: 'edit',
          onClick: () => mission.select(effect),
          tooltipDescription: 'Edit the effect.',
        },
        remove: {
          icon: 'remove',
          key: 'remove',
          onClick: async () => await handleDeleteEffectRequest(effect),
          tooltipDescription: 'Remove effect.',
        },
      }

      // Add the buttons to the list.
      buttons = Object.values(availableMiniActions)

      // Return the buttons.
      return buttons
    })

    return (
      <div className='Row' key={`effect-row-${effect._id}`}>
        <div className='RowContent'>{effect.name}</div>
        <ButtonSvgPanel buttons={buttons} size={'small'} />
      </div>
    )
  }

  /* -- RENDER -- */
  if (mountHandled) {
    return (
      <div className='Entry MissionEntry SidePanel'>
        <div className='BorderBox'>
          {/* -- TOP OF BOX -- */}
          <div className='BoxTop'>
            <EntryNavigation object={mission} />
          </div>

          {/* -- MAIN CONTENT -- */}
          <div className='SidePanelSection MainDetails'>
            <DetailString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Name'
              stateValue={missionName}
              setState={setMissionName}
              defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
              key={`${mission._id}_name`}
            />
            <DetailLargeString
              fieldType='required'
              handleOnBlur='repopulateValue'
              label='Introduction Message'
              stateValue={introMessage}
              setState={setIntroMessage}
              defaultValue={ClientMission.DEFAULT_PROPERTIES.introMessage}
              elementBoundary='.SidePanelSection'
              key={`${mission._id}_introMessage`}
            />
            <DetailNumber
              fieldType='required'
              label='Initial Resources'
              stateValue={initialResources}
              setState={setInitialResources}
              integersOnly={true}
              key={`${mission._id}_initialResources`}
            />
            <List<ClientEffect>
              items={invalidEffects}
              renderItemDisplay={(effect) => renderEffectListItem(effect)}
              headingText={'Invalid Effects'}
              sortByMethods={[ESortByMethod.Name]}
              nameProperty={'name'}
              alwaysUseBlanks={false}
              searchableProperties={['name']}
              noItemsDisplay={null}
              ajaxStatus={'Loaded'}
              applyItemStyling={() => {
                return {}
              }}
              listStyling={{ borderBottom: '2px solid #ffffff' }}
              itemsPerPage={null}
              listSpecificItemClassName='AltDesign2'
            />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

export type TMissionEntry_P = {
  /**
   * The mission to be edited.
   */
  mission: ClientMission
  /**
   * Handles the request to delete an effect.
   */
  handleDeleteEffectRequest: (
    effect: ClientEffect,
    navigateBack?: boolean,
  ) => Promise<void>
  /**
   * A function that will be used to notify the parent
   * component that this component has changed.
   */
  handleChange: () => void
}
