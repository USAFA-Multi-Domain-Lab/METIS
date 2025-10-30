import { DetailDropdown } from 'src/components/content/form/dropdown/'
import ClientMissionForce from 'src/missions/forces'
import { TForceDropdown_P } from '../types'

export default function (props: TForceDropdown_P): JSX.Element {
  const { active } = props

  if (!active) return <></>

  if (props.required) {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'required'}
        label={'Force'}
        options={[]}
        value={props.force}
        setValue={props.selectForce}
        isExpanded={false}
        getKey={({ _id }) => _id}
        render={({ name }) => name}
        handleInvalidOption={{
          method: 'warning',
          message: '',
        }}
      />
    )
  } else {
    return (
      <DetailDropdown<ClientMissionForce>
        fieldType={'optional'}
        label={'Force'}
        options={[]}
        value={props.force}
        setValue={props.selectForce}
        isExpanded={false}
        render={(option) => option?.name}
        getKey={(option) => option?._id}
        handleInvalidOption={{
          method: 'warning',
          message: '',
        }}
        emptyText='Select a force'
      />
    )
  }
}
