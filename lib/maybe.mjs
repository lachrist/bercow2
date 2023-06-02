
/**
 * @template A
 * @param {A} value
 * @return {Maybe<A>}
 */
export const makeJust = (value) => ({value});

/** @type {Nothing} */
export const nothing = null;

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
 * @param {Maybe<A>} maybe
 * @return {A}
 */
export const fromJust = (maybe) => /** @type {Just<A>} */ (maybe).value;

/**
 * @template A, B
 * @param {(a: A) => B} transform
 * @param {Maybe<A>} maybe
 * @return {Maybe<B>}
 */
export const mapMaybe = (transform, maybe) => {
  if (maybe === null) {
    return null;
  } else {
    return {value: transform(maybe.value)};
  }
};

/**
 * @template A
 * @param {Maybe<A>[]} maybes
 * @return {A[]}
*/
export const concatMaybe = (maybes) => maybes.filter(isJust).map(fromJust);

/**
 * @template A, B
 * @param {() => B} recoverNothing
 * @param {(a: A) => B} recoverJust
 * @param {Maybe<A>} maybe
 * @return {B}
 */
export const fromMaybe = (recoverNothing, recoverJust, maybe) => {
  if (maybe === null) {
    return recoverNothing();
  } else {
    return recoverJust(maybe.value);
  }
};
