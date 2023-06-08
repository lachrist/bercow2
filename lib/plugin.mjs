import {
  cacheMutMap,
  createMutMap,
  snapshotMutMap,
} from "./impure/mut-map.mjs";
import {
  bindRight,
  bindRightAsync,
  makeLeft,
  makeRight,
  mapEither,
  mapRight,
  splitLeftBias,
  toEither,
} from "./util/either.mjs";
import { fromMaybe, toMaybe } from "./util/maybe.mjs";
import { getHead, unionSet } from "./util/collection.mjs";
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

/** @typedef {MutMap<ShallowHash, Promise<Maybe<Error>>>} LintCache */
/** @typedef {MutMap<ShallowHash, Promise<Either<Error, Set<Target>>>>} ExtractCache */
/** @typedef {MutMap<DeepHash, Promise<Maybe<Error>>>} TestCache */
/** @typedef {{ lint: LintCache; extract: ExtractCache; test: TestCache }} Cache */
/** @typedef {() => Promise<json>} Save */

export const empty_cache_serial = {
  "lint": {},
  "extract": {},
  "test": {},
};

///////////////////
// Serialization //
///////////////////

/** @type {(cache: LintCache) => Promise<json>} */
const serializeLintCache = async (cache) =>
  serializeMap(
    new Map(
      await Promise.all([...(await snapshotMutMap(cache))].map(promiseSecond))
    ),
    (maybe) => serializeMaybe(maybe, serializeError)
  );

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

/** @type {(cache: TestCache) => Promise<json>} */
const serializeTestCache = async (cache) =>
  serializeMap(
    new Map(
      await Promise.all([...(await snapshotMutMap(cache))].map(promiseSecond))
    ),
    (maybe) => serializeMaybe(maybe, serializeError)
  );

/** @type {(cache: Cache) => Promise<json>} */
const serializeCache = async ({ lint, extract, test }) => ({
  lint: await serializeLintCache(lint),
  extract: await serializeExtractCache(extract),
  test: await serializeTestCache(test),
});

///////////////////
// Instantiation //
///////////////////

/** @type {(serial: json) => Either<Error, Cache>} */
const instantiateCache = (serial) => {
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

/** @type {(serial: json) => Either<Error, LintCache>} */
const instantiateLintCache = (serial) =>
  mapRight(
    instantiateMap(serial, (serial) =>
      mapRight(instantiateMaybe(serial, instantiateError), resolvePromise)
    ),
    createMutMap
  );

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

/** @type {(serial: json) => Either<Error, TestCache>} */
const instantiateTestCache = (serial) =>
  mapRight(
    instantiateMap(serial, (serial) =>
      mapRight(instantiateMaybe(serial, instantiateError), resolvePromise)
    ),
    createMutMap
  );

////////////
// Export //
////////////

/**
 * @type {(
 *   plugin: Plugin,
 *   serial: json
 * ) => Promise<
 *   Either<Error, { lint: Lint; link: Link; test: Test; save: Save }>
 * >}
 */
export const cookPlugin = async (
  { digest, lint, extract, resolve, test },
  serial
) =>
  mapRight(instantiateCache(serial), (cache) => ({
    lint: async (specifier) =>
      await bindRightAsync(toEither(await digest(specifier)), async (hash) =>
        fromMaybe(
          await await cacheMutMap(cache.lint, hash, async () =>
            toMaybe(await lint(specifier))
          ),
          () => makeRight(hash),
          /** @type {(error: Error) => Either<Error, Hash>} */ (makeLeft)
        )
      ),
    link: async (specifier, hash) =>
      bindRightAsync(
        await await cacheMutMap(cache.extract, hash, async () =>
          toEither(await extract(specifier))
        ),
        async (targets) =>
          mapEither(
            splitLeftBias(
              await Promise.all(
                [...targets].map(async (target) =>
                  toEither(await resolve(target, specifier))
                )
              )
            ),
            getHead,
            unionSet
          )
      ),
    test: async (specifier, hash) =>
      await await cacheMutMap(cache.test, hash, async () =>
        toMaybe(await test(specifier))
      ),
    save: () => serializeCache(cache),
  }));
