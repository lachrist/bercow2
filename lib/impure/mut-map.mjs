import { makeJust, nothing } from "../util/maybe.mjs";

/**
 * @template K, V
 * @param {Map<K, V>} map
 * @returns {MutMap<K, V>}
 */
export const createMutMap = (map) => ({ map: new Map(map) });

/**
 * @template K, V
 * @param {MutMap<K, V>} mutmap
 * @param {K} key
 * @returns {Promise<boolean>}
 */
export const hasMutMap = async ({ map }, key) => map.has(key);

/**
 * @template K, V
 * @param {MutMap<K, V>} mutmap
 * @param {K} key
 * @returns {Promise<Maybe<V>>}
 */
export const getMutMap = async ({ map }, key) =>
  map.has(key) ? makeJust(/** @type {V} */ (map.get(key))) : nothing;

/**
 * @template K, V
 * @param {MutMap<K, V>} mutmap
 * @param {K} key
 * @param {V} val
 * @returns {Promise<void>}
 */
export const setMutMap = async ({ map }, key, val) => {
  map.set(key, val);
};

/**
 * @template K, V
 * @param {MutMap<K, V>} mutmap
 * @param {K} key
 * @param {() => V} makeVal
 * @returns {Promise<V>}
 */
export const cacheMutMap = async ({ map }, key, makeVal) => {
  if (map.has(key)) {
    return /** @type {V} */ (map.get(key));
  } else {
    const val = makeVal();
    map.set(key, val);
    return val;
  }
};

/**
 * @template K, V
 * @param {MutMap<K, V>} mutmap
 * @returns {Promise<Map<K, V>>}
 */
export const snapshotMutMap = async ({ map }) => new Map(map);
