import { DetailDropdown } from 'metis/client/components/content/form/dropdown/'
import { ClientEffect } from 'metis/client/missions/effects'
import ClientMissionFile from 'metis/client/missions/files'
import { compute } from 'metis/client/toolbox'
import { TMissionComponentArg } from 'metis/target-environments/args/mission-component'

/**
 * Renders a dropdown for the argument whose type is `"file"`.
 */
export default function ArgFile({
  effect: { mission },
  arg: { name, type, tooltipDescription, required },
  existsInEffectArgs,
  fileIsActive,
  fileValue: [fileValue, setFileValue],
  optionalFileValue: [optionalFileValue, setOptionalFileValue],
}: TArgFile_P): TReactElement | null {
  /* -- COMPUTED -- */

  /**
   * The list of files to display in the dropdown.
   */
  const files: ClientMissionFile[] = compute(() => mission.files)

  /**
   * The warning message to display when the file is no longer available in the mission.
   */
  const warningMessage: string = compute(() => {
    if (existsInEffectArgs) {
      const fileName = required ? fileValue.name : optionalFileValue?.name
      return (
        `"${fileName}" is no longer available in the mission. ` +
        `This is likely due to the file being deleted. Please select a valid file, or delete this effect.`
      )
    } else {
      return ''
    }
  })

  /**
   * The tooltip description to display for a file argument.
   */
  const fileTooltip: string = compute(() => {
    if (type === 'file' && tooltipDescription) {
      return tooltipDescription
    }

    return ''
  })

  /**
   * The label to display for the file dropdown.
   */
  const label: string = compute(() => (type === 'file' ? name : 'File'))

  /* -- RENDER -- */

  if (!fileIsActive) return null

  if (required) {
    return (
      <DetailDropdown<ClientMissionFile>
        fieldType={'required'}
        label={label}
        options={files}
        value={fileValue}
        setValue={setFileValue}
        tooltipDescription={fileTooltip}
        isExpanded={false}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        handleInvalidOption={{
          method: 'warning',
          message: warningMessage,
        }}
      />
    )
  } else {
    return (
      <DetailDropdown<ClientMissionFile>
        fieldType={'optional'}
        label={label}
        options={files}
        value={optionalFileValue}
        setValue={setOptionalFileValue}
        tooltipDescription={fileTooltip}
        isExpanded={false}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={{
          method: 'warning',
          message: warningMessage,
        }}
        emptyText='Select a file'
      />
    )
  }
}

/* ---------------------------- TYPES FOR FILE ARG ---------------------------- */

/**
 * The props for the `ArgFile` component.
 */
type TArgFile_P = {
  /**
   * The effect that the arguments belong to.
   */
  effect: ClientEffect
  /**
   * The mission component argument to render.
   */
  arg: TMissionComponentArg
  /**
   * Determines if the argument is already present in the effect's arguments.
   */
  existsInEffectArgs: boolean
  /**
   * Determines if the file should be present in the effect's arguments
   * and if the file dropdown should be displayed.
   */
  fileIsActive: boolean
  /**
   * The file value to display in the dropdown.
   */
  fileValue: TReactState<ClientMissionFile>
  /**
   * The optional file value to display in the dropdown.
   */
  optionalFileValue: TReactState<ClientMissionFile | null>
}
