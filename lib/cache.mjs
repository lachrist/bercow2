import { createMutMap, snapshotMutMap } from "./impure/mut-map.mjs";
import { bindRight, makeLeft, mapRight } from "./util/either.mjs";
import {
  instantiateEither,
  instantiateError,
  instantiateMap,
  instantiateMaybe,
  instantiateSet,
  instantiateString,
  serializeEither,
  serializeError,
  serializeMap,
  serializeMaybe,
  serializeSet,
} from "./util/json.mjs";
import { identity } from "./util/util.mjs";
import { promiseSecond } from "./util/pair.mjs";
import { resolvePromise } from "./util/promise.mjs";

export const empty_cache_serial = JSON.stringify({
  extract: {},
  lint: {},
  test: {},
});

///////////////////
// Serialization //
///////////////////

/** @type {(cache: ExtractCache) => Promise<json>} */
const serializeExtractCache = async (cache) =>
  serializeMap(
    new Map(
      await Promise.all([...(await snapshotMutMap(cache))].map(promiseSecond))
    ),
    (either) =>
      serializeEither(either, serializeError, (set) =>
        serializeSet(set, identity)
      )
  );

/** @type {(cache: LintCache) => Promise<json>} */
const serializeLintCache = async (cache) =>
  serializeMap(
    new Map(
      await Promise.all([...(await snapshotMutMap(cache))].map(promiseSecond))
    ),
    (either) =>
      serializeEither(either, serializeError, (maybe) =>
        serializeMaybe(maybe, identity)
      )
  );

/** @type {(cache: TestCache) => Promise<json>} */
const serializeTestCache = async (cache) =>
  serializeMap(
    new Map(
      await Promise.all([...(await snapshotMutMap(cache))].map(promiseSecond))
    ),
    (either) =>
      serializeEither(either, serializeError, (maybe) =>
        serializeMaybe(maybe, identity)
      )
  );

/** @type {(cache: Cache) => Promise<json>} */
export const serializeCache = async ({ extract, lint, test }) => ({
  extract: await serializeExtractCache(extract),
  lint: await serializeLintCache(lint),
  test: await serializeTestCache(test),
});

///////////////////
// Instantiation //
///////////////////

/** @type {(serial: json) => Either<Error, Cache>} */
export const instantiateCache = (serial) => {
  if (
    typeof serial === "object" &&
    serial !== null &&
    "lint" in serial &&
    "extract" in serial &&
    "test" in serial
  ) {
    return bindRight(instantiateLintCache(serial.lint), (lint) =>
      bindRight(instantiateExtractCache(serial.extract), (extract) =>
        mapRight(instantiateTestCache(serial.test), (test) => ({
          lint,
          extract,
          test,
        }))
      )
    );
  } else {
    return makeLeft(new Error("invalid cache format"));
  }
};

/** @type {(serial: json) => Either<Error, ExtractCache>} */
const instantiateExtractCache = (serial) =>
  mapRight(
    instantiateMap(serial, (serial) =>
      mapRight(
        instantiateEither(serial, instantiateError, (serial) =>
          instantiateSet(serial, instantiateString)
        ),
        resolvePromise
      )
    ),
    createMutMap
  );

/** @type {(serial: json) => Either<Error, LintCache>} */
const instantiateLintCache = (serial) =>
  mapRight(
    instantiateMap(serial, (serial) =>
      mapRight(
        instantiateEither(serial, instantiateError, (serial) =>
          instantiateMaybe(serial, instantiateString)
        ),
        resolvePromise
      )
    ),
    createMutMap
  );

/** @type {(serial: json) => Either<Error, TestCache>} */
export const instantiateTestCache = (serial) =>
  mapRight(
    instantiateMap(serial, (serial) =>
      mapRight(
        instantiateEither(serial, instantiateError, (serial) =>
          instantiateMaybe(serial, instantiateString)
        ),
        resolvePromise
      )
    ),
    createMutMap
  );
