import { useDetailClassNames } from '@client/components/content/form/useDetailClassNames'
import { describe, expect, test } from '@jest/globals'

describe('useDetailClassNames', () => {
  /* -- ROOT CLASS NAMES -- */

  describe('Root class names', () => {
    test('Always includes "Detail" and the component name', () => {
      let { rootClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(rootClasses.value).toContain('Detail')
      expect(rootClasses.value).toContain('DetailString')
    })

    test('Adds "Disabled" when disabled is true', () => {
      let { rootClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: true,
        displayError: false,
        errorType: 'default',
      })
      expect(rootClasses.value).toContain('Disabled')
    })

    test('Does not add "Disabled" when disabled is false', () => {
      let { rootClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(rootClasses.value).not.toContain('Disabled')
    })

    test('Includes uniqueClassName when provided', () => {
      let { rootClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
        uniqueClassName: 'MyCustomClass',
      })
      expect(rootClasses.value).toContain('MyCustomClass')
    })
  })

  /* -- LABEL CLASS NAMES -- */

  describe('Label class names', () => {
    test('Adds "Error" when displayError is true and errorType is "default"', () => {
      let { labelClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'default',
      })
      expect(labelClasses.value).toContain('Error')
      expect(labelClasses.value).not.toContain('Warning')
    })

    test('Adds "Warning" and not "Error" when displayError is true and errorType is "warning"', () => {
      let { labelClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'warning',
      })
      expect(labelClasses.value).toContain('Warning')
      expect(labelClasses.value).not.toContain('Error')
    })

    test('Adds neither "Error" nor "Warning" when displayError is false', () => {
      let { labelClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(labelClasses.value).not.toContain('Error')
      expect(labelClasses.value).not.toContain('Warning')
    })

    test('Includes uniqueLabelClassName when provided', () => {
      let { labelClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
        uniqueLabelClassName: 'CustomLabel',
      })
      expect(labelClasses.value).toContain('CustomLabel')
    })
  })

  /* -- FIELD CLASS NAMES -- */

  describe('Field class names', () => {
    test('Adds "Error" when displayError is true and errorType is "default"', () => {
      let { fieldClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'default',
      })
      expect(fieldClasses.value).toContain('Error')
      expect(fieldClasses.value).not.toContain('Warning')
    })

    test('Adds "Warning" and not "Error" when displayError is true and errorType is "warning"', () => {
      let { fieldClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'warning',
      })
      expect(fieldClasses.value).toContain('Warning')
      expect(fieldClasses.value).not.toContain('Error')
    })

    test('Adds neither "Error" nor "Warning" when displayError is false', () => {
      let { fieldClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(fieldClasses.value).not.toContain('Error')
      expect(fieldClasses.value).not.toContain('Warning')
    })

    test('Includes uniqueFieldClassName when provided', () => {
      let { fieldClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
        uniqueFieldClassName: 'CustomField',
      })
      expect(fieldClasses.value).toContain('CustomField')
    })

    test('Always starts with "Field"', () => {
      let { fieldClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(fieldClasses.value).toContain('Field')
    })
  })

  /* -- FIELD ERROR CLASS NAMES -- */

  describe('Field error class names', () => {
    test('Has "Hidden" when displayError is false', () => {
      let { fieldErrorClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(fieldErrorClasses.value).toContain('Hidden')
    })

    test('Does not have "Hidden" when displayError is true', () => {
      let { fieldErrorClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'default',
      })
      expect(fieldErrorClasses.value).not.toContain('Hidden')
    })

    test('Has "Warning" when errorType is "warning" and error is displayed', () => {
      let { fieldErrorClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'warning',
      })
      expect(fieldErrorClasses.value).toContain('Warning')
    })

    test('Does not have "Warning" when errorType is "default"', () => {
      let { fieldErrorClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: true,
        errorType: 'default',
      })
      expect(fieldErrorClasses.value).not.toContain('Warning')
    })

    test('Always starts with "FieldErrorMessage"', () => {
      let { fieldErrorClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      expect(fieldErrorClasses.value).toContain('FieldErrorMessage')
    })
  })

  /* -- RETURN VALUE INDEPENDENCE -- */

  describe('Returned ClassList objects are independent', () => {
    test('Mutating rootClasses does not affect labelClasses', () => {
      let { rootClasses, labelClasses } = useDetailClassNames({
        componentName: 'DetailString',
        disabled: false,
        displayError: false,
        errorType: 'default',
      })
      rootClasses.add('SomeExtraClass')
      expect(labelClasses.value).not.toContain('SomeExtraClass')
    })
  })
})
