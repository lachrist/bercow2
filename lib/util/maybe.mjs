/**
 * @template A
 * @param {A} just
 * @returns {Maybe<A>}
 */
export const makeJust = (just) => ({ just });

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
export const fromJust = (maybe) => /** @type {{ just: A }} */ (maybe).just;

/**
 * @template A, B
 * @param {Maybe<A>} maybe
 * @param {(a: A) => B} transform
 * @returns {Maybe<B>}
 */
export const mapJust = (maybe, transform) => {
  if (maybe === null) {
    return null;
  } else {
    return { just: transform(maybe.just) };
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
 * @param {Maybe<A>} maybe
 * @param {() => B} recoverNothing
 * @param {(a: A) => B} recoverJust
 * @returns {B}
 */
export const fromMaybe = (maybe, recoverNothing, recoverJust) => {
  if (maybe === null) {
    return recoverNothing();
  } else {
    return recoverJust(maybe.just);
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
 * @param {X | undefined | null} union
 * @returns {Maybe<X>}
 */
export const toMaybe = (union) => {
  if (union === undefined || union === null) {
    return nothing;
  } else {
    return makeJust(union);
  }
};

/** @type {(callback: () => void) => Maybe<Error>} */
export const catchMaybe = (callback) => {
  try {
    callback();
    return nothing;
  } catch (error) {
    if (error instanceof Error) {
      return makeJust(error);
    } else {
      throw new Error("unexpected error type");
    }
  }
};

/** @type {(promise: Promise<void>) => Promise<Maybe<Error>>} */
export const catchMaybeAsync = async (promise) => {
  try {
    await promise;
    return nothing;
  } catch (error) {
    if (error instanceof Error) {
      return makeJust(error);
    } else {
      throw new Error("unexpected error type");
    }
  }
};
