/**
 * @template A, B
 * @param {A} fst
 * @param {B} snd
 * @returns {Pair<A, B>}
 */
export const pair = (fst, snd) => [fst, snd];

/**
 * @template A, B
 * @param {Pair<A, B>} pair
 * @returns {Pair<B, A>}
 */
export const flip = ([fst, snd]) => [snd, fst];

/**
 * @template A, B
 * @param {Pair<A, B>} pair
 * @returns {A}
 */
export const getFirst = ([fst, _snd]) => fst;

/**
 * @template A, B
 * @param {Pair<A, B>} pair
 * @returns {B}
 */
export const getSecond = ([_fst, snd]) => snd;

/**
 * @template A, B, C
 * @param {(first: A) => C} transform
 * @param {Pair<A, B>} pair
 * @returns {Pair<C, B>}
 */
export const mapFirst = (transform, [fst, snd]) => [transform(fst), snd];

/**
 * @template A, B, C
 * @param {(second: B) => C} transform
 * @param {Pair<A, B>} pair
 * @returns {Pair<A, C>}
 */
export const mapSecond = (transform, [fst, snd]) => [fst, transform(snd)];

/**
 * @template A, B, C
 * @param {(first: A) => C} fct
 * @param {Pair<A, B>} pair
 * @returns {C}
 */
export const applyFirst = (fct, [fst, _snd]) => fct(fst);

/**
 * @template A, B, C
 * @param {(second: B) => C} fct
 * @param {Pair<A, B>} pair
 * @returns {C}
 */
export const applySecond = (fct, [_first, second]) => fct(second);

/**
 * @template A, B, C
 * @param {Pair<A, B>} pair
 * @param {C} first
 * @returns {Pair<C, B>}
 */
export const setFirst = ([_first, second], first) => [first, second];

/**
 * @template A, B, C
 * @param {Pair<A, B>} pair
 * @param {C} second
 * @returns {Pair<A, C>}
 */
export const setSecond = ([first, _second], second) => [first, second];

/**
 * @template A
 * @param {A} both
 * @returns {Pair<A, A>}
 */
export const duplicate = (both) => [both, both];

/** @type {(pair: Pair<unknown, unknown>) => boolean} */
export const isPairIdentity = ([fst, snd]) => fst === snd;

/** @type {(pair: Pair<unknown, unknown>) => boolean} */
export const isNotPairIdentify = ([fst, snd]) => fst !== snd;
