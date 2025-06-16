import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import ButtonSvgEngine from './engines'
import { TDividerSvg } from './types'

/**
 * A class representing a divider with an SVG icon.
 * It is used in the `ButtonSvgPanel` component.
 * @note This class is not meant to be instantiated directly.
 * Use {@link SvgDivider.create} instead.
 * @see {@link TDividerSvg} for the type of props used.
 * @see {@link ButtonSvgEngine} for the engine that powers this component.
 */
export default class SvgDivider implements TDividerSvg {
  /**
   * The engine that manages the button's state and rendering.
   */
  public get engine(): ButtonSvgEngine {
    return this._engine
  }

  /**
   * The unique key for the divider.
   */
  public get key(): TDividerSvg['key'] {
    return this._key
  }

  /**
   * The type of the divider.
   */
  public get type(): TDividerSvg['type'] {
    return this._type
  }

  /**
   * The icon for the divider.
   */
  public get icon(): TDividerSvg['icon'] {
    return this._icon
  }

  constructor(
    private readonly _engine: ButtonSvgEngine,
    private _key: TDividerSvg['key'] = SvgDivider.DEFAULT_PROPS.key,
    private _type: TDividerSvg['type'] = SvgDivider.DEFAULT_PROPS.type,
    private _icon: TDividerSvg['icon'] = SvgDivider.DEFAULT_PROPS.icon,
    public description: TDividerSvg['description'] = SvgDivider.DEFAULT_PROPS
      .description,
    public uniqueClassList: ClassList = SvgDivider.DEFAULT_PROPS
      .uniqueClassList,
    public disabled: TDividerSvg['disabled'] = SvgDivider.DEFAULT_PROPS
      .disabled,
    public hidden: TDividerSvg['hidden'] = SvgDivider.DEFAULT_PROPS.hidden,
  ) {
    this._engine = _engine
    this._key = _key
    this._type = _type
    this._icon = _icon
    this.description = description
    this.uniqueClassList = uniqueClassList
    this.disabled = disabled
    this.hidden = hidden
  }

  /**
   * Converts the divider to its props representation.
   * @returns The props of the divider.
   */
  public toProps(): TDividerSvg {
    return {
      key: this.key,
      type: this.type,
      icon: this.icon,
      description: this.description,
      uniqueClassList: this.uniqueClassList,
      disabled: this.disabled,
      hidden: this.hidden,
    }
  }

  /**
   * Default props when adding a new divider.
   */
  public static get DEFAULT_PROPS(): Required<TDividerSvg> {
    return {
      key: StringToolbox.generateRandomId(),
      type: 'divider',
      icon: 'divider',
      description: '',
      uniqueClassList: new ClassList(),
      disabled: false,
      hidden: false,
    }
  }

  /**
   * Creates a new instance of `DividerSvg` with the provided data.
   * @param engine The engine that manages the divider's state and rendering.
   * @param data The data to create the divider with.
   * @returns A new instance of `DividerSvg`.
   */
  public static create(
    engine: ButtonSvgEngine,
    data: Partial<TDividerSvg> = {},
  ): SvgDivider {
    return new SvgDivider(
      engine,
      data.key,
      data.type,
      data.icon,
      data.description,
      data.uniqueClassList,
      data.disabled,
      data.hidden,
    )
  }
}
