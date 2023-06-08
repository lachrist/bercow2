import {
  fromEither,
  makeLeft,
  makeRight,
  mapEither,
  mapLeft,
  mapRight,
  splitLeftBias,
} from "./either.mjs";
import { fromMaybe, makeJust, nothing } from "./maybe.mjs";
import { instantiateError as instantiateErrorInner } from "../impure/error.mjs";
import { getHead, toMap, toSet } from "./collection.mjs";

///////////////
// Primitive //
///////////////

/** @type {(json: json) => Either<Error, null>} */
export const instantiateNull = (json) => {
  if (json === null) {
    return makeRight(null);
  } else {
    return makeLeft(new Error("invalid null format"));
  }
};

/** @type {(json: json) => Either<Error, boolean>} */
export const instantiateBoolean = (json) => {
  if (typeof json === "boolean") {
    return makeRight(json);
  } else {
    return makeLeft(new Error("invalid boolean format"));
  }
};

/** @type {(json: json) => Either<Error, number>} */
export const instantiateNumber = (json) => {
  if (typeof json === "number") {
    return makeRight(json);
  } else {
    return makeLeft(new Error("invalid number format"));
  }
};

/** @type {(json: json) => Either<Error, string>} */
export const instantiateString = (json) => {
  if (typeof json === "string") {
    return makeRight(json);
  } else {
    return makeLeft(new Error("invalid string format"));
  }
};

///////////
// Maybe //
///////////

/**
 * @template X
 * @param {Maybe<X>} maybe
 * @param {(x: X) => json} serialize
 * @returns {json}
 */
export const serializeMaybe = (maybe, serialize) =>
  fromMaybe(
    maybe,
    () => null,
    (value) => ({ just: serialize(value) })
  );

/**
 * @template X
 * @param {json} json
 * @param {(json: json) => Either<Error, X>} instantiate
 * @returns {Either<Error, Maybe<X>>}
 */
export const instantiateMaybe = (json, instantiate) => {
  if (typeof json === "object") {
    if (json === null) {
      return makeRight(nothing);
    } else if ("just" in json) {
      return mapRight(instantiate(json.just), makeJust);
    } else {
      return makeLeft(new Error("invalid maybe format"));
    }
  } else {
    return makeLeft(new Error("invalid maybe format"));
  }
};

////////////
// Either //
////////////

/**
 * @template L, R
 * @param {Either<L, R>} either
 * @param {(left: L) => json} serializeLeft
 * @param {(right: R) => json} serializeRight
 * @returns {json}
 */
export const serializeEither = (either, serializeLeft, serializeRight) =>
  fromEither(
    either,
    (left) => /** @type {json} */ ({ left: serializeLeft(left) }),
    (right) => /** @type {json} */ ({ right: serializeRight(right) })
  );

/**
 * @template L, R
 * @param {json} json
 * @param {(json: json) => Either<Error, L>} instantiateLeft
 * @param {(json: json) => Either<Error, R>} instantiateRight
 * @returns {Either<Error, Either<L, R>>}
 */
export const instantiateEither = (json, instantiateLeft, instantiateRight) => {
  if (typeof json === "object" && json !== null) {
    if ("left" in json && !("right" in json)) {
      return mapRight(
        instantiateLeft(json.left),
        /** @type {(left: L) => Either<L, R>} */ (makeLeft)
      );
    } else if ("right" in json && !("left" in json)) {
      return mapRight(
        instantiateRight(json.right),
        /** @type {(right: R) => Either<L, R>} */ (makeRight)
      );
    } else {
      return makeLeft(new Error("invalid either format"));
    }
  } else {
    return makeLeft(new Error("invalid either format"));
  }
};

///////////
// Array //
///////////

/**
 * @template X
 * @param {X[]} array
 * @param {(x: X) => json} serialize
 * @returns {json}
 */
export const serializeArray = (array, serialize) => array.map(serialize);

/**
 * @template X
 * @param {json} json
 * @param {(json: json) => Either<Error, X>} instantiate
 * @returns {Either<Error, X[]>}
 */
export const instantiateArray = (json, instantiate) => {
  if (Array.isArray(json)) {
    return mapLeft(splitLeftBias(json.map(instantiate)), getHead);
  } else {
    return makeLeft(new Error("invalid array format"));
  }
};

/////////
// Map //
/////////

/**
 * @template X
 * @param {Map<string, X>} map
 * @param {(x: X) => json} serialize
 * @returns {json}
 */
export const serializeMap = (map, serialize) =>
  Object.fromEntries([...map].map(([key, val]) => [key, serialize(val)]));

/**
 * @template V
 * @param {json} json
 * @param {(json: json) => Either<Error, V>} instantiate
 * @returns {Either<Error, Map<string, V>>}
 */
export const instantiateMap = (json, instantiate) => {
  if (typeof json === "object" && json !== null) {
    return mapEither(
      splitLeftBias(
        Object.entries(json).map(([key, val]) =>
          mapRight(
            instantiate(val),
            (val) => /** @type {[string, V]} */ ([key, val])
          )
        )
      ),
      getHead,
      toMap
    );
  } else {
    return makeLeft(new Error("invalid either format"));
  }
};

/////////
// Set //
/////////

/**
 * @template X
 * @param {Set<X>} set
 * @param {(x: X) => json} serialize
 * @returns {json}
 */
export const serializeSet = (set, serialize) => [...set].map(serialize);

/**
 * @template X
 * @param {json} json
 * @param {(json: json) => Either<Error, X>} instantiate
 * @returns {Either<Error, Set<X>>}
 */
export const instantiateSet = (json, instantiate) => {
  if (Array.isArray(json)) {
    return mapEither(splitLeftBias(json.map(instantiate)), getHead, toSet);
  } else {
    return makeLeft(new Error("invalid array format"));
  }
};

///////////
// Error //
///////////

/** @type {(error: Error) => json} */
export const serializeError = ({ name, message }) => ({ name, message });

/** @type {(serial: json) => Either<Error, Error>} */
export const instantiateError = (serial) => {
  if (
    typeof serial === "object" &&
    serial !== null &&
    "name" in serial &&
    "message" in serial &&
    "stack" in serial &&
    typeof serial.name === "string" &&
    typeof serial.message === "string" &&
    typeof serial.stack === "string"
  ) {
    return makeRight(
      instantiateErrorInner(
        /** @type {{ name: string; message: string; stack: string }} */ (serial)
      )
    );
  } else {
    return makeLeft(new Error("invalid error format"));
  }
};
