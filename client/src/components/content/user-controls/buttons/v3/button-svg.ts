import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import ButtonSvgEngine from './engines'
import { TButtonSvg } from './types'

/**
 * A class representing a button with an SVG icon.
 * It is used in the `ButtonSvgPanel` component.
 * @note This class is not meant to be instantiated directly.
 * Use {@link SvgButton.create} instead.
 * @see {@link TButtonSvg} for the type of props used.
 * @see {@link ButtonSvgEngine} for the engine that powers this component.
 */
export default class SvgButton implements TButtonSvg {
  /**
   * The engine that manages the button's state and rendering.
   */
  public get engine(): ButtonSvgEngine {
    return this._engine
  }

  /**
   * The unique key for the button.
   */
  public get key(): TButtonSvg['key'] {
    return this._key
  }

  /**
   * The type of the button.
   */
  public get type(): TButtonSvg['type'] {
    return this._type
  }

  /**
   * The icon for the button.
   */
  public get icon(): TButtonSvg['icon'] {
    return this._icon
  }

  /**
   * The label for the button.
   */
  public get label(): TButtonSvg['label'] {
    return this._label
  }

  /**
   * The description for the button.
   */
  public get description(): TButtonSvg['description'] {
    return this.disabled ? '' : this._description
  }
  public set description(value: TButtonSvg['description']) {
    this._description = value
  }

  /**
   * Whether the tooltip for the button should always be shown.
   */
  public get alwaysShowTooltip(): TButtonSvg['alwaysShowTooltip'] {
    return this._alwaysShowTooltip
  }

  /**
   * The cursor style for the button.
   */
  public get cursor(): TButtonSvg['cursor'] {
    return this._cursor
  }

  /**
   * The permissions required to use the button.
   */
  public get permissions(): TButtonSvg['permissions'] {
    return this._permissions
  }

  private constructor(
    private readonly _engine: ButtonSvgEngine,
    private _key: TButtonSvg['key'] = SvgButton.DEFAULT_PROPS.key,
    private _type: TButtonSvg['type'] = SvgButton.DEFAULT_PROPS.type,
    private _icon: TButtonSvg['icon'] = SvgButton.DEFAULT_PROPS.icon,
    private _label: TButtonSvg['label'] = SvgButton.DEFAULT_PROPS.label,
    private _description: TButtonSvg['description'] = SvgButton.DEFAULT_PROPS
      .description,
    public uniqueClassList: TButtonSvg['uniqueClassList'] = SvgButton
      .DEFAULT_PROPS.uniqueClassList,
    public disabled: TButtonSvg['disabled'] = SvgButton.DEFAULT_PROPS.disabled,
    public hidden: TButtonSvg['hidden'] = SvgButton.DEFAULT_PROPS.hidden,
    private _alwaysShowTooltip: TButtonSvg['alwaysShowTooltip'] = SvgButton
      .DEFAULT_PROPS.alwaysShowTooltip,
    private _cursor: TButtonSvg['cursor'] = SvgButton.DEFAULT_PROPS.cursor,
    private _permissions: TButtonSvg['permissions'] = SvgButton.DEFAULT_PROPS
      .permissions,
    public onClick: TButtonSvg['onClick'] = SvgButton.DEFAULT_PROPS.onClick,
    public onCopy: TButtonSvg['onCopy'] = SvgButton.DEFAULT_PROPS.onCopy,
  ) {
    this._engine = _engine
    this._key = _key
    this._type = _type
    this._icon = _icon
    this._label = _label
    this._description = _description
    this.uniqueClassList = uniqueClassList
    this.disabled = disabled
    this.hidden = hidden
    this._alwaysShowTooltip = _alwaysShowTooltip
    this._cursor = _cursor
    this._permissions = _permissions
    this.onClick = onClick
    this.onCopy = onCopy
  }

  /**
   * Converts the button to its props representation.
   * @returns The props of the button.
   */
  public toProps(): TButtonSvg {
    return {
      key: this.key,
      type: this.type,
      icon: this.icon,
      label: this.label,
      description: this.description,
      uniqueClassList: this.uniqueClassList,
      disabled: this.disabled,
      hidden: this.hidden,
      alwaysShowTooltip: this.alwaysShowTooltip,
      cursor: this.cursor,
      permissions: this.permissions,
      onClick: this.onClick,
      onCopy: this.onCopy,
    }
  }

  /**
   * Default props when adding a new button.
   */
  public static get DEFAULT_PROPS(): Required<TButtonSvg> {
    return {
      key: StringToolbox.generateRandomId(),
      type: 'button',
      icon: 'options',
      label: '',
      description: '',
      uniqueClassList: new ClassList(),
      disabled: false,
      hidden: false,
      alwaysShowTooltip: false,
      cursor: 'pointer',
      permissions: [],
      onClick: () => {},
      onCopy: () => {},
    }
  }

  /**
   * Creates a new button in the given engine.
   * @param engine The engine in which to create the button.
   * @param data The data for the button.
   * @returns The created button.
   */
  public static create(
    engine: ButtonSvgEngine,
    data: Partial<TButtonSvg> = {},
  ): SvgButton {
    return new SvgButton(
      engine,
      data.key,
      data.type,
      data.icon,
      data.label,
      data.description,
      data.uniqueClassList,
      data.disabled,
      data.hidden,
      data.alwaysShowTooltip,
      data.cursor,
      data.permissions,
      data.onClick,
      data.onCopy,
    )
  }
}
