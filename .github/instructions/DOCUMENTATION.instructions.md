---
applyTo: 'docs/**'
---

# METIS: Documentation Guide

> For a workspace-wide index of instruction files, see [AGENTS.md](../../AGENTS.md).

## Overview

The `docs/` folder is a wiki-style documentation system organized into sections. Each section has an `index.md` that serves as its navigation hub. When adding documentation, the goal is to place content in the right section, follow the established structure, and register the new page in the appropriate index files.

---

## 1. Directory Structure

```text
docs/
  index.md                        ← Root landing page (links to all sections)
  changelog.md                    ← Version history
  credits.md                      ← Acknowledgments
  api/
    index.md                      ← API section hub
    ...                           ← API reference pages
  devs/
    index.md                      ← Developer section hub
    ...                           ← Developer reference pages
  setup/
    index.md                      ← Setup section hub
    ...                           ← Setup and environment pages
  target-env-integration/
    index.md                      ← Integration section hub
    guides/
    references/
    examples/
```

### Choosing the Right Section

| Content type                                                 | Section                        |
| ------------------------------------------------------------ | ------------------------------ |
| REST API endpoints and request/response formats              | `docs/api/`                    |
| Internal architecture, developer workflows, server internals | `docs/devs/`                   |
| Installation and environment configuration                   | `docs/setup/`                  |
| Target-environment plugin development                        | `docs/target-env-integration/` |
| Release notes                                                | `docs/changelog.md`            |

---

## 2. File Naming

- Use **lowercase kebab-case** for all filenames: `my-new-page.md`
- Name the file after the topic it covers, not the section it lives in (e.g., `database-backups.md` should be `backups.md`)

---

## 3. Document Structure

Every content page follows this structure:

```markdown
# Page Title

Brief intro paragraph (1–4 sentences). No subheading above it — this sits directly under the title.

## Section Name

...

### Subsection Name

...
```

### Rules

- **`#` H1** — one per file, matches the filename topic
- **`##` H2** — major sections within the page
- **`###` H3** — subsections within an H2
- **No H4 or deeper** — restructure instead
- **Intro paragraph** — always present, no subheading, gives context in 1–4 sentences
- **Code blocks** — always include the language identifier (` ```bash `, ` ```typescript `, etc.)
- **Notes and warnings** — use the `> **Note:**` blockquote pattern
- **Tables** — use for structured comparisons or reference data
- **Placeholders in examples** — use `<angle-bracket-kebab-case>` (e.g., `<database-name>`)

### Table of Contents

Include a `## Table of Contents` section when a content page has **3 or more `##` H2 sections**. This applies to guides, references, and API docs — pages that readers look things up in. It does not apply to index files (which are already navigation hubs), example walkthroughs meant to be read top-to-bottom, or short pages with fewer than 3 H2 sections.

**Placement:** Immediately after the intro paragraph, before the first `##` section.

**Format:** List each H2 as a top-level item. If an H2 has H3 subsections, list them as indented sub-items (2 spaces). Use standard Markdown anchor links: lowercase, spaces replaced with hyphens, punctuation removed.

```markdown
## Table of Contents

- [Section One](#section-one)
- [Section Two](#section-two)
  - [Subsection A](#subsection-a)
  - [Subsection B](#subsection-b)
- [Section Three](#section-three)
```

**Do not** add a colon after "Table of Contents" — use `## Table of Contents`, not `## Table of Contents:`.

### Emoji in Headers

Emoji are used selectively:

- **Index/hub files** — emoji are appropriate in section headers (e.g., `## 🚀 Quick Start`)
- **Content pages** — plain headers only; no emoji

---

## 4. Internal Linking

Always use **relative paths** for links between docs files. Never use absolute paths or `file://` URIs.

```markdown
<!-- Correct: relative paths -->

[Other Section](../other-section/page.md)
[Same-folder page](page.md)

<!-- Incorrect: root-relative paths -->

[Other Section](/docs/other-section/page.md)
```

Exception: links from non-docs files (such as `.github/` instruction files) may use root-relative paths like `/docs/section/page.md`.

---

## 5. Index Files

Each section's `index.md` is a **navigation hub**, not a content page. Its job is to link to everything in the section.

### Structure of an Index File

```markdown
# Section Name

Brief description of what this section covers.

## Quick Start / Overview links

...

## 📚 Learning Paths or Sections

### Category Name

- **[Page Title](page.md)** - One sentence description
- **[Page Title](page.md)** - One sentence description

## Related Documentation

- **[Other Section](../other/index.md)** - Cross-section links
```

### When to Add a New Link

When you create a new content page:

1. **Always** add it to the section's `index.md` under the most relevant heading.
2. **Add it to `docs/index.md`** if it is significant enough to surface at the top level (i.e., something a new developer or user would commonly need).
3. **Add it to the relevant section's "Related Documentation"** if it cross-references another section.

---

## 6. Checklist for Adding a New Page

- [ ] Place the file in the correct section folder with a lowercase kebab-case name.
- [ ] Start with an `#` H1 title.
- [ ] Write a brief intro paragraph immediately after the title (no subheading).
- [ ] If the page has 3 or more `##` H2 sections, add a `## Table of Contents` immediately after the intro paragraph.
- [ ] Use `##` / `###` for sections and subsections — no deeper.
- [ ] Include a language identifier on all code blocks.
- [ ] Use relative paths for all internal links.
- [ ] Add the page to the section's `index.md`.
- [ ] If the page is broadly relevant, add it to `docs/index.md` as well.
