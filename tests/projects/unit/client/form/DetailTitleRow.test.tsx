import DetailTitleRow from '@client/components/content/form/DetailTitleRow'
import { describe, expect, test } from '@jest/globals'
import { render } from '@testing-library/react'

describe('DetailTitleRow', () => {
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
  })
})
