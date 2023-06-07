
/**
 * @template K, V
 * @param {{map: Map<K, V>, key: K}} input
 * @param {() => V} makeVal
 * @returns {{map: Map<K, V>, val: V}}
 */
export const memoize = ({map, key}, makeVal) => {
  if (map.has(key)) {
    return {
      map,
      val: map.get(key),
    };
  } else {
    const val = makeVal();
    return {
      map: new Map([...map, [key, val]]),
      val: map.get(key),
    };
  }
};
