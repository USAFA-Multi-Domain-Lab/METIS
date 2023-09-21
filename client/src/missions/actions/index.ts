import ClientMission from '..'
import MissionAction from '../../../../shared/missions/actions'
import ClientMissionNode from '../nodes'

export default class ClientMissionAction extends MissionAction<
  ClientMission,
  ClientMissionNode
> {}
