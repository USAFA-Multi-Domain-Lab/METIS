import type { ClassList } from '@shared/toolbox/html/ClassList'
import {
  createToJsonMethod,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'
import { StringToolbox } from '@shared/toolbox/strings/StringToolbox'

/**
 * Can be attached to a node to alert an operator of the
 * node with a customizable message. A severity level can
 * be set on the alert to convey the importance of the alert.
 */
export class NodeAlert implements TJsonSerializable<TNodeAlertJson> {
  /**
   * A numerical representation of the severity level,
   * which can be used to compare two node alerts to
   * see which one is of higher importance.
   */
  public get severityLevelNumber(): number {
    return NodeAlert.SEVERITY_LEVELS.indexOf(this.severityLevel)
  }

  private constructor(
    /**
     * Unique identifier for the alert.
     */
    public readonly _id: string,
    /**
     * The ID of the node with which the alert is associated.
     */
    public readonly nodeId: string,
    /**
     * The message to be displayed to an operator
     * of the node.
     */
    public message: string,
    /**
     * Indicates the importance/urgency of the alert.
     */
    public severityLevel: TNodeAlertSeverityLevel,
    /**
     * Tracks whether the alert has been read and
     * dismissed by an operator. Once viewed and
     * closed, this should be set to true.
     */
    public acknowledged: boolean,
  ) {
    this.toJson = createToJsonMethod<NodeAlert, TNodeAlertJson>(this, [
      '_id',
      'nodeId',
      'message',
      'severityLevel',
      'acknowledged',
    ])
  }

  /**
   * Adds CSS classes to a {@link ClassList} based on
   * the severity level of the alert.
   * @param classList The class list to which the severity
   * level classes will be added.
   */
  public addSeverityLevelClasses(classList: ClassList): void {
    classList.switch(
      {
        info: 'SeverityLevel_info',
        suspicious: 'SeverityLevel_suspicious',
        warning: 'SeverityLevel_warning',
        danger: 'SeverityLevel_danger',
      },
      this.severityLevel,
    )
  }

  // Implemented
  public toJson: () => TNodeAlertJson

  /**
   * The possible severity levels for node alerts.
   * @note IMPORTANT Consider the order here. The more
   * severe levels should be listed last because
   * the order is used to determine which animation
   * to display on a map node. If multiple alerts are
   * on a node, the animation for the most severe
   * alert is shown.
   */
  public static get SEVERITY_LEVELS(): TNodeAlertSeverityLevel[] {
    return ['info', 'suspicious', 'warning', 'danger']
  }
  /**
   * Creates a brand new {@link NodeAlert} object.
   * @param message The message to be displayed to an operator
   * of the node.
   * @param severityLevel Indicates the importance/urgency of the alert.
   * @returns the new {@link NodeAlert} object.
   */
  public static createNew(
    nodeId: string,
    message: string,
    severityLevel: TNodeAlertSeverityLevel = 'warning',
  ): NodeAlert {
    return new NodeAlert(
      StringToolbox.generateRandomId(),
      nodeId,
      message,
      severityLevel,
      false,
    )
  }

  /**
   * @param json JSON data to deserialize.
   * @returns the new {@link NodeAlert} object
   * created from the JSON.
   */
  public static fromJson(json: TNodeAlertJson): NodeAlert
  /**
   * @param json an array of JSON data to deserialize.
   * @returns a serializable array of {@link NodeAlert}.
   */
  public static fromJson(
    json: TNodeAlertJson[],
  ): JsonSerializableArray<NodeAlert>
  // Actual implementation.
  public static fromJson(
    json: TNodeAlertJson | TNodeAlertJson[],
  ): NodeAlert | JsonSerializableArray<NodeAlert> {
    if (Array.isArray(json)) {
      return new JsonSerializableArray(
        ...json.map(
          (item) =>
            new NodeAlert(
              item._id,
              item.nodeId,
              item.message,
              item.severityLevel,
              item.acknowledged,
            ),
        ),
      )
    }
    return new NodeAlert(
      json._id,
      json.nodeId,
      json.message,
      json.severityLevel,
      json.acknowledged,
    )
  }
}

/* -- TYPES -- */

/**
 * The severity level of a node alert, indicating
 * the importance of the alert.
 */
export type TNodeAlertSeverityLevel =
  | 'info' // Experimental, may not stay.
  | 'suspicious'
  | 'warning'
  | 'danger'

/**
 * The JSON representation of {@link NodeAlert}.
 */
export type TNodeAlertJson = {
  /**
   * @see {@link NodeAlert._id}
   */
  _id: string
  /**
   * @see {@link NodeAlert.nodeId}
   */
  nodeId: string
  /**
   * @see {@link NodeAlert.message}
   */
  message: string
  /**
   * @see {@link NodeAlert.severityLevel}
   */
  severityLevel: TNodeAlertSeverityLevel
  /**
   * @see {@link NodeAlert.acknowledged}
   */
  acknowledged: boolean
}
