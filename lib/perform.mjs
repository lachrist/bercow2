import { cacheMutMap } from "./impure/mut-map.mjs";
import {
  bindRightAsync,
  catchEitherAsync,
  fromEither,
  mapEither,
  mapRight,
  splitLeftBias,
} from "./util/either.mjs";
import { getHead, unionSet } from "./util/collection.mjs";

/**
 * @type {(
 *   action: Action,
 *   plugin: Plugin,
 *   cache: Cache
 * ) => Promise<Result>}
 */
export const perform = async (
  action,
  { digest, extract, resolve, lint, test },
  cache
) => {
  if (action.type === "link") {
    const { specifier } = action;
    return fromEither(
      await bindRightAsync(
        await catchEitherAsync(digest(specifier)),
        async (hash) =>
          await bindRightAsync(
            await await cacheMutMap(cache.extract, hash, () =>
              catchEitherAsync(extract(specifier))
            ),
            async (targets) =>
              mapRight(
                mapEither(
                  splitLeftBias(
                    await Promise.all(
                      [...targets].map((target) =>
                        catchEitherAsync(resolve(target, specifier))
                      )
                    )
                  ),
                  getHead,
                  unionSet
                ),
                (dependencies) => ({ hash, dependencies })
              )
          )
      ),
      (error) =>
        /** @type {Result} */ ({ type: "failure", stage: "link", error }),
      ({ hash, dependencies }) =>
        /** @type {Result} */ ({
          type: "success",
          stage: "link",
          hash,
          dependencies,
        })
    );
  } else if (action.type === "test") {
    const { specifier, hash, deep } = action;
    return fromEither(
      await bindRightAsync(
        await await cacheMutMap(cache.lint, hash, () =>
          catchEitherAsync(lint(specifier))
        ),
        async (_void) =>
          await await cacheMutMap(cache.test, deep, () =>
            catchEitherAsync(test(specifier))
          )
      ),
      (error) =>
        /** @type {Result} */ ({ type: "failure", stage: "test", error }),
      () => /** @type {Result} */ ({ type: "success", stage: "test" })
    );
  } else {
    throw new Error("invalid action");
  }
};
