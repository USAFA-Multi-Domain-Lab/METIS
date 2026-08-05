import { ServerMissionAction } from '@server/missions/actions/ServerMissionAction'
import type { ServerMissionFile } from '@server/missions/files/ServerMissionFile'
import type { ServerMissionForce } from '@server/missions/forces/ServerMissionForce'
import { ServerOutput } from '@server/missions/forces/ServerOutput'
import type { ServerResourcePool } from '@server/missions/forces/ServerResourcePool'
import type { ServerMissionNode } from '@server/missions/nodes/ServerMissionNode'
import type { TActionModifier } from '@shared/missions/actions/MissionAction'
import type { TOutputContext } from '@shared/missions/forces/MissionOutput'
import type { TMissionJsonOptions } from '@shared/missions/Mission'
import type { MissionComponent } from '@shared/missions/MissionComponent'
import type { TNodeAlertSeverityLevel } from '@shared/missions/nodes/NodeAlert'
import type { TSessionRealmJson } from '@shared/sessions/SessionRealm'
import { SessionRealm } from '@shared/sessions/SessionRealm'
import type { TInstanceOrArray } from '@shared/toolbox/arrays/ArrayToolbox'
import { ArrayToolbox } from '@shared/toolbox/arrays/ArrayToolbox'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'
import { targetEnvLogger } from '../logging'
import { ServerMission } from '../missions/ServerMission'
import { ComponentModifierBatchMap } from './ComponentModifierBatchMap'
import { ServerSessionMember } from './ServerSessionMember'
import type { SessionServer, TOutputTo } from './SessionServer'

/**
 * Server-side representation of a session realm.
 */
export class ServerSessionRealm extends SessionRealm<TMetisServerComponents> {
  /**
   * @see {@link TServerSessionRealmOptions.missionMintOptions}
   */
  public missionMintOptions: TMissionJsonOptions | 'blank'

  /**
   * @param _id The unique ID of the realm.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   * @param missionMintOptions Options for minting a new copy of the session's
   * mission for use in this realm. These options are passed to {@link ServerMission.fromSaveJson}
   * in order to create a new instance of the mission with the specified options.
   * @note If marked as blank, instead of minting a copy from the session's
   * mission, a new blank mission will be created for this realm.
   */
  protected constructor(
    _id: string,
    name: string,
    session: SessionServer,
    missionMintOptions: TMissionJsonOptions | 'blank',
  ) {
    super(
      _id,
      name,
      session,
      ServerSessionRealm.mintMission(session, missionMintOptions),
    )
    this.missionMintOptions = missionMintOptions
  }

  // Implemented
  protected initialize(): void {
    this.mapActions()
    this.mission.forces.forEach((force) => {
      // Generate the intro message output for every force.
      force.sendIntroMessage()
      force.handleExcludedNodes()
    })
  }

  /**
   * Gracefully cancels any action executions that are currently
   * in progress.
   */
  public async abortExecutions(): Promise<void> {
    let allExecutions: Promise<void>[] = []

    this.mission.allNodes.forEach((node) => {
      if (!node.executing) return

      let execution = node.latestExecution!
      // Register the listener (and capture its promise) before aborting, so
      // a synchronous 'aborted' emission can't be missed and the promise is
      // in the array before we await it.
      allExecutions.push(
        new Promise<void>((resolve) => {
          execution.addEventListener('aborted', () => resolve())
        }),
      )
      execution.abort()
    })

    // Wait for every aborted execution to settle. Resolves immediately when
    // there are none.
    await Promise.all(allExecutions)
  }

  /**
   * Resets the realm to a fresh initialized state.
   */
  public reset(): void {
    this.mission = ServerSessionRealm.mintMission(
      this.session,
      this.missionMintOptions,
    )
    this.initialize()
  }

  // Implemented
  public toJson(options: TServerRealmJsonOptions = {}): TSessionRealmJson {
    return {
      _id: this._id,
      name: this.name,
      mission: this.mission.toJson(options),
    }
  }

  /**
   * Confirms the mission component is a part of this realm's mission.
   * @param component The component to check.
   * @throws If the component does not belong to the realm's mission.
   */
  private confirmComponentInMission(
    component: MissionComponent<any, any>,
  ): void {
    if (!this.mission.has(component)) {
      throw new Error(
        `Could not perform the operation on the component with ID "${component._id}" because it does not belong to the mission with ID "${this.mission._id}".`,
      )
    }
  }

