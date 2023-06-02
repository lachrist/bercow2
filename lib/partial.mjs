/**
 * @template X1, X2, Y
 * @param {(x1: X1, x2: X2) => Y} f
 * @param {X1} x1
 * @returns {(x2: X2) => Y}
 */
export const partialX_ = (f, x1) => (x2) => f(x1, x2);

/**
 * @template X1, X2, Y
 * @param {(x1: X1, x2: X2) => Y} f
 * @param {X2} x2
 * @returns {(x1: X1) => Y}
 */
export const partial_X = (f, x2) => (x1) => f(x1, x2);

/**
 * @template X1, X2, X3, Y
 * @param {(x1: X1, x2: X2, x3: X3) => Y} f
 * @param {X1} x1
 * @param {X2} x2
 * @returns {(x3: X3) => Y}
 */
export const partialXX_ = (f, x1, x2) => (x3) => f(x1, x2, x3);
