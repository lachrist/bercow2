
/**
 * @template A, B
 * @param {A} first
 * @param {B} second
 * @return {Pair<A, B>}
 */
export const pair = (first, second) => [first, second];

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @return {Pair<B,A>}
 */
export const flip = ([first, second]) => [second, first];

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @return {A}
 */
export const fst = ([first, _second]) => first;

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @return {B}
 */
export const snd = ([_first, second]) => second;

// /**
//  * @template A, B, C
//  * @param {Pair<A,B>} pair
//  * @param {C} first
//  * @return {Pair<C, B>}
//  */
// export const setFirst = ([_first, second], first) => [first, second];

// /**
//  * @template A, B, C
//  * @param {Pair<A,B>} pair
//  * @param {C} second
//  * @return {Pair<A, C>}
//  */
// export const setSecond = ([first, _second], second) => [first, second];
