import { ClientMission } from '@client/missions/ClientMission'
import type {
  TCreateNewOptions,
  TSessionRealmJson,
} from '@shared/sessions/realms/SessionRealm'
import { SessionRealm } from '@shared/sessions/realms/SessionRealm'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import type { TMetisClientComponents } from '..'
import type { SessionClient } from './SessionClient'

/**
 * Client-side representation of a session realm.
 */
export class ClientSessionRealm extends SessionRealm<TMetisClientComponents> {
  /**
   * @param _id The unique ID of the realm.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   * @param mission The realm's own copy of the mission.
   */
  public constructor(
    _id: string,
    name: string,
    session: SessionClient,
    mission: ClientMission,
  ) {
    super(_id, name, session, mission)
  }

  /**
   * Deserializes a {@link ClientSessionRealm} from a {@link TSessionRealmJson}.
   */
  public static fromJson(
    data: TSessionRealmJson,
    session: SessionClient,
  ): ClientSessionRealm {
    return new ClientSessionRealm(
      data._id,
      data.name,
      session,
      ClientMission.fromExistingJson(data.mission, {
        nonRevealedDisplayMode: 'blur',
      }),
    )
  }

  /**
   * Creates a new {@link ClientSessionRealm} with a random ID.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   * @param options Additional options for creating a new realm.
   */
  public static createNew(
    name: string,
    session: SessionClient,
    options: TCreateNewOptions<TMetisClientComponents> = {},
  ): ClientSessionRealm {
    const {
      mission = ClientMission.createNew(),
      _id = StringToolbox.generateRandomId(),
    } = options
    return new ClientSessionRealm(_id, name, session, mission)
  }
}
