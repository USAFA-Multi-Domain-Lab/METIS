import ButtonSvgPanel from '@client/components/content/user-controls/buttons/panels/ButtonSvgPanel'
import { useButtonSvgEngine } from '@client/components/content/user-controls/buttons/panels/hooks'
import type { MetisComponent } from '@shared/MetisComponent'
import { useEffect } from 'react'
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
    items,
    elements,
    state,
    itemButtonIcons,
    aggregatedButtonIcons,
    aggregatedButtons,
    aggregateButtonLayout,
    getItemButtonDisabled,
    getItemButtonHidden,
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
    // Enable/disable any buttons when the selection or items change. A
    // button hidden for the selected item is disabled here, since the
    // top buttons are always visible (unlike the per-item options
    // menu). The selection reference can be a stale snapshot after an
    // items refresh, so resolve the live item by id to reflect remote
    // updates such as status changes.
    const selected = items.find(({ _id }) => _id === selection?._id) ?? null
    itemButtonIcons.forEach((icon) =>
      buttonEngine.setDisabled(
        icon,
        !selected ||
          getItemButtonDisabled(icon, selected) ||
          getItemButtonHidden(icon, selected),
      ),
    )
  }, [selection, items])

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
