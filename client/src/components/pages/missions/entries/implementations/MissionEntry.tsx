import Divider from '@client/components/content/form/Divider'
import DetailMultiSelect from '@client/components/content/form/multiselect/DetailMultiSelect'
import { useMissionPageContext } from '@client/components/pages/missions/context'
import { ClientMission } from '@client/missions/ClientMission'
import { usePostInitEffect } from '@client/toolbox/hooks'
import { useState } from 'react'
import { DetailString } from '../../../../content/form/DetailString'
import { EffectTimeline } from '../../target-effects/timelines'
import Entry from '../Entry'

/**
 * This will render the basic editable details of the mission itself.
 */
export default function MissionEntry({
  mission,
}: TMissionEntry_P): TReactElement | null {
  /* -- STATE -- */

  const { onChange, viewMode } = useMissionPageContext()
  const [name, setName] = useState<string>(mission.name)
  const [resourceLabel, setResourceLabel] = useState<string>(
    mission.resourceLabel,
  )

  // todo: Remove after demo
  const [colorsDefault, setColorsDefault] = useState<string[]>([])
  const [colorsCheckbox, setColorsCheckbox] = useState<string[]>([])
  const [colorsPills, setColorsPills] = useState<string[]>([])

  /* -- EFFECTS -- */

  // Sync the component state with the mission introduction message
  // and initial resources.
  usePostInitEffect(() => {
    // Update the mission name.
    mission.name = name
    // Update the mission resource label.
    mission.resourceLabel = resourceLabel

    // Allow the user to save the changes.
    onChange(mission)
  }, [name, resourceLabel])

  /* -- RENDER -- */
  return (
    <Entry missionComponent={mission}>
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Name'
        value={name}
        setValue={setName}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.name}
        maxLength={ClientMission.MAX_NAME_LENGTH}
        disabled={viewMode === 'preview'}
        key={`${mission._id}_name`}
      />
      <DetailString
        fieldType='required'
        handleOnBlur='repopulateValue'
        label='Resource Label'
        value={resourceLabel}
        setValue={setResourceLabel}
        defaultValue={ClientMission.DEFAULT_PROPERTIES.resourceLabel}
        maxLength={ClientMission.MAX_RESOURCE_LABEL_LENGTH}
        disabled={viewMode === 'preview'}
        key={`${mission._id}_resourceLabel`}
      />
      <Divider />
      <EffectTimeline<'sessionTriggeredEffect'> host={mission} />
      <Divider />
      {/* todo: Remove after demo */}
      <h3>Multiselect Demo</h3>
      <DetailMultiSelect<string>
        fieldType='required'
        label='Checkbox Only Variant'
        options={['Red', 'Green', 'Blue', 'Yellow', 'Purple']}
        value={colorsCheckbox}
        setValue={(values: string[]) => setColorsCheckbox(values)}
        render={(option: string) => option}
        getKey={(option: string) => option}
        disabled={viewMode === 'preview'}
        variant='checkbox-only'
        key={`${mission._id}_colors_checkbox`}
      />
      <DetailMultiSelect<string>
        fieldType='required'
        label='Checkbox + X Buttons Variant'
        options={['Red', 'Green', 'Blue', 'Yellow', 'Purple']}
        value={colorsDefault}
        setValue={(values: string[]) => setColorsDefault(values)}
        render={(option: string) => option}
        getKey={(option: string) => option}
        disabled={viewMode === 'preview'}
        variant='default'
        key={`${mission._id}_colors_default`}
      />
      <DetailMultiSelect<string>
        fieldType='required'
        label='Swapping Variant'
        options={['Red', 'Green', 'Blue', 'Yellow', 'Purple']}
        value={colorsPills}
        setValue={(values: string[]) => setColorsPills(values)}
        render={(option: string) => option}
        getKey={(option: string) => option}
        disabled={viewMode === 'preview'}
        variant='pills-only'
        key={`${mission._id}_colors_pills`}
      />
    </Entry>
  )
}

/* ---------------------------- TYPES FOR MISSION ENTRY ---------------------------- */

/**
 * The props for the `MissionEntry` component.
 */
type TMissionEntry_P = {
  /**
   * The mission to be edited.
   */
  mission: ClientMission
}
