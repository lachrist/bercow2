/**
 * Promise.resolve requires this context
 *
 * @template X
 * @param {X} value
 * @returns {Promise<X>}
 */
export const resolvePromise = (value) => Promise.resolve(value);

/**
 * Promise.all requires this context
 *
 * @template X
 * @param {Promise<X>[]} promises
 * @returns {Promise<X[]>}
 */
export const allPromise = (promises) => Promise.all(promises);
