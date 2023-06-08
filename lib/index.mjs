import { cpus } from "node:os";
import { readFile, writeFile } from "node:fs/promises";
import {
  bindRight,
  bindRightAsync,
  catchEither,
  fromEither,
  makeLeft,
  makeRight,
} from "./util/either.mjs";
import { fromMaybe } from "./util/maybe.mjs";
import { createState, getState, stepState } from "./impure/state.mjs";
import { initializeGraph, isGraphComplete, stepGraph } from "./graph.mjs";
import {
  createStream,
  readStream,
  writeStream,
  endStream,
} from "./impure/stream.mjs";
import { perform } from "./perform.mjs";
import { identity } from "./util/util.mjs";
import { throwError } from "./util/error.mjs";
import { instantiateError } from "./impure/error.mjs";
import { partial_XX } from "./util/partial.mjs";
import {
  empty_cache_serial,
  instantiateCache,
  serializeCache,
} from "./cache.mjs";

/**
 * @type {(current: { state: Graph; input: Outcome }) => {
 *   state: Graph;
 *   output: Either<Error, Action[]>;
 * }}
 */
const step = ({ state: graph, input: outcome }) => {
  const current = { graph, outcome };
  const next = stepGraph(current);
  // console.dir({ next, current }, { depth: 10 });
  return fromEither(
    next,
    (error) => ({ state: graph, output: makeLeft(error) }),
    ({ graph, actions }) => ({ state: graph, output: makeRight(actions) })
  );
};

/**
 * @type {(
 *   state: State<Graph>,
 *   stream: Stream<Action>,
 *   performAction: (action: Action) => Promise<Result>
 * ) => Promise<void>}
 */
const fork = async (state, stream, performAction) =>
  await fromMaybe(
    await readStream(stream),
    async () => undefined,
    async (action) => {
      await fromEither(
        await stepState(state, step, {
          specifier: action.specifier,
          result: await performAction(action),
        }),
        throwError,
        async (actions) => {
          await Promise.all(
            actions.map((action) => writeStream(stream, action))
          );
        }
      );
      if (isGraphComplete(await getState(state))) {
        await endStream(stream);
      }
      await fork(state, stream, performAction);
    }
  );

/** @typedef {number | string} Concurrency */

/** @type {(concurrency: Concurrency) => Either<Error, number>} */
const evalConcurrency = (concurrency) => {
  if (typeof concurrency === "number") {
    if (Math.round(concurrency) !== concurrency) {
      return makeLeft(new Error("Concurrency must be an integer"));
    } else if (concurrency > cpus().length) {
      return makeLeft(
        new Error("It does not make sense to have more workers than CPUs.")
      );
    } else if (concurrency < 1) {
      return makeLeft(new Error("Concurrency must be at least 1"));
    } else {
      return makeRight(concurrency);
    }
  } else if (typeof concurrency === "string") {
    if (/^[0-9]+%$/.test(concurrency)) {
      const percentage = parseInt(concurrency.slice(0, -1));
      if (percentage > 100) {
        return makeLeft(
          new Error("It does not make sense to have more workers than CPUs.")
        );
      } else {
        return makeRight(Math.round((percentage / 100) * cpus().length));
      }
    } else {
      return makeLeft(
        new Error(
          "Invalid concurrency format, expected a percentage -- eg: 50%"
        )
      );
    }
  } else {
    throw new Error("invalid concurrency type");
  }
};

/** @type {(url: URL, def: string) => Promise<Either<Error, string>>} */
const readFileDefault = async (url, def) => {
  try {
    return makeRight(await readFile(url, "utf8"));
  } catch (error) {
    if (error instanceof Error) {
      if ("code" in error && error.code === "ENOENT") {
        return makeRight(def);
      } else {
        return makeLeft(error);
      }
    } else {
      throw new Error("unexpected error type");
    }
  }
};

/**
 * @type {(
 *   specifiers: Set<Specifier>,
 *   options: { plugin: Plugin; concurrency: Concurrency; cache: URL }
 * ) => Promise<Graph>}
 */
export default async (specifiers, { plugin, concurrency, cache: url }) => {
  const stream = createStream();
  const { actions, graph } = initializeGraph(specifiers);
  await Promise.all(actions.map((action) => writeStream(stream, action)));
  const state = createState(graph);
  return fromEither(
    await bindRightAsync(
      evalConcurrency(concurrency),
      async (concurrency) =>
        await bindRightAsync(
          bindRight(await readFileDefault(url, empty_cache_serial), (content) =>
            catchEither(() => /** @type {json} */ (JSON.parse(content)))
          ),
          async (json) =>
            await bindRightAsync(
              await instantiateCache(json),
              async (cache) => {
                await Promise.all(
                  new Array(concurrency)
                    .fill(null)
                    .map(() =>
                      fork(state, stream, partial_XX(perform, plugin, cache))
                    )
                );
                await writeFile(
                  url,
                  JSON.stringify(await serializeCache(cache)),
                  "utf8"
                );
                return makeRight(await getState(state));
              }
            )
        )
    ),
    (error) => {
      throw instantiateError({
        message: error.message,
        stack: error.stack ?? "",
        name: "BercowError",
      });
    },
    identity
  );
};
