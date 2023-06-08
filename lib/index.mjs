import { cpus } from "node:os";
import { readFile, writeFile } from "node:fs/promises";
import {
  fromEither,
  fromLeft,
  fromRight,
  isLeft,
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
import { log } from "./impure/log.mjs";
import { cookPlugin, empty_cache_serial } from "./plugin.mjs";
import { catchError, catchErrorAsync, throwError } from "./util/error.mjs";

/**
 * @type {(
 *   action: Action,
 *   plugin: { lint: Lint; link: Link; test: Test }
 * ) => Promise<Result>}
 */
const performAction = async (action, { lint, link, test }) => {
  if (action.type === "lint") {
    return {
      type: "lint",
      inner: await lint(action.specifier),
    };
  } else if (action.type === "link") {
    return {
      type: "link",
      inner: await link(action.specifier, action.hash),
    };
  } else if (action.type === "test") {
    await log(`Testing ${action.specifier}...\n`);
    const inner = await test(action.specifier, action.hash);
    await log(
      fromMaybe(
        inner,
        () => `Successfully tested ${action.specifier}`,
        (failure) => `Testing failure on ${action.specifier}: ${failure}`
      )
    );
    return { type: "test", inner };
  } else {
    throw new Error("invalid stage");
  }
};

/**
 * @type {(current: { state: Graph; input: Outcome }) => {
 *   state: Graph;
 *   output: Either<Error, Action[]>;
 * }}
 */
const step = ({ state: graph, input: outcome }) =>
  fromEither(
    stepGraph({ graph, outcome }),
    (error) => ({ state: graph, output: makeLeft(error) }),
    ({ graph, actions }) => ({ state: graph, output: makeRight(actions) })
  );

/**
 * @type {(
 *   state: State<Graph>,
 *   stream: Stream<Action>,
 *   plugin: { lint: Lint; link: Link; test: Test }
 * ) => Promise<void>}
 */
const fork = async (state, stream, plugins) =>
  fromMaybe(
    await readStream(stream),
    async () => undefined,
    async (action) => {
      await fromEither(
        await stepState(state, step, {
          specifier: action.specifier,
          result: await performAction(action, plugins),
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
    }
  );

/** @typedef {number | string} Concurrency */

/** @type {(concurrency: Concurrency) => Error | number} */
const evalConcurrency = (concurrency) => {
  if (typeof concurrency === "number") {
    if (Math.round(concurrency) !== concurrency) {
      return new Error("Concurrency must be an integer");
    } else if (concurrency > cpus().length) {
      return new Error(
        "It does not make sense to have more workers than CPUs."
      );
    } else if (concurrency < 1) {
      return new Error("Concurrency must be at least 1");
    } else {
      return concurrency;
    }
  } else if (typeof concurrency === "string") {
    if (/^[0-9]+%$/.test(concurrency)) {
      const percentage = parseInt(concurrency.slice(0, -1));
      if (percentage > 100) {
        return new Error(
          "It does not make sense to have more workers than CPUs."
        );
      } else {
        return Math.round((percentage / 100) * cpus().length);
      }
    } else {
      return new Error(
        "Invalid concurrency format, expected a percentage -- eg: 50%"
      );
    }
  } else {
    throw new Error("invalid concurrency type");
  }
};

/**
 * @type {(
 *   specifiers: Set<Specifier>,
 *   options: { plugin: Plugin; concurrency: Concurrency; cache: URL }
 * ) => Promise<Error | Graph>}
 */
export default async (specifiers, { plugin, concurrency, cache }) => {
  const stream = createStream();
  const { graph, actions } = initializeGraph(specifiers);
  await Promise.all(actions.map((action) => writeStream(stream, action)));
  const state = createState(graph);
  const workers = evalConcurrency(concurrency);
  if (workers instanceof Error) {
    return workers;
  }
  const content = await catchErrorAsync(readFile(cache, "utf8"));
  if (content instanceof Error) {
    if (!("code" in content) || content.code !== "ENOENT") {
      return content;
    }
  }
  /** @type {Error | json} */
  const serial =
    content instanceof Error
      ? empty_cache_serial
      : catchError(() => JSON.parse(content));
  if (serial instanceof Error) {
    return serial;
  }
  const either = await cookPlugin(plugin, serial);
  if (isLeft(either)) {
    return fromLeft(either);
  }
  const { save, ...cooked_plugin } = fromRight(either);
  await Promise.all(
    new Array(workers).fill(null).map(() => fork(state, stream, cooked_plugin))
  );
  await writeFile(cache, JSON.stringify(await save()), "utf8");
  return await getState(state);
};

//   return fromEither(
//     await bindRightAsync(
//       evalConcurrency(concurrency),
//       async (concurrency) =>
//         await bindRightAsync(
//           bindRight(
//             await catchEitherAsync(readFileDefault(cache, empty_cache_serial)),
//             (content) =>
//               catchEither(() => /** @type {json} */ (JSON.parse(content)))
//           ),
//           async (json) =>
//             await bindRightAsync(
//               await cookPlugin(plugin, json),
//               async ({ save, ...plugin }) => {
//                 await Promise.all(
//                   new Array(concurrency)
//                     .fill(null)
//                     .map(() => fork(state, stream, plugin))
//                 );
//                 await writeFile(cache, JSON.stringify(await save()), "utf8");
//                 return makeRight(await getState(state));
//               }
//             )
//         )
//     ),
//     /** @type {(error: Error) => Error | Graph} */ (identity),
//     /** @type {(graph: Graph) => Error | Graph} */ (identity)
//   );
// };
