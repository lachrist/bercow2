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