  /**
   * Confirms the mission components are a part of this realm's mission.
   * @param components The components to check. This can be multiple instances or arrays
   * of components. Allowing for multiple instances and arrays provides flexibility for
   * passing components from various sources without needing to consolidate them beforehand.
   * @throws If any component does not belong to the realm's mission.
   */
  private confirmComponentsInMission(
    ...components: Array<TInstanceOrArray<MissionComponent<any, any>>>
  ): void {
    for (let component of ArrayToolbox.toArray(components.flat())) {
      this.confirmComponentInMission(component)
    }
  }

  /**
   * Handles the blocking and unblocking of nodes during a session.
   * @param nodes The nodes to block or unblock.
   * @param blocked Whether to block or unblock the nodes.
   */
  public updateNodeBlockStatus(
    nodes: ServerMissionNode[],
    blocked: boolean,
  ): void {
    this.confirmComponentsInMission(nodes)
    nodes.forEach((node) => (node.blocked = blocked))

    let batchMap = new ComponentModifierBatchMap(this, nodes)

    batchMap.emit('node-block-status-updated', (nodes) => ({
      data: {
        blocked,
        lookUpData: ArrayToolbox.mapProperties(nodes, ['_id', 'forceId']),
      },
    }))
  }

  /**
   * Updates the open/closed state of the provided nodes during an active session and notifies all members.
   * @param nodes The nodes whose open state should be changed.
   * @param open True to open the nodes (revealing descendants), false to close them (hiding descendants).
   * @note Nodes already in the desired state are skipped with a warning.
   * @note Nodes with `revealAllNodes` enabled cannot be opened or closed and will be skipped.
   */
  public updateNodeOpenState(nodes: ServerMissionNode[], open: boolean): void {
    this.confirmComponentsInMission(nodes)

    // Filter to nodes where the operation is actually permitted.
    let validNodes = nodes.filter((node) => {
      if (open && !node.openable) {
        targetEnvLogger.warn(
          `Skipping open on node "${node.name}" (${node._id}): already opened or revealAllNodes enabled`,
        )
        return false
      } else if (!open && !node.closable) {
        targetEnvLogger.warn(
          `Skipping close on node "${node.name}" (${node._id}): already closed or revealAllNodes enabled`,
        )
        return false
      }
      return true
    })

    if (validNodes.length === 0) return

    // Perform the open/close operation on each valid node.
    validNodes.forEach((node) => node.openState(open))

    // Notify all members about the state changes.
    let batchMap = new ComponentModifierBatchMap(this, validNodes)
    batchMap.emit('node-open-state-updated', (batchNodes, members) => {
      let nodes = batchNodes.map((node) => {
        let {
          revealedStructure: structure,
          revealedDescendants: descendants,
          revealedDescendantPrototypes: prototypes,
        } = node
        return {
          _id: node._id,
          forceId: node.forceId,
          structure,
          // Known/intentional: this shared payload is broadcast to the
          // whole batch, so we serialize under members[0]'s identity even
          // though 'member-specific' is requested. This is safe because
          // node data does not differ between members of the same force —
          // every member with visibility of a force sees identical node
          // data. If node visibility ever varies member to member within a
          // force, this must switch to emitMemberSpecific (see the matching
          // note in onRequestOpenNode.ts).
          revealedDescendants: descendants.map((descendant) =>
            descendant.toJson({
              sessionDataExposure: {
                expose: 'member-specific',
                memberId: members[0]._id,
              },
            }),
          ),
          revealedDescendantPrototypes: prototypes.map((prototype) =>
            prototype.toJson(),
          ),
        }
      })
      return {
        data: {
          opened: open,
          nodes,
        },
      }
    })
  }

  /**
   * Adds an alert to the given nodes with the specified severity level.
   * @param nodes The nodes to which the alert will be added.
   * @param message The message to display when the alert is opened.
   * @param severityLevel The severity level of the alert, indicating
   * the importance/urgency of the alert.
   */
  public addNodeAlert(
    nodes: ServerMissionNode[],
    message: string,
    severityLevel: TNodeAlertSeverityLevel,
  ): void {
    this.confirmComponentsInMission(nodes)

    // Add the alert to each node and build a lookup map for batched emission.
    let alertIdMap = new Map<string, string>()
    for (let node of nodes) {
      alertIdMap.set(node._id, node.alert(message, severityLevel)._id)
    }

    let batchMap = new ComponentModifierBatchMap(this, nodes)
    batchMap.emit('node-alert-added', (nodes) => ({
      data: {
        message,
        severityLevel,
        ids: nodes.map((node) => ({
          nodeId: node._id,
          alertId: alertIdMap.get(node._id)!,
        })),
      },
    }))
  }

