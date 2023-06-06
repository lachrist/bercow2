
/**
 * @template X
 * @param {Iterable<X>} xs
 * @returns {X[]}
 */
export const toArray = (xs) => Array.isArray(xs) ? xs : [...xs];

/**
 * @template X
 * @param {Iterable<X>} xs
 * @returns {Set<X>}
 */
export const toSet = (xs) => xs instanceof Set ? xs : new Set(xs);
