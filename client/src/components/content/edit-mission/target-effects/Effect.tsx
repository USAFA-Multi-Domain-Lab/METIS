import { ClientTargetEnvironment } from 'src/target-environments'
import './Effect.scss'
import TargetEnvironments from './TargetEnvironments'
import { compute } from 'src/toolbox'
import { ClientEffect } from 'src/missions/effects'
import { Detail, DetailBox } from '../../form/Form'
import { useGlobalContext } from 'src/context'
import ClientMissionAction from 'src/missions/actions'

/**
 * Prompt modal for creating a list of effects to apply to a target
 */
export default function Effect(props: TEffects): JSX.Element | null {
  /* -- PROPS -- */
  const { action, effect, targetEnvironments, display, setClearForm } = props

  /* -- GLOBAL CONTEXT -- */
  const { forceUpdate } = useGlobalContext().actions

  /* -- STATE -- */
  // todo: remove
  // const [formFilledOut, setFormFilledOut] = useState<boolean>(false)

  /* -- COMPUTED -- */

  /**
   * The class name for the root element.
   */
  const rootClassName: string = compute(() => {
    // Create a default list of class names.
    let classList: string[] = ['Effect']

    // If it should not be displayed, add the hidden class.
    if (!display) {
      classList.push('Hidden')
    }

    // Combine the class names into a single string.
    return classList.join(' ')
  })
  // todo: remove
  // /**
  //  * The class name for the submit button.
  //  */
  // const submitButtonClassName: string = compute(() => {
  //   // Create a default list of class names.
  //   let classList: string[] = ['Button', 'Submit']

  //   // If the form is filled out, add the disabled class.
  //   if (
  //     effect.name === ClientEffect.DEFAULT_PROPERTIES.name ||
  //     effect.description === ClientEffect.DEFAULT_PROPERTIES.description
  //   ) {
  //     classList.push('Disabled')
  //   }

  //   // Combine the class names into a single string.
  //   return classList.join(' ')
  // })

  /* -- EFFECTS -- */
  // todo: remove
  // useEffect(() => {
  //   // If the form is filled out and the effect has default properties,
  //   // then set the form to not filled out.
  //   if (formFilledOut) {
  //     if (
  //       effect.name === ClientEffect.DEFAULT_PROPERTIES.name ||
  //       effect.description === ClientEffect.DEFAULT_PROPERTIES.description
  //     ) {
  //       setFormFilledOut(false)
  //     }
  //   }
  // }, [effect])

  /* -- FUNCTIONS -- */
  // todo: remove
  // /**
  //  * Handle editing the effect's name.
  //  */
  // const editName = () => {
  //   // Reset the effect's name to the default.
  //   effect.name = ClientEffect.DEFAULT_PROPERTIES.name
  //   // If the selected target environment is not null, set it to null.
  //   if (effect.selectedTargetEnv !== null) {
  //     effect.selectedTargetEnv = null
  //   }
  //   // If the selected target is not null, set it to null.
  //   if (effect.selectedTarget !== null) {
  //     effect.selectedTarget = null
  //   }
  //   // Display the changes.
  //   forceUpdate()
  // }

  // /**
  //  * Handle editing the effect's description.
  //  */
  // const editDescription = () => {
  //   // Reset the effect's description to the default.
  //   effect.description = ClientEffect.DEFAULT_PROPERTIES.description
  //   // If the selected target environment is not null, set it to null.
  //   if (effect.selectedTargetEnv !== null) {
  //     effect.selectedTargetEnv = null
  //   }
  //   // If the selected target is not null, set it to null.
  //   if (effect.selectedTarget !== null) {
  //     effect.selectedTarget = null
  //   }
  //   // Display the changes.
  //   forceUpdate()
  // }

  /* -- RENDER -- */

  // todo: remove
  // if (!formFilledOut) {
  return (
    <div className={rootClassName}>
      <div className='EffectContent'>
        <form
          className='EffectForm'
          // todo: remove
          // onSubmit={(e) => {
          //   e.preventDefault()
          //   setFormFilledOut(true)
          // }}
        >
          <Detail
            label='Name'
            initialValue={effect.name}
            deliverValue={(name: string) => {
              effect.name = name
              forceUpdate()
            }}
            options={{
              placeholder: 'Required',
            }}
          />
          <DetailBox
            label='Description'
            initialValue={effect.description}
            deliverValue={(description: string) => {
              effect.description = description
              forceUpdate()
            }}
            options={{
              placeholder: 'Required',
              emptyStringAllowed: true,
            }}
          />
          <TargetEnvironments
            action={action}
            effect={effect}
            targetEnvironments={targetEnvironments}
            setClearForm={setClearForm}
          />
        </form>

        {/* 
            // todo: remove
            <div
            className={submitButtonClassName}
            onClick={() => setFormFilledOut(true)}
          >
            Submit
          </div> */}
      </div>
    </div>
  )
  // todo: remove
  // } else if (formFilledOut) {
  //   return (
  //     <div className={rootClassName}>
  //       <div className='EffectContent'>
  //         <div className='EffectNameContainer'>
  //           <div className='EffectName'>Name: {effect.name}</div>
  //           <MiniButtonSVG
  //             purpose={EMiniButtonSVGPurpose.Edit}
  //             uniqueClassName='EditButton'
  //             handleClick={editName}
  //             tooltipDescription={`Edit the effect's name.`}
  //           />
  //         </div>
  //         <div className='EffectDescriptionContainer'>
  //           <div className='EffectDescription'>
  //             Description: {effect.description.replace(/<[^>]*>?/gm, '')}
  //           </div>
  //           <MiniButtonSVG
  //             purpose={EMiniButtonSVGPurpose.Edit}
  //             uniqueClassName='EditButton'
  //             handleClick={editDescription}
  //             tooltipDescription={`Edit the effect's description.`}
  //           />
  //         </div>
  //         <TargetEnvironments
  //           action={action}
  //           effect={effect}
  //           targetEnvironments={targetEnvironments}
  //         />
  //       </div>
  //     </div>
  //   )
  // } else {
  //   return null
  // }
}

/* ---------------------------- TYPES FOR EFFECTS ---------------------------- */

/**
 * Props for Effects component.
 */
export type TEffects = {
  /**
   * The action to execute.
   */
  action: ClientMissionAction
  /**
   * The effect to apply to the target.
   */
  effect: ClientEffect
  /**
   * List of target environments to apply effects to.
   */
  targetEnvironments: ClientTargetEnvironment[]
  /**
   * Whether or not to display the content.
   */
  display: boolean
  /**
   * Function to change the clear form value.
   */
  setClearForm: (value: boolean) => void
}
