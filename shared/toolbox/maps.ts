/**
 * Utility class for maps.
 */
export default class MapToolbox {
  /**
   * Maps a Map object to an array.
   * @param mapToMap the map to map to an array.
   * @param callback the callback to call on each value in the map.
   * @returns the mapped array.
   */
  public static mapToArray<K, V, O>(
    mapToMap: Map<K, V>,
    callback: (value: V, key: K, map: Map<K, V>) => O,
  ): Array<O> {
    let array: Array<O> = []
    mapToMap.forEach((value: V, key: K) => {
      array.push(callback(value, key, mapToMap))
    })
    return array
  }
}
