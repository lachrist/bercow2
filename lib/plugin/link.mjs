import { readFile } from "node:fs/promises";
import {
  bindRightAsync,
  catchEitherAsync,
  makeLeft,
  makeRight,
  mapEither,
  splitLeftBias,
} from "../util/either.mjs";
import { concatMaybe } from "../util/maybe.mjs";

/** @typedef {string} Content */

/** @type {(url: URL) => Promise<Either<Message, Content>>} */
const readFileEither = async (url) => {
  try {
    return makeRight(await readFile(url, "utf8"));
  } catch (error) {
    return makeLeft(String(error));
  }
};

/** @type {(options: { parse; resolve }) => Promise<Link>} */
export default async ({ parse, resolve }) =>
  async (origin, hash) =>
    await bindRightAsync(await catchEitherAsync(readFile(new URL(origin), "utf8")), (content) =>
      bindRightAsync(parse(content), async (targets) =>
        mapEither(
          (messages) => messages[0],
          (destinations) => new Set(concatMaybe(destinations)),
          splitLeftBias(
            await Promise.all(
              [...targets].map((target) => resolve({ origin, target }))
            )
          )
        )
      )
    );
