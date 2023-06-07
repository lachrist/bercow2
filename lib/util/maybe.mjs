/**
 * @template A
 * @param {A} value
 * @returns {Maybe<A>}
 */
export const makeJust = (value) => ({ value });

/** @type {Nothing} */
export const nothing = null;

/**
 * @template A
 * @param {Maybe<A>} maybe
 * @returns {boolean}
 */
export const isJust = (maybe) => maybe !== null;

/**
 * @template A
 * @param {Maybe<A>} maybe
 * @returns {boolean}
 */
export const isNothing = (maybe) => maybe === null;

/**
 * @template A
 * @param {Maybe<A>} maybe
 * @returns {A}
 */
export const fromJust = (maybe) => /** @type {Just<A>} */ (maybe).value;

/**
 * @template A, B
 * @param {(a: A) => B} transform
 * @param {Maybe<A>} maybe
 * @returns {Maybe<B>}
 */
export const mapMaybe = (transform, maybe) => {
  if (maybe === null) {
    return null;
  } else {
    return { value: transform(maybe.value) };
  }
};

/**
 * @template A
 * @param {Maybe<A>[]} maybes
 * @returns {A[]}
 */
export const concatMaybe = (maybes) => maybes.filter(isJust).map(fromJust);

/**
 * @template A
 * @param {Maybe<A>[]} maybes
 * @returns {Maybe<A[]>}
 */
export const sequenceMaybe = (maybes) =>
  maybes.some(isNothing) ? nothing : makeJust(maybes.map(fromJust));

/**
 * @template A, B
 * @param {() => B} recoverNothing
 * @param {(a: A) => B} recoverJust
 * @param {Maybe<A>} maybe
 * @returns {B}
 */
export const fromMaybe = (recoverNothing, recoverJust, maybe) => {
  if (maybe === null) {
    return recoverNothing();
  } else {
    return recoverJust(maybe.value);
  }
};

/**
 * @template X
 * @param {X[]} xs
 * @param {(x: X) => boolean} predicate
 * @returns {Maybe<X>}
 */
export const findMaybe = (xs, predicate) => {
  for (const x of xs) {
    if (predicate(x)) {
      return makeJust(x);
    }
  }
  return nothing;
};

/**
 * @template X
 * @param {X | undefined} union
 * @returns {Maybe<X>}
*/
export const toMaybe = (union) => {
  if (union === undefined) {
    return nothing;
  } else {
    return makeJust(union);
  }
};
