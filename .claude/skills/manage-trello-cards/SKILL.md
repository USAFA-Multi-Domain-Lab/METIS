---
name: manage-trello-cards
description: Create and update Trello cards to the user's conventions — titles, descriptions, checklists, lists, and labels. Use when the user asks to add a card, file an issue, or change an existing card on their Trello board.
---

# Manage Trello Cards

The user's conventions for writing and filing Trello cards. Follow them exactly. Ask when a case is not covered here.

## Titles and Descriptions

Every card has a title and a description.

Titles are title case and read like the title of a book or an article — concise and clear about the card's main idea.

Descriptions open with a paragraph of no more than 60 words giving the problem and the solution or direction to go. Anything further — paragraphs, lists, links — follows it only when it adds context or clarity. The limit governs the leading paragraphs you write; never shorten an existing one to meet it. If a user expands the leading paragraph, respect their decision.

## Checklists

A card may have no checklist. When it has work items, they go in one checklist under Trello's default name, "Checklist", in the order the work is done. Any other checklist is named for what it collects, such as "Documentation" or "Follow-Up Decisions", and exists only when the card needs it.

Before adding a checklist or an item, list the card's checklists with `trelloReadChecklist` (`list_by_card`), and add to the one of that name if it exists. A card read can report no checklists when there are some.

Write each item as a single imperative sentence ending in a period, such as "Add a skill for resolving the findings with the author." A second sentence is fine when one cannot carry the item. An item recording an open decision is phrased as a question. The format governs the items you write; leave items the user wrote in another form as they are.

Check an item off only once its work is done, and leave it unchecked while the user is still reviewing it.

## Completion

When a card in progress is complete and committed, it can be moved to the Review/Testing column. Mark it as complete and set its due date to the day it reached this column, overwriting any due date already on the card. Check off any relevant checklists as complete. A documentation checklist does not need to be completed at this stage. If any relevant item is unchecked and not addressed, mention it before moving the card to Review/Testing.

## Workflow

The METIS Development Board is organized into the following columns:

- Backlog: Tasks that have been confirmed as desired implementations, but have not yet been started.
- Planned: Tasks that have been slotted for a specific release.
- In-Progress: Tasks that are currently being worked on.
- Review/Testing: Tasks that have been completed and are undergoing review and testing.
- Document: Tasks that may require the documentation under the `/docs` folder to be updated.
- Production-Ready: Tasks that have been implemented, reviewed, tested, documented, and are ready for production, but have not yet been released.
- Production: Tasks that have been released to production.

### Things to Keep in Mind

- Every column from Planned onward has cards organized under their semantic version (vX.Y.Z). The version is marked with a card with a light-green background with the version as the title. You will be able to find plenty of cards on this board as a reference.
- A card's version usually comes from the version in `package.json`, which is updated during work on a release but is sometimes left behind. Confirm it against Git, the changelog, and other context. If not obvious, ask.
- In the Production column, the newest version is at the top. Within a version, the newest card comes first, so a card moved to Production goes at the top of its version.
