/**
 * @template A, B
 * @param {A} fst
 * @param {B} snd
 * @returns {Pair<A, B>}
 */
export const pairup = (fst, snd) => [fst, snd];

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
 * @param {Pair<A, B>} pair
 * @param {(first: A) => C} transform
 * @returns {Pair<C, B>}
 */
export const mapFirst = ([fst, snd], transform) => [transform(fst), snd];

/**
 * @template A, B, C
 * @param {Pair<A, B>} pair
 * @param {(second: B) => C} transform
 * @returns {Pair<A, C>}
 */
export const mapSecond = ([fst, snd], transform) => [fst, transform(snd)];

/**
 * @template A, B
 * @param {Pair<A, B>} pair
 * @returns {Pair<B, A>}
 */
export const flip = ([fst, snd]) => [snd, fst];

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
export const applySecond = (fct, [_fst, snd]) => fct(snd);

/**
 * @template A, B, C
 * @param {Pair<A, B>} pair
 * @param {C} fst
 * @returns {Pair<C, B>}
 */
export const setFirst = ([_fst, snd], fst) => [fst, snd];

/**
 * @template A, B, C
 * @param {Pair<A, B>} pair
 * @param {C} snd
 * @returns {Pair<A, C>}
 */
export const setSecond = ([fst, _snd], snd) => [fst, snd];

/**
 * @template A
 * @param {A} both
 * @returns {Pair<A, A>}
 */
export const duplicate = (both) => [both, both];

/**
 * @template A, B
 * @param {Pair<Promise<A>, B>} pair
 * @returns {Promise<Pair<A, B>>}
 */
export const promiseFirst = async ([fst, snd]) => [await fst, snd];

/**
 * @template A, B
 * @param {Pair<A, Promise<B>>} pair
 * @returns {Promise<Pair<A, B>>}
 */
export const promiseSecond = async ([fst, snd]) => [fst, await snd];
