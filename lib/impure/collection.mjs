/**
 * Faster than `new Map([...map, [key, val]])`
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @param {K} key
 * @param {V} val
 * @returns {Map<K, V>}
 */
export const insertMap = (map, key, val) => {
  const copy = new Map(map);
  copy.set(key, val);
  return copy;
};

/**
 * Faster than `new Set([...set, val])`
 *
 * @template V
 * @param {Set<V>} set
 * @param {V} val
 * @returns {Set<V>}
 */
export const addSet = (set, val) => {
  const copy = new Set(set);
  copy.add(val);
  return copy;
};
