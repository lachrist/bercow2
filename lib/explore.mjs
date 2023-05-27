import { get } from "http";
import { concatAllEdge } from "./graph.mjs";
import { getFirst, getSecond, isNotNull, pairup, setSecond } from "./util.mjs";

/**
 * @typedef {import("./type.mjs").Specifier} Specifier
 *
 * @typedef {import("./type.mjs").Hash} Hash
 *
 * @typedef {import("./graph.mjs").Graph<Specifier>} Graph
 *
 * @typedef {import("./type.mjs").Link} Link
 *
 * @typedef {import("./type.mjs").Resolve} Resolve
 *
 * @typedef {{ type: "cache"; hash: Hash }} CacheStatus
 *
 * @typedef {{ type: "todo" }} TodoStatus
 *
 * @typedef {{ type: "done" }} DoneStatus
 *
 * @typedef {{ type: "error"; name: string; message: string }} ErrorStatus
 *
 * @typedef {CacheStatus | TodoStatus | DoneStatus | ErrorStatus} Status
 *
 * @typedef {import("./util.mjs").Pair<Specifier, Status>} Label
 *
 * @typedef {{ type: "success"; dependencies: Specifier[] }} SuccessOutcome
 *
 * @typedef {{ type: "failure"; name: string; message: string }} FailureOutcome
 *
 * @typedef {SuccessOutcome | FailureOutcome} Outcome
 *
 * @typedef {{ origin: Specifier; outcome: Outcome }} Result
 *
 * @typedef {{ graph: Graph; labels: Label[] }} State
 *
 * @typedef {{ link: Link; resolve: Resolve }} Plugin
 */

/** @type {Status} */
const TODO = { type: "todo" };

/** @type {Status} */
const DONE = { type: "done" };

/** @type {function(State, Result): State} */
const updateState = ({ graph, labels }, { origin, outcome }) => {
  if (outcome.type === "success") {
    const { dependencies } = outcome;
    return {
      graph: concatAllEdge(
        graph,
        dependencies.map((dependency) => pairup(origin, dependency))
      ),
      labels: [
        ...labels.map((label) =>
          getFirst(label) === origin ? setSecond(label, DONE) : label
        ),
        ...dependencies
          .filter(
            (dependency) =>
              !labels.some((label) => getFirst(label) === dependency)
          )
          .map((dependency) => pairup(dependency, TODO)),
      ],
    };
  } else if (outcome.type === "failure") {
    const { name, message } = outcome;
    return {
      graph,
      labels: labels.map((label) =>
        getFirst(label) === origin
          ? setSecond(label, { type: "error", name, message })
          : label
      ),
    };
  } else {
    throw new Error("unexpected outcome type");
  }
};

/** @type {function(Specifier, {link:Link, resolve:Resolve}): Promise<Outcome>} */
const request = async (specifier, { link, resolve }) => {
  try {
    return {
      type: "success",
      dependencies: /** @type {Specifier[]} */ (
        await Promise.all(
          (
            await link(specifier)
          ).map((target) => resolve({ origin: specifier, target }))
        )
      ).filter(isNotNull),
    };
  } catch (error) {
    if (error instanceof Error && error.name.toLowerCase().includes("bercow")) {
      return {
        type: "failure",
        name: error.name,
        message: error.message,
      };
    } else {
      throw error;
    }
  }
};

/** @type {function(Label): boolean} */
const isTodoLabel = (label) => getSecond(label).type === "todo";

/** @type {function(State, { link: Link, resolve: Resolve }): Promise<State>} */
const loop = async (state, plugin) => {
  const specifiers = state.labels.filter(isTodoLabel).map(getFirst);
  if (specifiers.length === 0) {
    return state;
  } else {
    return loop(
      (
        await Promise.all(
          specifiers.map(async (specifier) => ({
            origin: specifier,
            outcome: await request(specifier, plugin),
          }))
        )
      ).reduce(updateState, state),
      plugin
    );
  }
};

/** @type {function(Pair<Specifier, Hash>): Label} */
const convertLabel = (label) => setSecond(label, {type: "cache", hash: getSecond(label)});

const convert = ({graph, labels}) => ({
  graph,
  labels: labels.map(convertLabel)
});

/** @type {function(State, Specifier[]): State} */
const addRoot = ({graph, labels}, specifiers) => ({
  graph,
  labels: [
    ...labels,
    ... specifiers
      .filter((specifier) => labels.every((label) => getFirst(label) !== specifier))
      .map((specifier) => pairup(specifier, TODO)),
  ],
});

const finalize = (state) => null;

/** @type {function(State): {graph:Graph, labels:(Hash|null)[]}} */
export const explore = (graph, specifiers, plugins) => finalize(
  addRoot(convert(graph), psieci
);


