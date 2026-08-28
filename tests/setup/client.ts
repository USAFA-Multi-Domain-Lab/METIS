import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'node:util'

// isomorphic-dompurify loads jsdom, which reaches for the text encoders while
// it loads. Jest's jsdom environment leaves both undefined, so anything
// reaching the sanitizer fails to import without them.
Object.assign(globalThis, { TextDecoder, TextEncoder })
