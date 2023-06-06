import { just, nothing } from "../maybe.mjs";

/** @type {Nil} */
export const nil = null

/**
 * @template X
 * @param {X} x
 * @return {List<X>}
 */
export const singleton = (x) => cons(x, nil);

/**
 * @template X
 * @param {List<X>} xs
 * @return {boolean}
 */
export const isNil = (xs) => xs === null;

/**
 * @template X
 * @param {List<X>} xs
 * @param {X} x
 * @return {List<X>}
 */
export const cons = (x, xs) => ({car:x , cdr:xs});

/**
 * @template X
 * @param {List<X>} xs
 * @param {X} x
 * @return {List<X>}
 */
export const snoc = (xs, x) => ({car:x, cdr:xs});

/**
 * @template X
 * @param {List<X>} xs
 * @return X
 */
export const head = (/** @type {Cons<X>} */ {car}) => car;

/**
 * @template X
 * @param {List<X>} xs
 * @return {List<X>}
 */
export const tail = (/** @type {Cons<X>} */{cdr}) => cdr;

/**
 * @template X
 * @param {(x: X) => boolean} p
 * @param {List<X>} xs
 * @return {boolean}
 */
export const some = (p, xs) => {
  while (xs !== null) {
    const {car, cdr} = xs;
    if (p(car)) {
      return true;
    }
    xs = cdr;
  }
  return false;
};

/**
 * @template X
 * @param {(x: X) => boolean} p
 * @param {List<X>} xs
 * @return {boolean}
 */
export const every = (p, xs) => {
  while (xs !== null) {
    const {car, cdr} = xs;
    if (!p(car)) {
      return false;
    }
    xs = cdr;
  }
  return true;
};

/**
 * @template X
 * @param {List<X>} xs
 * @return {boolean}
 */
export const isEmpty = (xs) => xs === null;

/**
 * @template X
 * @param {X} x
 * @param {List<X>} xs
 * @return {boolean}
 */
export const elem = (x, xs) => {
  while (xs !== null) {
    const {car, cdr} = xs;
    if (car === x) {
      return true;
    }
    xs = cdr;
  }
  return false;
};

/**
 * @template X, Y
 * @param {(x: X, y: Y) => Y} f
 * @param {Y} y
 * @param {List<X>} xs
 * @return {Y}
 */
export const foldr = (f, y, xs) => {
  if (xs === null) {
    return y;
  } else {
    const {car, cdr} = xs;
    return f(car, foldr(f, y, cdr));
  }
};

/**
 * @template X, Y
 * @param {(x: X) => Y} f
 * @param {List<X>} xs
 * @return {List<Y>}
 */
export const map = (f, xs) => foldr((x, ys) => ({car: f(x), cdr: ys}), /** @type {List<Y>} */ (null), xs);

/**
 * @template X
 * @param {(x: X) => boolean} p
 * @param {List<X>} xs1
 * @return {List<X>}
 */
export const filter = (p, xs1) => foldr((x, xs2) => p(x) ? {car: x, cdr: xs2} : xs2, /** @type {List<X>} */ (null), xs1);

/**
 * @template X, Y
 * @param {(y: Y, x: X) => Y} f
 * @param {Y} y
 * @param {List<X>} xs
 * @return {Y}
 */
export const foldl = (f, y, xs) => {
  while (xs !== null) {
    const {car, cdr} = xs;
    y = f(y, car);
    xs = cdr;
  }
  return y;
};

/**
 * @template X
 * @param {(x: X) => boolean} p
 * @param {List<X>} xs
 * @return {Maybe<X>}
 */
export const find = (p, xs) => {
  while (xs !== null) {
    const {car, cdr} = xs;
    if (p(car)) {
      return just(car);
    }
    xs = cdr;
  }
  return nothing;
};

/**
 * @template X
 * @param {List<X>} xs
 * @return {List<X>}
 */
export const reverse = (xs) => foldl(snoc, /** @type {List<X>} */ (null), xs);

/**
 * @template X
 * @param {List<X>} xs
 * @return {number}
 */
export const count = (xs) => {
  let length = 0;
  while (xs !== null) {
    length += 1;
    xs = xs.cdr;
  }
  return length;
};

/**
 * @template A
 * @param {A[]} array
 * @return {List<A>}
 */
export const fromArray = (array) => {
  let xs = null;
  for (let i = array.length - 1; i >= 0; i--) {
    xs = cons(array[i], xs);
  }
  return xs;
};

/**
 * @template A
 * @param {List<A>} xs
 * @return {A[]}
 */
export const toArray = (xs) => {
  const array = [];
  while (xs !== null) {
    const {car, cdr} = xs;
    array.push(car);
    xs = cdr;
  }
  return array;
};

/**
 * @template A
 * @param {List<A>} xs1
 * @param {List<A>} xs2
 * @return {List<A>}
 */
export const append = (xs1, xs2) => foldr(cons, xs2, xs1);

/**
 * @template A
 * @param {List<List<A>>} xss
 * @return {List<A>}
 */
export const concat = (xss) => foldr(append, /** @type {List<A>} */ (null), xss);

/**
 * @template A
 * @param {List<A>} xs
 * @return {Set<A>}
 */
export const toSet = (xs) => {
  const set = new Set();
  while (xs !== null) {
    const {car, cdr} = xs;
    set.add(car);
    xs = cdr;
  }
  return set;
}

/**
 * @template A
 * @param {Set<A>} set
 * @return {List<A>}
 */
export const fromSet = (set) => fromArray([...set]);

/**
 * @template A
 * @param {List<A>} xs
 * @return {List<A>}
 */
export const add = (x, xs) => elem(x, xs) ? xs : cons(x, xs);

/**
 * @template A
 * @param {List<A>} xs1
 * @param {List<A>} xs2
 * @return {List<A>}
 */
export const union = (xs1, xs2) => foldl(add, xs2, xs1);

/**
 * @template A
// export const intersect = (xs1, xs2) => foldl((x, xs) => xs1 in );
