
/**
 * @template K, V
 * @param {Map<K, V>} map
 * @param {K} key
 * @param {V} val
 * @return {Map<K, V>}
 */
export const insert = (map, key, val) => {
  const copy = new Map(map);
  copy.set(key, val);
  return copy;
};

/**
 * @template K, V
 * @param {Map<K, V>} map
 * @param {[K, V][]} entries
 * @return {Map<K, V>}
 */
export const insertAll = (map, entries) => {
  const copy = new Map(map);
  for (const [key, val] of entries) {
    copy.set(key, val);
  }
  return copy;
};

/**
 * @template K, V
 * @param {Map<K, V>} map
 * @param {K} key
 * @return {Map<K, V>}
 */
export const drop = (map, key) => {
  const copy = new Map(map);
  copy.delete(key);
  return copy;
};

/**
 * @template K, V
 * @param {Map<K, V>} map
 * @param {Set<K>} keys
 * @return {Map<K, V>}
 */
export const dropAll = (map, keys) => {
  const copy = new Map(map);
  for (const key of keys) {
    copy.delete(key);
  }
  return copy;
};
