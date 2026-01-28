import {
  createToJsonMethod,
  type TJsonSerializable,
} from '@shared/toolbox/serialization/json'
import { JsonSerializableArray } from '@shared/toolbox/serialization/JsonSerializableArray'

/**
 * Can be attached to a node to alert an operator of the
 * node with a customizable message. A severity level can
 * be set on the alert to convey the importance of the alert.
 */
export class NodeAlert implements TJsonSerializable<TNodeAlertJson> {
  public constructor(
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
      'message',
      'severityLevel',
      'acknowledged',
    ])
  }

  // Implemented
  public toJson: () => TNodeAlertJson

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
            new NodeAlert(item.message, item.severityLevel, item.acknowledged),
        ),
      )
    }
    return new NodeAlert(json.message, json.severityLevel, json.acknowledged)
  }
}

/* -- TYPES -- */

/**
 * The severity level of a node alert, indicating
 * the importance of the alert.
 */
export type TNodeAlertSeverityLevel = 'suspicious' | 'warning' | 'danger'

/**
 * The JSON representation of {@link NodeAlert}.
 */
export type TNodeAlertJson = {
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
