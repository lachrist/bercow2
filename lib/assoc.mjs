import { makeJust, nothing } from "./maybe.mjs";

/**
 * @template K, V
 * @param {Pair<K, V>[]} pairs
 * @param {K} target
 * @returns {Maybe<V>}
*/
export const lookup = (pairs, target) => {
  for (const [key, val] of pairs) {
    if (key === target) {
      return makeJust(val);
    }
  }
  return nothing;
};
