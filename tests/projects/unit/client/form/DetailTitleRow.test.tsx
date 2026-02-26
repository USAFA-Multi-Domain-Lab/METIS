import DetailTitleRow from '@client/components/content/form/DetailTitleRow'
import { describe, expect, test } from '@jest/globals'
import { render } from '@testing-library/react'

describe('DetailTitleRow', () => {
  /* -- OPTIONAL INDICATOR -- */

  describe('Optional indicator', () => {
    test('Optional indicator is hidden when fieldType is "required"', () => {
      let { container } = render(
        <DetailTitleRow
          label='Test Label'
          labelClassName='Label'
          tooltipDescription=''
          fieldType='required'
        />,
      )
      let titleColumnTwo = container.querySelector(
        '.TitleColumnTwo',
      ) as HTMLElement
      expect(titleColumnTwo).toHaveClass('Hidden')
      expect(titleColumnTwo).not.toHaveClass('Optional')
    })

    test('Optional indicator is visible when fieldType is "optional"', () => {
      let { container } = render(
        <DetailTitleRow
          label='Test Label'
          labelClassName='Label'
          tooltipDescription=''
          fieldType='optional'
        />,
      )
      let titleColumnTwo = container.querySelector(
        '.TitleColumnTwo',
      ) as HTMLElement
      expect(titleColumnTwo).toHaveClass('Optional')
      expect(titleColumnTwo).not.toHaveClass('Hidden')
    })
  })

  /* -- TOOLTIP INFO ICON -- */

  describe('Tooltip info icon', () => {
    test('Info icon is hidden when tooltipDescription is empty', () => {
      let { container } = render(
        <DetailTitleRow
          label='Test Label'
          labelClassName='Label'
          tooltipDescription=''
          fieldType='required'
        />,
      )
      let infoIcon = container.querySelector('sup') as HTMLElement
      expect(infoIcon).toHaveClass('Hidden')
    })

    test('Info icon is visible when tooltipDescription is provided', () => {
      let { container } = render(
        <DetailTitleRow
          label='Test Label'
          labelClassName='Label'
          tooltipDescription='This is a description.'
          fieldType='required'
        />,
      )
      let infoIcon = container.querySelector('sup') as HTMLElement
      expect(infoIcon).toHaveClass('DetailInfo')
      expect(infoIcon).not.toHaveClass('Hidden')
    })
  })

  /* -- RIGHT CONTENT -- */

  describe('Right content', () => {
    test('Renders rightContent prop in TitleColumnTwo when provided', () => {
      let { getByText } = render(
        <DetailTitleRow
          label='Test Label'
          labelClassName='Label'
          tooltipDescription=''
          fieldType='required'
          rightContent={<span>Custom Content</span>}
        />,
      )
      expect(getByText('Custom Content')).toBeTruthy()
    })

    test('When rightContent is provided, TitleColumnTwo does not have Optional or Hidden class', () => {
      let { container } = render(
        <DetailTitleRow
          label='Test Label'
          labelClassName='Label'
          tooltipDescription=''
          fieldType='required'
          rightContent={<span>Custom Content</span>}
        />,
      )
      let titleColumnTwo = container.querySelector(
        '.TitleColumnTwo',
      ) as HTMLElement
      expect(titleColumnTwo).not.toHaveClass('Hidden')
      expect(titleColumnTwo).not.toHaveClass('Optional')
    })
  })

  /* -- LABEL -- */

  describe('Label', () => {
    test('Renders the label text', () => {
      let { getByText } = render(
        <DetailTitleRow
          label='My Label'
          labelClassName='Label'
          tooltipDescription=''
          fieldType='required'
        />,
      )
      expect(getByText('My Label')).toBeTruthy()
    })

    test('Applies the labelClassName to the label element', () => {
      let { container } = render(
        <DetailTitleRow
          label='My Label'
          labelClassName='Label Error'
          tooltipDescription=''
          fieldType='required'
        />,
      )
      let labelElement = container.querySelector('.Label') as HTMLElement
      expect(labelElement).toHaveClass('Error')
    })
  })
})
