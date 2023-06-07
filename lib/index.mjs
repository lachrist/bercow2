import { cpus } from "node:os";
import { readFile, writeFile } from "node:fs/promises";
import { bindRight, bindRightAsync, catchEither, catchEitherAsync, fromEither, makeLeft, makeRight } from "./util/either.mjs";
import { fromMaybe } from "./util/maybe.mjs";
import { createState, getState, stepState } from "./impure/state.mjs";
import { initialize, isDone, step } from "./step.mjs";
import {
  createStream,
  readStream,
  writeStream,
  endStream,
} from "./impure/stream.mjs";
import { log } from "./impure/log.mjs";
import { cookPlugin } from "./plugin.mjs";
import { throwError } from "./impure/error.mjs";

/** @type {(action: Action, plugin: {lint: Lint, link:Link, test:Test}) => Promise<Result>} */
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
        () => `Successfully tested ${action.specifier}`,
        (failure) => `Testing failure on ${action.specifier}: ${failure}`,
        inner
      )
    );
    return { type: "test", inner };
  } else {
    throw new Error("invalid stage");
  }
};

/**
 * @type {(
 *   state: State<Graph>,
 *   stream: Stream<Action>,
 *   plugin: { lint: Lint, link: Link, test: Test}
 * ) => Promise<void>}
 */
const fork = async (state, stream, plugins) =>
  fromMaybe(
    async () => undefined,
    async (action) => {
      await fromEither(
        throwError,
        async (actions) => {
          await Promise.all(
            actions.map((action) => writeStream(stream, action))
          );
        },
        await stepState(state, step, {
          specifier: action.specifier,
          result: await performAction(action, plugins),
        })
      );
      if (isDone(await getState(state))) {
        await endStream(stream);
      }
    },
    await readStream(stream)
  );

/** @typedef {number | string} Concurrency */

/** @type {(concurrency: Concurrency) => Either<Error, number>} */
const evalConcurrency = (concurrency) => {
  if (typeof concurrency === "number") {
    if (Math.round(concurrency) !== concurrency) {
      return makeLeft(new Error("Concurrency must be an integer"));
    } else if (concurrency > cpus().length) {
      return makeLeft(new Error("It does not make sense to have more workers than CPUs."));
    } else if (concurrency < 1) {
      return makeLeft(new Error("Concurrency must be at least 1"));
    } else {
      return makeRight(concurrency);
    }
  } else if (typeof concurrency === "string") {
    if (/^[0-9]+%$/.test(concurrency)) {
      const percentage = parseInt(concurrency.slice(0, -1));
      if (percentage > 100) {
        return makeLeft(new Error(
          "It does not make sense to have more workers than CPUs."
        ));
      } else {
        return makeRight(Math.round((percentage / 100) * cpus().length));
      }
    } else {
      return makeLeft(new Error(
        "Invalid concurrency format, expected a percentage -- eg: 50%"
      ));
    }
  } else {
    throw new Error("invalid concurrency type");
  }
};

/**
 * @type {(
 *   specifiers: Set<Specifier>,
 *   plugin: Plugin,
 *   options: { concurrency: Concurrency, cache: URL }
 * ) => Promise<Either<Error, void>>}
 */
export default async (specifiers, plugin, { concurrency, cache }) => {
  const state = createState(initialize(specifiers));
  const stream = createStream();
  return bindRightAsync(
    evalConcurrency(concurrency),
    async (concurrency) => await bindRightAsync(
      bindRight(
        await catchEitherAsync(readFile(cache, "utf8")),
        (content) => catchEither(() => /** @type {json} */ (JSON.parse(content))),
      ),
      async (json) => await bindRightAsync(
        await cookPlugin(plugin, json),
        async ({save, ...plugin}) => {
          await Promise.all(
            new Array(concurrency).fill(null).map(() => fork(state, stream, plugin))
          );
          await writeFile(JSON.stringify(await save()), "utf8");
          return makeRight(undefined);
        },
      ),
    ),
  );
};