  /**
   * Applies a modifier to one or more actions and emits a batch event.
   * @param actions The actions to modify.
   * @param modifier The modifier to apply.
   */
  private modifyActions(
    actions: ServerMissionAction[],
    modifier: TActionModifier,
  ): void {
    let method = ServerMissionAction.getServerMethodForModifier(modifier)

    this.confirmComponentsInMission(actions)
    actions.forEach((action) => action.applyModifier(modifier))

    let batchMap = new ComponentModifierBatchMap(this, actions)
    batchMap.emit(method, (actions) => ({
      data: {
        lookUpData: ArrayToolbox.mapProperties(actions, [
          '_id',
          'forceId',
          'nodeId',
        ]),
        modifier,
      },
    }))
  }

  /**
   * Modifies the success chance of one or more actions.
   * @param actions The actions to modify.
   * @param operand The operand to modify the success chance by.
   */
  public modifySuccessChance(
    actions: ServerMissionAction[],
    operand: number,
  ): void {
    let appliedAt = Date.now()
    let modifier: TActionModifier = {
      type: 'success-chance',
      amount: operand,
      appliedAt,
      resourceId: null,
    }
    this.modifyActions(actions, modifier)
  }

  /**
   * Modifies the processing time of one or more actions.
   * @param actions The actions to modify.
   * @param operand The operand to modify the processing time by.
   */
  public modifyProcessTime(
    actions: ServerMissionAction[],
    operand: number,
  ): void {
    let appliedAt = Date.now()
    let modifier: TActionModifier = {
      type: 'process-time',
      amount: operand,
      appliedAt,
      resourceId: null,
    }
    this.modifyActions(actions, modifier)
  }

  /**
   * Modifies the resource cost of one or more actions.
   * @param actions The actions to modify.
   * @param resourceId The ID of the resource whose cost to modify.
   * @param operand The operand to modify the resource cost by.
   */
  public modifyResourceCost(
    actions: ServerMissionAction[],
    resourceId: string,
    operand: number,
  ): void {
    let appliedAt = Date.now()
    let modifier: TActionModifier = {
      type: 'resource-cost',
      amount: operand,
      appliedAt,
      resourceId,
    }
    this.modifyActions(actions, modifier)
  }

  /**
   * Modifies one or more resource pools by applying the given amount
   * to each pool.
   * @param pools The resource pools to modify.
   * @param operand The amount by which to modify each resource pool.
   * @note A negative value will subtract and a positive
   * value will add to each resource pool.
   */
  public modifyResourcePool(
    pools: ServerResourcePool[],
    operand: number,
  ): void {
    this.confirmComponentsInMission(pools)
    pools.forEach((pool) => pool.onModify(operand))

    // Send update to client connections to keep them
    // synced with the server.
    let batchMap = new ComponentModifierBatchMap(this, pools)
    batchMap.emit('resource-pool-updated', (pools) => ({
      data: {
        lookUpData: ArrayToolbox.mapProperties(pools, ['_id', 'forceId']),
        operand,
      },
    }))
  }

  /**
   * Updates access to the given files in the mission for the given forces.
   * @param forces The forces which will have their access modified.
   * @param files The files to which access is granted/revoked.
   * @param granted Whether access is granted or revoked.
   */
  public updateFileAccess(
    forces: ServerMissionForce[],
    files: ServerMissionFile[],
    granted: boolean,
  ): void {
    this.confirmComponentsInMission(files, forces)
    forces.forEach((force) => force.updateFileAccess(files, granted))

    let batchMap = new ComponentModifierBatchMap(this, forces)

    batchMap.emit('file-access-updated', (forces) => ({
      data: {
        granted,
        forceIds: forces._ids,
        files: files.map((file) => file.toJson()),
      },
    }))

    if (granted) {
      // !! DISABLED UNTIL 2.6
      // batchMap.emitMemberSpecific('session-panel-alert', (forces, member) => {
      //   let panels = this.session.getSessionPanelAlerts(member)
      //   panels.add('Files')
      //   return {
      //     data: {
      //       panels: [...panels],
      //     },
      //   }
      // })
    }
  }

