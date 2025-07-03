import ClassList from '../../../../../../../shared/toolbox/html/class-lists'
import StringToolbox from '../../../../../../../shared/toolbox/strings'
import ButtonSvgEngine from './engines'
import { TStepperSvg } from './types'

/**
 * A class representing a stepper with SVG buttons
 * for stepping up and down, along with a text label.
 * It is used in the `ButtonSvgPanel` component.
 * @note This class is not meant to be instantiated directly.
 * Use {@link SvgStepper.create} instead.
 * @see {@link TStepperSvg} for the type of props used.
 * @see {@link ButtonSvgEngine} for the engine that powers this component.
 */
export default class SvgStepper implements TStepperSvg {
  /**
   * The engine that manages the stepper's state and rendering.
   */
  public get engine(): ButtonSvgEngine {
    return this._engine
  }

  /**
   * The unique key for the stepper.
   */
  public get key(): TStepperSvg['key'] {
    return this._key
  }

  /**
   * The type of the stepper.
   */
  public get type(): TStepperSvg['type'] {
    return this._type
  }

  /**
   * The icon for the stepper.
   */
  public get icon(): TStepperSvg['icon'] {
    return this._icon
  }

  constructor(
    private readonly _engine: ButtonSvgEngine,
    private _key: TStepperSvg['key'] = SvgStepper.DEFAULT_PROPS.key,
    private _type: TStepperSvg['type'] = SvgStepper.DEFAULT_PROPS.type,
    private _icon: TStepperSvg['icon'] = SvgStepper.DEFAULT_PROPS.icon,
    public description: TStepperSvg['description'] = SvgStepper.DEFAULT_PROPS
      .description,
    public uniqueClassList: TStepperSvg['uniqueClassList'] = SvgStepper
      .DEFAULT_PROPS.uniqueClassList,
    public disabled: TStepperSvg['disabled'] = SvgStepper.DEFAULT_PROPS
      .disabled,
    public hidden: TStepperSvg['hidden'] = SvgStepper.DEFAULT_PROPS.hidden,
    public maximum: TStepperSvg['maximum'] = SvgStepper.DEFAULT_PROPS.maximum,
    public value: TStepperSvg['value'] = SvgStepper.DEFAULT_PROPS.value,
  ) {
    this._engine = _engine
    this._key = _key
    this._type = _type
    this._icon = _icon
    this.description = description
    this.uniqueClassList = uniqueClassList
    this.disabled = disabled
    this.hidden = hidden
    this.maximum = maximum
    this.value = value
  }

  /**
   * Converts the stepper to its props representation.
   * @returns The props of the stepper.
   */
  public toProps(): TStepperSvg {
    return {
      key: this.key,
      type: this.type,
      icon: this.icon,
      description: this.description,
      uniqueClassList: this.uniqueClassList,
      disabled: this.disabled,
      hidden: this.hidden,
      maximum: this.maximum,
      value: this.value,
    }
  }

  /**
   * Default props when adding a new stepper.
   */
  public static get DEFAULT_PROPS(): Required<TStepperSvg> {
    return {
      key: StringToolbox.generateRandomId(),
      type: 'stepper',
      icon: 'stepper-page',
      description: '',
      uniqueClassList: new ClassList(),
      disabled: false,
      hidden: false,
      maximum: 1,
      value: [1, () => {}],
    }
  }

  /**
   * Creates a new instance of `StepperSvg` with the provided data.
   * @param engine The engine that manages the stepper's state and rendering.
   * @param data The data to create the stepper with.
   * @returns A new instance of `StepperSvg`.
   */
  public static create(
    engine: ButtonSvgEngine,
    data: Partial<TStepperSvg> = {},
  ): SvgStepper {
    return new SvgStepper(
      engine,
      data.key,
      data.type,
      data.icon,
      data.description,
      data.uniqueClassList,
      data.disabled,
      data.hidden,
      data.maximum,
      data.value,
    )
  }
}
