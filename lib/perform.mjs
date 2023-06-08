import { cacheMutMap } from "./impure/mut-map.mjs";
import {
  bindRightAsync,
  catchEitherAsync,
  fromEither,
  makeRight,
  mapEither,
  mapRight,
  splitLeftBias,
} from "./util/either.mjs";
import { getHead, unionSet } from "./util/collection.mjs";
import { toMaybe } from "./util/maybe.mjs";

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
        /** @type {Result} */ ({ type: "errored", stage: "link", error }),
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
        await await cacheMutMap(cache.lint, hash, async () =>
          mapRight(await catchEitherAsync(lint(specifier)), toMaybe),
        ),
        async (report) =>
          report === null
            ? await await cacheMutMap(cache.test, deep, async () =>
                mapRight(await catchEitherAsync(test(specifier)), toMaybe),
              )
            : makeRight(report)
      ),
      (error) =>
        /** @type {Result} */ ({ type: "errored", stage: "test", error }),
      (report) =>
        /** @type {Result} */ (
          report === null
            ? { type: "success", stage: "test" }
            : { type: "failure", stage: "test", report }
        )
    );
  } else {
    throw new Error("invalid action");
  }
};
