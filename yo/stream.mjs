
import { makeJust, nothing } from "./maybe.mjs";

/**
 * @template X
 * @returns {Stream<X>}
 */
export const makeStream = () => ({
  pendings: [],
  queue: [],
  done: false,
});

/**
 * @template X
 * @param {Stream<X>} stream
 * @returns {Promise<Maybe<X>>}
 */
export const readStream = ({ queue, pendings, done}) => {
  if (queue.length > 0) {
    return Promise.resolve(makeJust(/** @type {X} */ (queue.shift())));
  } else if (done) {
    return Promise.resolve(nothing);
  } else {
    return new Promise((resolve) => {
      pendings.push(resolve);
    });
  }
};

/**
 * @template X
 * @param {Stream<X>} stream
 * @param {X} value
 * @returns {Promise<boolean>}
 */
export const writeStream = async ({ queue, pendings, done }, value) => {
  if (done) {
    return false;
  } else {
    if (pendings.length > 0) {
      /** @type {(maybe: Maybe<X>) => void} */ (pendings.shift())(
        makeJust(value)
      );
    } else {
      queue.push(value);
    }
    return true;
  }
};

/**
 * @template X
 * @param {Stream<X>} stream
 * @returns {Promise<void>}
 */
export const endStream = async (stream) => {
  stream.done = true;
};
