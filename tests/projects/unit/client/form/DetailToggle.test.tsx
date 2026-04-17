import { DetailToggle } from '@client/components/content/form/DetailToggle'
import { describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react'

describe('DetailToggle', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Root has "Detail" and "DetailToggle" classes', () => {
      let { container } = render(
        <DetailToggle label='Test Label' value={false} setValue={() => {}} />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Detail')
      expect(root).toHaveClass('DetailToggle')
    })

    test('Root has "Disabled" class when disabled', () => {
      let { container } = render(
        <DetailToggle
          label='Test Label'
          value={false}
          setValue={() => {}}
          disabled
        />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).toHaveClass('Disabled')
    })

    test('Root does not have "Disabled" class when not disabled', () => {
      let { container } = render(
        <DetailToggle label='Test Label' value={false} setValue={() => {}} />,
      )
      let root = container.firstChild as HTMLElement
      expect(root).not.toHaveClass('Disabled')
    })
  })

  /* -- TOGGLE INTERACTION -- */

  describe('Toggle interaction', () => {
    test('Clicking the toggle calls setValue with the inverted boolean (true → false)', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailToggle label='Test Label' value={true} setValue={setValue} />,
      )
      let toggle = container.querySelector('.Toggle') as HTMLElement
      fireEvent.click(toggle)
      expect(setValue).toHaveBeenCalledWith(false)
    })

    test('Clicking the toggle calls setValue with the inverted boolean (false → true)', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailToggle label='Test Label' value={false} setValue={setValue} />,
      )
      let toggle = container.querySelector('.Toggle') as HTMLElement
      fireEvent.click(toggle)
      expect(setValue).toHaveBeenCalledWith(true)
    })

    test('Clicking the toggle when disabled does not call setValue', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailToggle
          label='Test Label'
          value={false}
          setValue={setValue}
          disabled
        />,
      )
      let toggle = container.querySelector('.Toggle') as HTMLElement
      fireEvent.click(toggle)
      expect(setValue).not.toHaveBeenCalled()
    })
  })

  /* -- LOCK STATE -- */

  describe('Lock state behavior', () => {
    test('lockState "locked-activation" always calls setValue with true', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailToggle
          label='Test Label'
          value={false}
          setValue={setValue}
          lockState='locked-activation'
        />,
      )
      let toggle = container.querySelector('.Toggle') as HTMLElement
      fireEvent.click(toggle)
      expect(setValue).toHaveBeenCalledWith(true)
    })

    test('lockState "locked-deactivation" always calls setValue with false', () => {
      let setValue = jest.fn()
      let { container } = render(
        <DetailToggle
          label='Test Label'
          value={true}
          setValue={setValue}
          lockState='locked-deactivation'
        />,
      )
      let toggle = container.querySelector('.Toggle') as HTMLElement
      fireEvent.click(toggle)
      expect(setValue).toHaveBeenCalledWith(false)
    })
  })
})
