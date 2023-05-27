
/////////
// set //
/////////

/**
 * @template A
 * @param {Set<A>} set1
 * @param {Set<A>} set2
 * @return {Set<A>}
 */
export const intersect = (set1, set2) => new Set([...set1].filter((element) => set2.has(element)));

////////////
// number //
////////////

/**
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
export const cantorPairing = (x, y) => 1/2 * (x + y) * (x + y + 1) + y;

///////////
// maybe //
///////////

/**
 * @template A
 * @typedef {A | null} Maybe<A>
 */

/**
 * @template A
 * @param {Maybe<A>} maybe
 * @return {boolean}
 */
export const isJust = (maybe) => maybe !== null;

/**
 * @template A
 * @param {Maybe<A>} maybe
 * @return {boolean}
 */
export const isNothing = (maybe) => maybe === null;

/**
 * @template A
 * @param {Maybe<A>[]} maybes
 * @return {A[]}
 */
export const filterOutNothing = (maybes) => /** @type A[] */ (maybes.filter(isJust));

//////////
// pair //
//////////

/**
 * @template A, B
 * @typedef {[A, B]} Pair<A, B>
 */

/**
 * @template A, B
 * @param {A} first
 * @param {B} second
 * @return {Pair<A, B>}
 */
export const pairup = (first, second) => [first, second];

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @return {Pair<B,A>}
 */
export const flipPair = ([first, second]) => [second, first];

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @return {A}
 */
export const getFirst = ([first, _second]) => first;

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @return {B}
 */
export const getSecond = ([_first, second]) => second;

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @param {A} first
 * @return {Pair<A, B>}
 */
export const setFirst = ([_first, second], first) => [first, second];

/**
 * @template A, B
 * @param {Pair<A,B>} pair
 * @param {B} second
 * @return {Pair<A, B>}
 */
export const setSecond = ([first, _second], second) => [first, second];

/**
 * @template K, V
 * @param {K} key1
 * @param {Pair<K, V>[]} entries
 * @return V
 */
export const lookup = (key1, entries) => {
  for (const [key2, value] of entries) {
    if (key1 === key2) {
      return value;
    }
  }
  throw new Error("missing entry");
};

///////////////
// predicate //
///////////////

/** @type {function(unknown): boolean} */
export const isNotNull = (any) => any !== null;

/** @type {function(unknown[]): boolean} */
export const isNotEmpty = ({length}) => length > 0;

///////////
// array //
///////////

/**
 * @template T
 * @param {T[]} array
 * @return {T[]}
 */
export const removeDuplicate = (array) => Array.from(new Set(array));



