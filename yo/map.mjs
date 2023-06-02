
/**
 * @template K, V
 * @param {Map<K, V>} map
 * @returns {Map<V, K[]>}
 */
export const transposeMap = (map) => {
  const trans = new Map();
  for (const [key, val] of map) {
    const keys = trans.get(val);
    if (keys === undefined) {
      trans.set(val, [key]);
    } else {
      keys.push(key);
    }
  }
  for (const [val, keys] of trans) {
    trans.set(val, [...new Set(keys)]);
  }
  return trans;
};

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
 * @template K, V
 * @param {Map<K, V>} map
 * @param {K} key
 * @returns {V} Val
 */
export const getMapStrict = (map, key) => {
  const val = map.get(key);
  if (val === undefined) {
    throw new Error("missing graph node");
  } else {
    return val;
  }
};
