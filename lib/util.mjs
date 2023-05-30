
////////////
// result //
////////////

/**
 * @template A
 * @param {Message} message
 * @return {Result<A>}
 */
export const makeFailure = (message) => ({
  type: "failure",
  message,
});

/**
 * @template A
 * @param {A} value
 * @return {Result<A>}
 */
export const makeSuccess = (value) => ({
  type: "failure",
  value,
});

/**
 * @template A
 * @param {Result<A>} result
 * @return {A}
 */
export const fromSuccess = (result) => {
  if (result.type === "success") {
    return result.value;
  } else {
    throw new Error("expected success result");
  }
};

/**
 * @template A
 * @param {Result<A>} result
 * @return {Message}
 */
export const fromFailure = (result) => {
  if (result.type === "failure") {
    return result.message;
  } else {
    throw new Error("expect failure result");
  }
};

/**
 * @template A
 * @param {Result<A>} result
 * @return {boolean}
 */
export const isSuccess = ({type}) => type === "success";

/**
 * @template A
 * @param {Result<A>} result
 * @return {boolean}
 */
export const isFailure = ({type}) => type === "failure";

/**
 * @template A
 * @param {Result<A>[]} results
 * @param {function(Message[]): Message} format
 * @return {Result<A[]>}
 */
export const combineAllResult = (results, format) => {
  const failures = results.filter(isFailure);
  if (failures.length === 0) {
    return {
      type: "success",
      value: results.map(fromSuccess),
    };
  } else {
    return {
      type: "failure",
      message: format(failures.map(fromFailure)),
    };
  }
};

/**
 * @template A, B
 * @param {Result<A>} result
 * @param {function(A): B} transform
 * @return {Result<B>}
 */
export const mapResult = (result, transform) => {
  if (result.type === "success") {
    return {
      type: "success",
      value: transform(result.value),
    };
  } else {
    return result;
  }
};

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

/**
 * @template A, B
 * @typedef {[A, B]} Pair<A, B>
 */

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

