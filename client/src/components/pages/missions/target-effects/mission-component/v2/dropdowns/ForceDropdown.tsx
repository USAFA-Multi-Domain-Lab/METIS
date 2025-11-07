import { DetailDropdown } from '@client/components/content/form/dropdown/'
import type { ClientMissionForce } from '@client/missions/forces/ClientMissionForce'
import type { TForceDropdown_P } from '..'

export default function (props: TForceDropdown_P): TReactElement {
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
