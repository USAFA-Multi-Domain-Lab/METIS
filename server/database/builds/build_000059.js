// Build 59: Sanitize the HTML stored in every rich-text effect argument.
//
// An argument's value is stored without a type of its own, so rich text held
// by an argument was saved exactly as it arrived, while every other rich-text
// field on a mission was cleaned on the way in. This runs those stored values
// through the same sanitizer the mission model now applies on save.
//
// An argument is treated as holding rich text when either:
//   - it is recorded as "large-string", or
//   - it is the "message" argument of an "output" or "node-alert" effect.
//
// The second case carries most of the data. Build 58 could not tell a plain
// string argument apart from a dropdown value and recorded both as "unknown",
// so output and node-alert messages that predate it are still typed that way
// until the mission is next saved in the editor. Output messages in
// particular were moved out of the sanitized postExecutionSuccessText and
// postExecutionFailureText fields by build 49, which is where their
// sanitizing stopped. No other target environment defines a target with
// either of those ids, so matching on the id alone cannot reach anything
// else.
//
// Applies to session-triggered root effects and all execution-triggered
// action effects, in every mission including those marked deleted.

const DOMPurify = require('isomorphic-dompurify')

// The same allow-list as shared/toolbox/html/HtmlSanitizer.ts, so stored
// values are cleaned the way they are on save.
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'a',
    'br',
    'p',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'hr',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    's',
    'del',
    'strike',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'rel', 'target', 'class', 'style', 'start', 'type'],
}

// The same style properties HtmlSanitizer keeps. A property belongs here only
// when it can neither name a resource nor move an element.
const ALLOWED_STYLE_PROPERTIES = ['color', 'line-height', 'text-align']

// DOMPurify has no option for limiting a "style" attribute to particular
// properties, so this rewrites one to hold only the allowed properties once
// DOMPurify has cleaned the element. A build runs in its own process, so it
// registers this for itself.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (typeof node.getAttribute !== 'function' || !node.style) return
  if (!node.getAttribute('style')) return

  // Only the allowed values the CSS parser read are written back. A
  // declaration the parser could not read never appears among them, so it
  // cannot stay in the attribute.
  let allowedDeclarations = ALLOWED_STYLE_PROPERTIES.map((property) => [
    property,
    node.style.getPropertyValue(property),
  ])

  node.removeAttribute('style')

  for (let [property, value] of allowedDeclarations) {
    if (value) node.style.setProperty(property, value)
  }
})

// The target and parameter pairs whose argument holds rich text regardless of
// the type recorded on the argument itself.
const RICH_TEXT_PARAMETERS = [
  { targetId: 'output', parameterId: 'message' },
  { targetId: 'node-alert', parameterId: 'message' },
]

// Maximum number of changed values listed individually in the migration
// output. mongosh stdout is captured through a fixed buffer by the process
// that runs this build, so the detail list is capped while the summary count
// stays complete.
const CHANGED_DETAIL_LIMIT = 50

let inspectedValueCount = 0
let changedValueCount = 0
let changedDetails = []

// Returns true when the argument holds rich text and so needs sanitizing.
function holdsRichText(effect, argument) {
  if (argument.type === 'large-string') return true

  for (let parameter of RICH_TEXT_PARAMETERS) {
    if (
      effect.targetId === parameter.targetId &&
      argument.parameterId === parameter.parameterId
    ) {
      return true
    }
  }

  return false
}

// Records that a stored value carried markup the sanitizer removed. Only the
// identifiers are printed. The removed markup is left out because this output
// goes to the server log, and a report of what was stripped would put the
// markup right back into a file someone reads.
function recordChange(mission, effect, argument) {
  changedValueCount++

  if (changedDetails.length < CHANGED_DETAIL_LIMIT) {
    changedDetails.push(
      `  mission ${mission._id} / effect ${effect._id} (${effect.targetId}) / ` +
        `parameter "${argument.parameterId}"`,
    )
  }
}

// Sanitizes every rich-text argument on the effect. Returns true when a value
// was altered, so only missions that actually changed are written back.
function sanitizeEffectArguments(mission, effect) {
  let effectModified = false

  for (let argument of effect.arguments) {
    if (!holdsRichText(effect, argument)) continue

    // An optional message that was never filled in is stored with no value at
    // all. Handing that to the sanitizer would turn it into an empty string,
    // which is a different thing than never having been set.
    if (typeof argument.value !== 'string') continue

    inspectedValueCount++

    let sanitizedValue = DOMPurify.sanitize(argument.value, SANITIZE_OPTIONS)

    if (sanitizedValue !== argument.value) {
      recordChange(mission, effect, argument)
      argument.value = sanitizedValue
      effectModified = true
    }
  }

  return effectModified
}

let dbName = 'metis'

if (process.env.MONGO_DB) {
  dbName = process.env.MONGO_DB
}

use(dbName)

print('Sanitizing the HTML stored in rich-text effect arguments...')

let cursorMissions = db.missions.find({})

while (cursorMissions.hasNext()) {
  let mission = cursorMissions.next()
  let forces = mission.forces
  let effects = mission.effects ?? []
  let missionModified = false

  for (let effect of effects) {
    if (sanitizeEffectArguments(mission, effect)) {
      missionModified = true
    }
  }

  for (let force of forces) {
    for (let node of force.nodes) {
      for (let action of node.actions) {
        for (let effect of action.effects) {
          if (sanitizeEffectArguments(mission, effect)) {
            missionModified = true
          }
        }
      }
    }
  }

  if (missionModified) {
    db.missions.updateOne({ _id: mission._id }, { $set: { forces, effects } })
  }
}

print('Migration complete.')
print(`Inspected ${inspectedValueCount} rich-text argument value(s).`)

if (changedValueCount > 0) {
  print(
    `${changedValueCount} value(s) carried markup that is not allowed and ` +
      'have been rewritten. The arguments below changed:',
  )

  for (let detail of changedDetails) {
    print(detail)
  }

  let truncatedCount = changedValueCount - changedDetails.length

  if (truncatedCount > 0) {
    print(`  ...and ${truncatedCount} more (truncated).`)
  }
} else {
  print('No stored value needed changing.')
}

print('Updating schema build number...')

db.infos.updateOne({}, { $set: { schemaBuildNumber: 59 } })
