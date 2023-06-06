import { cpus } from "node:os";
import { fromEither, makeLeft, makeRight } from "./either.mjs";
import { fromMaybe } from "./maybe.mjs";
import { getState, makeState, stepState } from "./state.mjs";
import { initialize, isDone, step } from "./step.mjs";
import { endStream, makeStream, readStream, writeStream } from "./stream.mjs";

/** @type {(message: string) => Promise<void>} */
const log = async (message) => {
  process.stdout.write(`${message}\n`);
};

/** @type {(action: Action, plugin: Plugin) => Promise<Result>} */
const performAction = async (action, plugins) => {
  if (action.stage === "digest") {
    return {
      stage: "digest",
      inner: await plugins.digest(action.specifier),
    };
  } else if (action.stage === "link") {
    return {
      stage: "link",
      inner: await plugins.link(action.specifier),
    };
  } else if (action.stage === "validate") {
    await log(`Validating ${action.specifier}...\n`);
    const inner = await plugins.validate(action.specifier);
    await log(
      fromEither(
        (failure) => `Failed to validate ${action.specifier}: ${failure}`,
        (_success) => `Successfully validated ${action.specifier}`,
        inner,
      ),
    );
    return { stage: "validate", inner };
  } else {
    throw new Error("invalid stage");
  }
};

/** @type {(pair: {state: Graph, input: {specifier: Specifier, result: Result}}) => {state: Graph, output: Action[]}} */
const stepMain = ({state: graph, input: {specifier, result}}) => fromEither(
  (failure) => {
    throw new Error(failure);
  },
  ({graph, actions }) => ({
    state: graph,
    output: actions,
  }),
  step({graph, specifier, result}),
);

/** @type {(state: State<Graph>, stream: Stream<Action>, plugin: Plugin) => Promise<void>} */
const fork = async (state, stream, plugins) => fromMaybe(
  async () => undefined,
  async (action) => {
    const actions = await stepState(state, stepMain, {
      specifier: action.specifier,
      result: await performAction(action, plugins),
    });
    await Promise.all(actions.map((action) => writeStream(stream, action)));
    if (isDone(await getState(state))) {
      await endStream(stream);
    }
  },
  await readStream(stream),
);

/** @typedef {number | string} Concurrency */

/** @type {(concurrency: Concurrency) => Either<string, number>} */
const evalConcurrency = (concurrency) => {
  if (typeof concurrency === "number") {
    if (Math.round(concurrency) !== concurrency) {
      return makeLeft("Concurrency must be an integer");
    } else if (concurrency > cpus().length) {
      return makeLeft("It does not make sense to have more workers than CPUs.");
    } else if (concurrency < 1) {
      return makeLeft("Concurrency must be at least 1");
    } else {
      return makeRight(concurrency);
    }
  } else if (typeof concurrency === "string") {
    if (/^[0-9]+%$/.test(concurrency)) {
      const percentage = parseInt(concurrency.slice(0, -1));
      if (percentage > 100) {
        return makeLeft("It does not make sense to have more workers than CPUs.");
      } else {
        return makeRight(Math.round((percentage / 100) * cpus().length));
      }
    } else {
      return makeLeft("Invalid concurrency format, expected a percentage -- eg: 50%");
    }
  } else {
    throw new Error("invalid concurrency type");
  }
};

/** @type {(specifiers: Set<Specifier>, plugin: Plugin, options: {concurrency:Concurrency}) => Promise<void>} */
export const main = async (specifiers, plugin, { concurrency }) => {
  const state = makeState(initialize(specifiers));
  const stream = makeStream();
  await fromEither(
    log,
    async (concurrency) => {
      await Promise.all(new Array(concurrency).fill(null).map(() => fork(state, stream, plugin)));
      await log(`Done ${JSON.stringify(await getState(state), null, 2)}`);
    },
    evalConcurrency(concurrency),
  );
};
