import Tooltip from 'metis/client/components/content/communication/Tooltip'
import { compute } from 'metis/client/toolbox'
import { ClassList } from 'metis/toolbox'
import { useEffect } from 'react'
import ButtonSvgEngine from '../engines'
import { TStepperSvg_PK } from '../types'
import './StepperSvg.scss'

/**
 * A component for displaying a stepper with SVG buttons
 * for stepping up and down, along with a text label.
 */
export default function ({
  variation,
  description,
  uniqueClassList,
  disabled,
  hidden,
  maximum,
  value,
}: TStepperSvg_PK): TReactElement | null {
  /* -- STATE -- */

  const [currentValue, setCurrentValue] = value

  /* -- COMPUTED -- */

  /**
   * The classes used for the root element.
   */
  const rootClasses = compute<ClassList>(() => {
    return new ClassList()
      .add('SvgPanelElement')
      .add('StepperSvg')
      .add(`StepperSvg_${variation}`)
      .set('Disabled', disabled)
      .import(uniqueClassList)
  })

  /**
   * Whether the stepper can go down.
   */
  const canStepDown = compute<boolean>(() => currentValue > 0)

  /**
   * Whether the stepper can go up.
   */
  const canStepUp = compute<boolean>(() => currentValue < maximum - 1)

  /**
   * The class name for the step down control.
   */
  const stepDownClasses = compute<ClassList>(() => {
    let results = new ClassList('StepDown')
    results.set('Disabled', !canStepDown)
    return results
  })

  /**
   * The class name for the step up control.
   */
  const stepUpClasses = compute<ClassList>(() => {
    let results = new ClassList('StepUp')
    results.set('Disabled', !canStepUp)
    return results
  })

  /**
   * The text to display for the current value.
   */
  const text = compute<string>(() => {
    switch (variation) {
      case 'page':
        return `${currentValue + 1}/${maximum}`
      case 'zoom':
        return `${currentValue + 1}%`
      default:
        return ''
    }
  })

  /**
   * The tooltip description for the step down control.
   */
  const stepDownTooltip = compute<string>(() => {
    switch (variation) {
      case 'page':
        return 'Previous page.'
      case 'zoom':
        return 'Zoom out.'
      default:
        return ''
    }
  })

  /**
   * The tooltip description for the step up control.
   */
  const stepUpTooltip = compute<string>(() => {
    switch (variation) {
      case 'page':
        return 'Next page.'
      case 'zoom':
        return 'Zoom in.'
      default:
        return ''
    }
  })

  /**
   * The classes for the stepper icon.
   */
  const stepperIconClasses = compute<ClassList>(() => {
    return new ClassList('Icon')
  })

  /**
   * The icon to display for stepping down.
   */
  const stepDownIcon = compute<string>(() => {
    switch (variation) {
      case 'page':
        return '<'
      case 'zoom':
        return '-'
      default:
        return ''
    }
  })

  /**
   * The icon to display for stepping up.
   */
  const stepUpIcon = compute<string>(() => {
    switch (variation) {
      case 'page':
        return '>'
      case 'zoom':
        return '+'
      default:
        return ''
    }
  })

  /* -- FUNCTIONS -- */

  /**
   * Decreases the current value by 1,
   * if it can step down.
   */
  const stepDown = () => {
    if (canStepDown) setCurrentValue(currentValue - 1)
  }

  /**
   * Increases the current value by 1,
   * if it can step up.
   */
  const stepUp = () => {
    if (canStepUp) setCurrentValue(currentValue + 1)
  }

  /* -- EFFECTS -- */

  // Ensure the current value is within bounds.
  useEffect(() => {
    // Update the current value to be within bounds.
    setCurrentValue(Math.max(Math.min(currentValue, maximum - 1), 0))
  }, [currentValue, maximum])

  /* -- RENDER -- */

  if (hidden) return null

  return (
    <div className={rootClasses.value}>
      {/* STEP DOWN CONTROL */}
      <div className={stepDownClasses.value} onClick={stepDown}>
        <span className={stepperIconClasses.value}>{stepDownIcon}</span>
        <Tooltip description={stepDownTooltip} />
      </div>

      {/* TEXT DISPLAY */}
      <div className='Text'>
        {text}
        <Tooltip description={description} />
      </div>

      {/* STEP UP CONTROL */}
      <div className={stepUpClasses.value} onClick={stepUp}>
        <span className={stepperIconClasses.value}>{stepUpIcon}</span>
        <Tooltip description={stepUpTooltip} />
      </div>
    </div>
  )
}

/**
 * Creates new default props for when a new stepper
 * is added to an engine.
 */
export function createStepperDefaults(): Required<
  Omit<TStepperSvg_PK, 'key' | 'type'>
> {
  return {
    ...ButtonSvgEngine.DEFAULT_ELEMENT_PROPS,
    variation: 'page',
    maximum: 1,
    value: [1, () => {}],
  }
}
