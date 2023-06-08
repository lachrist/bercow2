/**
 * @template X
 * @param {X} x
 * @returns {X}
 */
export const identity = (x) => x;

/**
 * @template X
 * @param {X} x
 * @returns {() => X}
 */
export const constant = (x) => () => x;

/**
 * @template X, Y, Z
 * @param {(y: Y) => Z} g
 * @param {(x: X) => Y} f
 * @returns {(x: X) => Z}
 */
export const compose = (g, f) => (x) => g(f(x));
