// This checks two lists to see if
// they contain idential values.
export function areIdentical(list1: any[], list2: any[]): boolean {
  if (list1.length !== list2.length) {
    return false
  }

  for (let i = 0; i < list1.length; i++) {
    if (list1[i] !== list2[i]) {
      return false
    }
  }

  return true
}

export function toLiterals<T extends string>(arr: T[]): T[] {
  return arr
}

export default {
  areIdentical,
  toLiterals,
}
