import { readdir } from "node:fs/promises";
import { bindRightAsync, makeLeft, makeRight } from "../util/either.mjs";
import { makeJust, nothing } from "../util/maybe.mjs";

/** @typedef {string} Name */
/** @typedef {string} Pattern */
/** @typedef {{ origin: Specifier; target: Target }} Import */
/** @typedef {Either<Message, Name[]>} Readdir */
/** @typedef {Either<Message, Maybe<Specifier>>} Result */
/** @typedef {[Pattern, boolean][]} Scope */
/** @typedef {[RegExp, boolean][]} CookedScope */
/** @typedef {{ index?: Name; scope?: Scope }} Options */

/** @type {Map<Specifier, Promise<Readdir>>} */
const cache = new Map();

/** @type {(url: URL) => Promise<Readdir>} */
const readdirEither = async (url) => {
  try {
    return makeRight(await readdir(url));
  } catch (error) {
    return makeLeft(String(error));
  }
};

/** @type {(url: URL) => Promise<Readdir>} */
const readdirEitherCache = (url) => {
  const { href } = url;
  if (cache.has(href)) {
    return /** @type {Promise<Readdir>} */ (cache.get(href));
  } else {
    const promise = readdirEither(url);
    cache.set(href, promise);
    return promise;
  }
};

/** @type {(import_: Import, index: Name) => Promise<Result>} */
const resolveRegular = async ({ target, origin }, index) => {
  const name = /** @type {Name} */ (target.split("/").pop());
  const directory = new URL(".", new URL(target, origin));
  return bindRightAsync(await readdirEitherCache(directory), async (names) => {
    if (names.includes(name)) {
      if (name.includes(".")) {
        return makeRight(makeJust(new URL(name, directory).href));
      } else {
        return await resolveRegular(
          { target: `${target}/${index}`, origin },
          index
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
          `Mutliple matches for ${JSON.stringify(target)} from ${JSON.stringify(
            origin
          )} >> ${JSON.stringify(matches)}`
        );
      }
    }
  });
};

/** @type {(entry: [Pattern, boolean]) => [RegExp, boolean]} */
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

/** @type {(options: Options) => (import_: Import) => Promise<Result>} */
export default ({ index = "index", scope = [["^\\.\\.?/", true]] }) => {
  const cooked_scope = scope.map(cookScopeEntry);
  return async ({ target, origin }) => {
    if (isScoped(target, cooked_scope)) {
      return resolveRegular(
        {
          target: target.endsWith("/") ? `${target}${index}` : target,
          origin,
        },
        index
      );
    } else {
      return Promise.resolve(makeRight(nothing));
    }
  };
};
