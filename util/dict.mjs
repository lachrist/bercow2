import { cons, filter, find, nil, some } from "./list.mjs";
import { mapMaybe } from "../maybe.mjs";
import { getFirst, getSecond, pairup } from "../lib/pair.mjs";

/**
 * @template K, V
 * @type {Dict<K, V>}
*/
export const empty = nil;

/**
 * @template K, V
 * @param {K} k
 * @param {V} v
 * @param {Dict<K, V>} ps
 * @return {Dict<K, V>}
 */
export const insert = (k, v, ps) => cons(pairup(k, v), ps);

/**
 * @template K, V
 * @param {K} k
 * @param {Dict<K, V>} ps
 * @return {Maybe<V>}
 */
export const lookup = (k, ps) => mapMaybe(getSecond, find((p) => getFirst(p) === k, ps));

/**
 * @template K, V
 * @param {K} k
 * @param {Dict<K, V>} ps
 * @return {boolean}
 */
export const member = (k, ps) => some((p) => getFirst(p) === k, ps);

/**
 * @template K, V
 * @param {K} k
 * @param {Dict<K, V>} ps
 * @return {Dict<K, V>}
 */
export const remove = (k, ps) => filter((p) => getFirst(p) !== k, ps);
