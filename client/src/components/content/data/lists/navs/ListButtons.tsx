import ButtonSvgPanel from 'metis/client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from 'metis/client/components/content/user-controls/buttons/panels/hooks'
import { useEffect } from 'react'
import { MetisComponent } from '../../../../../../../shared'
import { useListContext } from '../List'
import './ListButtons.scss'

/**
 * Provides buttons to the `List` component
 * so that the user can perform operations
 * on the list.
 */
export default function ListButtons<
  TItem extends MetisComponent,
>(): TReactElement | null {
  /* -- STATE -- */

  const listContext = useListContext<TItem>()
  const {
    elements,
    state,
    itemButtonIcons,
    aggregatedButtonIcons,
    aggregatedButtons,
    aggregateButtonLayout,
    getItemButtonDisabled,
  } = listContext
  const [selection] = state.selection
  const [buttonOverflowCount] = state.buttonOverflowCount
  const buttonEngine = useButtonSvgEngine({
    elements: aggregatedButtons,
    options: {
      layout: aggregateButtonLayout,
    },
    dependencies: [...aggregatedButtonIcons],
  })

  /* -- EFFECTS -- */

  useEffect(() => {
    // Enable/disable any buttons when the
    // selection changes.
    itemButtonIcons.forEach((icon) =>
      buttonEngine.setDisabled(
        icon,
        !selection || getItemButtonDisabled(icon, selection),
      ),
    )
  }, [selection])

  useEffect(() => {
    let threshold = aggregatedButtonIcons.length - buttonOverflowCount
    aggregatedButtonIcons.forEach((icon, index) => {
      buttonEngine.modifyClassList(icon, (classList) => {
        classList.set('ListButtonOverflow', index >= threshold)
      })
    })
  }, [buttonOverflowCount])

  /* -- RENDER -- */

  // Render the buttons.
  return (
    <div className='ListButtons' ref={elements.buttons}>
      <ButtonSvgPanel engine={buttonEngine} />
    </div>
  )
}
