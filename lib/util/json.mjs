import { fromEither, makeLeft, makeRight, mapEither, mapLeft, mapRight, splitLeftBias } from "./either.mjs";
import { fromMaybe, makeJust, nothing } from "./maybe.mjs";

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
    () => null,
    (value) => ({ value: serialize(value) }),
    maybe
  );

/**
 * @template X
 * @param {json} json
 * @param {(json: json) => Either<string, X>} instantiate
 * @returns {Either<string, Maybe<X>>}
 */
export const instantiateMaybe = (json, instantiate) => {
  if (typeof json === "object") {
    if (json === null) {
      return makeRight(nothing);
    } else if ("value" in json) {
      return mapRight(makeJust, instantiate(json.value));
    } else {
      return makeLeft("invalid maybe format");
    }
  } else {
    return makeLeft("invalid maybe format");
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
    (left) => /** @type {json} */ ({ left: serializeLeft(left) }),
    (right) => /** @type {json} */ ({ right: serializeRight(right) }),
    either
  );

/**
 * @template L, R
 * @param {json} json
 * @param {(json: json) => Either<string, L>} instantiateLeft
 * @param {(json: json) => Either<string, R>} instantiateRight
 * @returns {Either<string, Either<L, R>>}
 */
export const instantiateEither = (json, instantiateLeft, instantiateRight) => {
  if (typeof json === "object" && json !== null) {
    if ("left" in json && !("right" in json)) {
      return mapRight(
        /** @type {(left: L) => Either<L, R>} */ (makeLeft),
        instantiateLeft(json.left)
      );
    } else if ("right" in json && !("left" in json)) {
      return mapRight(
        /** @type {(right: R) => Either<L, R>} */ (makeRight),
        instantiateRight(json.right)
      );
    } else {
      return makeLeft("invalid either format");
    }
  } else {
    return makeLeft("invalid either format");
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
 * @param {(json: json) => Either<string, X>} instantiate
 * @returns {Either<string, X[]>}
 */
export const instantiateArray = (json, instantiate) => {
  if (Array.isArray(json)) {
    return mapLeft(
      (messages) => messages.join(" && "),
      splitLeftBias(json.map(instantiate)),
    );
  } else {
    return makeLeft("invalid array format");
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
export const serializeMap = (map, serialize) => Object.fromEntries(
  [...map].map(([key, val]) => [key, serialize(val)]),
);

/**
 * @template V
 * @param {json} json
 * @param {(json: json) => Either<string, V>} instantiate
 * @returns {Either<string, Map<string, V>>}
 */
export const instantiateMap = (json, instantiate) => {
  if (typeof json === "object" && json !== null) {
    return mapEither(
      (messages) => messages.join(" && "),
      (entries) => new Map(entries),
      splitLeftBias(
        Object.entries(json).map(([key, val]) => mapRight(
          (val) => /** @type {[string, V]} */ ([key, val]),
          instantiate(val),
        ),
      )),
    );
  } else {
    return makeLeft("invalid either format");
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
 * @param {(json: json) => Either<string, X>} instantiate
 * @returns {Either<string, Set<X>>}
 */
export const instantiateSet = (json, instantiate) => {
  if (Array.isArray(json)) {
    return mapEither(
      (messages) => messages.join(" && "),
      (values) => new Set(values),
      splitLeftBias(json.map(instantiate)),
    );
  } else {
    return makeLeft("invalid array format");
  }
};
