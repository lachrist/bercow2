import { cacheMutMap, createMutMap } from "./impure/mut-map.mjs";
import { digestFile } from "./impure/digest.mjs";
import {
  bindRightAsync,
  catchEitherAsync,
  makeLeft,
  makeRight,
  mapEither,
  mapLeft,
  splitLeftBias,
} from "./util/either.mjs";
import { fromMaybe } from "./util/maybe.mjs";
import { toArray } from "./util/collection.mjs";

/** @typedef {MutMap<ShallowHash, Promise<Maybe<Failure>>>} LintCache */
/** @typedef {MutMap<ShallowHash, Promise<Either<Failure, Set<Target>>>>} ParseCache */
/** @typedef {MutMap<DeepHash, Promise<Maybe<Failure>>>} TestCache */
/** @typedef {{ lint: LintCache; parse: ParseCache; test: TestCache }} Cache */
/** @typedef {() => Promise<void>} Save */

/**
 * @type {(
 *   plugin: Plugin,
 *   url: URL
 * ) => { lint: Lint; link: Link; test: Test; save: Save }}
 */
export default ({ lint, parse, resolve, test }, url) => {
  /** @type {Cache} */
  const cache = {
    lint: createMutMap(new Map()),
    parse: createMutMap(new Map()),
    test: createMutMap(new Map()),
  };
  return {
    lint: async (specifier) =>
      await bindRightAsync(
        mapLeft(
          String,
          await catchEitherAsync(
            digestFile(new URL(specifier), {
              algorithm: "sha256",
              output: "hex",
              input: "utf8",
            })
          )
        ),
        async (hash) =>
          fromMaybe(
            () => makeRight(hash),
            /** @type {(message: Failure) => Either<Failure, Hash>} */ (
              makeLeft
            ),
            await await cacheMutMap(cache.lint, hash, () => lint(specifier))
          )
      ),
    link: async (specifier, hash) =>
      bindRightAsync(
        await await cacheMutMap(cache.parse, hash, () => parse(specifier)),
        async (targets) =>
          mapEither(
            (messages) => messages.join("\n"),
            (sets) => new Set(sets.map(toArray).flat()),
            splitLeftBias(
              await Promise.all(
                [...targets].map((target) => resolve(target, specifier))
              )
            )
          )
      ),
    test: async (specifier, hash) =>
      await await cacheMutMap(cache.test, hash, () => test(specifier)),
    save: () => {

    },
  };
};
