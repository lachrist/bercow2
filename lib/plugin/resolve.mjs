import { readdir } from "node:fs/promises";
import {
  bindRightAsync,
  catchEitherAsync,
  makeLeft,
  makeRight,
  mapLeft,
} from "../util/either.mjs";
import { makeJust, nothing } from "../util/maybe.mjs";
import { createMutMap, cacheMutMap } from "../impure/mut-map.mjs";

/** @typedef {string} Name */
/** @typedef {string} Pattern */
/** @typedef {{ origin: Specifier; target: Target }} Import */
/** @typedef {Either<Message, Name[]>} Readdir */
/** @typedef {Either<Message, Maybe<Specifier>>} Result */
/** @typedef {[Pattern, boolean]} ScopeEntry */
/** @typedef {ScopeEntry[]} Scope */
/** @typedef {[RegExp, boolean]} CookedScopeEntry */
/** @typedef {CookedScopeEntry[]} CookedScope */
/** @typedef {{ default?: Name; scope?: Scope }} Options */

/** @type {(entry: ScopeEntry) => CookedScopeEntry} */
const cookScopeEntry = ([pattern, internal]) => [new RegExp(pattern), internal];

/** @type {(target: Target, scope: CookedScope) => boolean} */
const isScoped = (target, scope) => {
  for (const [regexp, internal] of scope) {
    if (regexp.test(target)) {
      return internal;
    }
  }
  return false;
};

/**
 * @type {(
 *   target: Target,
 *   origin: Specifier,
 *   default_: Name,
 *   cache: MutMap<Specifier, Promise<Readdir>>
 * ) => Promise<Result>}
 */
const resolve = async (target, origin, default_, cache) => {
  const name = /** @type {Name} */ (target.split("/").pop());
  const directory = new URL(".", new URL(target, origin));
  return bindRightAsync(
    await cacheMutMap(cache, directory.href, async () =>
      mapLeft(String, await catchEitherAsync(readdir(directory)))
    ),
    async (names) => {
      if (names.includes(name)) {
        if (name.includes(".")) {
          return makeRight(makeJust(new URL(name, directory).href));
        } else {
          return await resolve(
            `${target}/${default_}`,
            origin,
            default_,
            cache
          );
        }
      } else {
        const base = name.split(".")[0];
        const matches = names.filter((name) => name.split(".")[0] === base);
        if (matches.length === 0) {
          return makeLeft(
            `No match for ${JSON.stringify(target)} from ${JSON.stringify(
              origin
            )}`
          );
        } else if (matches.length === 1) {
          return makeRight(makeJust(new URL(matches[0], directory).href));
        } else {
          return makeLeft(
            `Mutliple matches for ${JSON.stringify(
              target
            )} from ${JSON.stringify(origin)} >> ${JSON.stringify(matches)}`
          );
        }
      }
    }
  );
};

/**
 * @type {(
 *   options: Options
 * ) => (target: Target, origin: Specifier) => Promise<Result>}
 */
export default ({
  default: default_ = "index",
  scope = [["^\\.\\.?/", true]],
}) => {
  /** @type {MutMap<Specifier, Promise<Readdir>>} */
  const cache = createMutMap(new Map());
  const cooked_scope = scope.map(cookScopeEntry);
  return async (target, origin) => {
    if (isScoped(target, cooked_scope)) {
      return await resolve(
        target.endsWith("/") ? `${target}${default_}` : target,
        origin,
        default_,
        cache
      );
    } else {
      return makeRight(nothing);
    }
  };
};
