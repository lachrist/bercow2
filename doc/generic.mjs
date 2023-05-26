// https://stackoverflow.com/questions/76330946/why-ts-complains-when-composing-generic-functions-with-type-and-not-param-and

/**
 * @template X
 * @type {function(X): X}
 */
const identity1 = (x) => x;

identity1(123);
identity1("123");

/**
 * @template X
 * @type {function(X): X}
 */
const identity2 = (x) => identity1(/** @type {X} */(x));

// Type 'X' is not assignable to type 'X'. Two different types with this name exist, but they are unrelated.
//   'X' could be instantiated with an arbitrary type which could be unrelated to 'X'.ts(2719)
// graph.mjs(4, 14): This type parameter might need an `extends X` constraint.
// const identity1: (arg0: X) => X
// @template X
// @type — {function(X): X}

/**
 * @template X
 * @param {X}
 * @returns {X}
 */
const identity3 = (x) => x;

/**
 * @template X
 * @type {function(X): X}
 */
const identity4 = (x) => identity3(x);
