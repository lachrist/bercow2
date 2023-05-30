
import { readFile } from "node:fs/promises";
import { bindRightAsync, concatMaybe, makeLeft, makeRight, mapEither, splitLeftBias } from "./util/index.mjs";
import compileParse from "./parse.mjs";
import compileResolve from "./resolve.mjs";

/** @typedef {string} Content */

/** @type {(url: URL) => Promise<Either<Message, Content>>} */
const readFileEither = async (url) => {
  try {
    return makeRight(await readFile(url, "utf8"));
  } catch (error) {
    return makeLeft(String(error));
  }
};

/** @type {function(Object): Promise<Link>} */
export default async (options) => {
  const resolve = compileResolve(options);
  const parse = compileParse(options);
  return async (origin) => bindRightAsync(
    await readFileEither(new URL(origin)),
    (content) => bindRightAsync(
      parse(content),
      async (targets) => mapEither(
        (messages) => messages[0],
        (destinations) => new Set(concatMaybe(destinations)),
        splitLeftBias(
          await Promise.all([...targets].map((target) => resolve({ origin, target }))),
        ),
      ),
    ),
  );
};