  /**
   * Sends an output to the force's output panel.
   * @param prefix The prefix to prepend to the output's message.
   * @param message The output's message.
   * @param context The context describing what triggered the output.
   * @param to Optionally narrows the recipients to a specific force/member.
   */
  public sendOutput(
    prefix: string,
    message: string,
    context: TOutputContext,
    to?: TOutputTo,
  ): void {
    let forceRecipients: ServerMissionForce[] = []
    let member: ServerSessionMember | undefined = to?.member

    // Mark all forces as recipients if
    // no recipient is specified.
    if (!to) {
      forceRecipients = this.mission.forces
    }
    // Mark only the specified force as recipient,
    // otherwise.
    else {
      forceRecipients = [to.force]
    }

    // Loop through any forceRecipients and send the
    // output to each.
    for (let force of forceRecipients) {
      // Create a new output object.
      let output = ServerOutput.generate(
        force,
        prefix,
        message,
        context,
        to?.member?._id,
      )

      // Store the output in the force.
      force.storeOutput(output)

      // If a member is specified, send the output to that member.
      // Do not send to complete-visibility members in this case,
      // since private outputs are truly private in METIS.
      if (member) {
        let outputJson = output.toJson()
        member.emit('send-output', {
          data: {
            outputData: outputJson,
          },
        })
        this.session.emitSessionPanelAlert(member, 'Output')
        continue
      }

      // Otherwise, send the output to all members of the force,
      // scoped to this realm so a realm's output never leaks into
      // another realm sharing the same force.
      ServerSessionMember.emitToGroup(
        this.session.getJoinedMembersForForce(force._id, this._id),
        'send-output',
        {
          data: {
            outputData: output.toJson(),
          },
        },
      )
      this.session.emitSessionPanelAlert(
        this.session.getJoinedMembersForForce(force._id, this._id),
        'Output',
      )
    }
  }

  /**
   * Creates a new {@link ServerSessionRealm} with a random ID.
   * @param name A human-readable name for the realm.
   * @param session The session to which the realm belongs.
   * @param options Additional options for creating a new realm.
   */
  public static createNew(
    name: string,
    session: SessionServer,
    options: TCreateNewServerRealmOptions = {},
  ): ServerSessionRealm {
    const { _id = StringToolbox.generateRandomId(), missionMintOptions = {} } =
      options
    return new ServerSessionRealm(_id, name, session, missionMintOptions)
  }

  /**
   * Mints a new copy of the session's mission for use in this realm.
   * @param session The session to which the realm belongs.
   * @param mintOptions See {@link TServerSessionRealmOptions.missionMintOptions}.
   * @returns A new instance of the session's mission.
   */
  private static mintMission(
    session: SessionServer,
    mintOptions: TMissionJsonOptions | 'blank',
  ): ServerMission {
    if (mintOptions === 'blank') {
      return ServerMission.createNew()
    } else {
      return ServerMission.fromSaveJson(session.mission.toSaveJson(mintOptions))
    }
  }
}

/* -- TYPES -- */

/**
 * Additional options for creating a new {@link ServerSessionRealm}.
 */
export type TServerSessionRealmOptions = {
  /**
   * Options for minting a new copy of the session's mission for use in this realm.
   * These options are passed to {@link ServerMission.fromSaveJson} in order to
   * control what is exposed in the new instance of the mission.
   * @note If marked as blank, instead of minting a copy from the session's
   * mission, a new blank mission will be created for this realm.
   */
  missionMintOptions?: TMissionJsonOptions | 'blank'
}

/**
 * Additional for {@link ServerSessionRealm.toJson} which tailors
 * the resulting data based on the needs of the caller.
 */
export type TServerRealmJsonOptions = TMissionJsonOptions

/**
 * Additional options for {@link ServerSessionRealm.createNew}
 * method.
 */
export type TCreateNewServerRealmOptions = {
  /**
   * The `_id` of the realm.
   * @note If not provided, a random ID  will be
   * generated.
   */
  _id?: string
  /**
   * Options for minting a new copy of the session's mission for use in this realm.
   * These options are passed to {@link ServerMission.fromSaveJson} in order to
   * control what is exposed in the new instance of the mission.
   * @note If marked as blank, instead of minting a copy from the session's
   * mission, a new blank mission will be created for this realm.
   * @default {}
   */
  missionMintOptions?: TMissionJsonOptions | 'blank'
}
