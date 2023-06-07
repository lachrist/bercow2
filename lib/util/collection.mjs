/**
 * @template X
 * @param {[X, ...X[]]} array
 * @returns {X}
 */
export const getHead = (array) => array[0];

/**
 * @template X
 * @param {Iterable<X>} iterable
 * @returns {X[]}
 */
export const toArray = (iterable) =>
  Array.isArray(iterable) ? iterable : [...iterable];

/**
 * @template K, V
 * @param {Iterable<[K, V]>} entries
 * @returns {Map<K, V>}
 */
export const toMap = (entries) =>
  entries instanceof Map ? entries : new Map(entries);

/**
 * @template X
 * @param {Iterable<X>} iterable
 * @returns {Set<X>}
 */
export const toSet = (iterable) =>
  iterable instanceof Set ? iterable : new Set(iterable);

/**
 * @template X
 * @param {Set<X>[]} sets\
 * @returns {Set<X>}
 */
export const unionSet = (sets) => new Set(sets.map(toArray).flat());
