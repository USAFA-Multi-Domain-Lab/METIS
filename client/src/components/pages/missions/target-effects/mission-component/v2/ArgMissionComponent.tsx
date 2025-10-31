import { useState } from 'react'
import { ClientEffect } from 'src/missions/effects'
import ClientMissionForce from 'src/missions/forces'
import { TArgMissionComponent_P } from './types'

export default function (props: TArgMissionComponent_P): TReactElement {
  const effect: ClientEffect = props.effect

  const [forces, setForces] = useState<ClientMissionForce[]>(
    effect.mission.forces,
  )

  // const [forceState, setForceState] = useState<TForceDropdown_P>(() => {
  //   const state: TForceDropdown_P = {
  //     required: arg.required,
  //     active: false,
  //     forces,
  //     selection: null,
  //     select: (force: any) => {
  //       setForceState((prev) => ({
  //         ...prev,
  //         force,
  //       }))
  //     },
  //   }
  //   // Activate the force dropdown if the
  //   // arg type requires force selection.
  //   if (FORCE_SELECTION_ARG_TYPES.includes(arg.type)) state.active = true
  //   return state
  // })

  return <>{/* <ForceDropdown {...forceState} /> */}</>
}
