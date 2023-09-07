export interface AnyObject {
  [key: string]: any
}

export interface SingleTypeObject<TValue> {
  [key: string]: TValue
}

export default {}
