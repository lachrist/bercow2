import { bindRight, makeLeft, makeRight, mapRight } from "./util/either.mjs";
import {
  fromJust,
  makeJust,
  mapJust,
  nothing,
  sequenceMaybe,
} from "./util/maybe.mjs";
import { getFirst, getSecond, pairup } from "./util/pair.mjs";
import { compareString } from "./util/string.mjs";
import { digest as digestInner } from "./impure/digest.mjs";

/** @typedef {[Specifier, Node]} NodeEntry */

/** @type {(content: string) => string} */
const digest = (content) =>
  digestInner(content, { algorithm: "sha256", input: "utf8", output: "hex" });

/** @type {(node: Node, result: Result) => Either<Error, Node>} */
const updateNode = ({ status, hash, dependencies }, result) => {
  if (status.type !== "pending") {
    return makeLeft(new Error("expected pending status"));
  } else if (status.stage !== result.stage) {
    return makeLeft(new Error("result stage mismatch"));
  } else {
    if (result.type === "success" && result.stage === "link") {
      return makeRight({
        status: result,
        hash: makeJust(result.hash),
        dependencies: result.dependencies,
      });
    } else {
      return makeRight({
        status: result,
        hash,
        dependencies,
      });
    }
  }
};

/** @type {(node: Node) => Specifier[]} */
const collectNodeDependency = ({ dependencies }) => [...dependencies];

/** @type {(specifier: Specifier) => NodeEntry} */
const makeTodoNodeEntry = (specifier) => [specifier, TODO_NODE];

/** @type {Node} */
const TODO_NODE = {
  status: { type: "todo" },
  hash: nothing,
  dependencies: new Set(),
};

/** @type {(graph: Graph) => graph} */
const fillGraph = (graph) =>
  new Map([
    ...graph,
    ...[...graph.values()]
      .flatMap(collectNodeDependency)
      .filter((dependency) => !graph.has(dependency))
      .map(makeTodoNodeEntry),
  ]);

/** @type {(graph: Graph) => graph} */
export const propagateFailure = (graph) => {
  const entries = [...graph].flatMap((entry) =>
    propagateFailureNodeEntry(entry, graph)
  );
  if (entries.length === 0) {
    return graph;
  } else {
    return propagateFailure(new Map([...graph, ...entries]));
  }
};

/** @type {(entry: NodeEntry, graph: Graph) => NodeEntry[]} */
const propagateFailureNodeEntry = ([specifier, node], graph) => {
  if (node.status.type === "success" && node.status.stage === "link") {
    if (
      [...node.dependencies].some(
        (dependency) =>
          graph.has(dependency) &&
          isFailureNode(/** @type {Node} */ (graph.get(dependency)))
      )
    ) {
      return [
        [specifier, { ...node, status: { type: "done", skipped: true } }],
      ];
    } else {
      return [];
    }
  } else {
    return [];
  }
};

/** @type {(node: Node) => boolean} */
const isFailureNode = ({ status }) =>
  status.type === "failure" || (status.type === "done" && status.skipped);

/**
 * @type {(
 *   specifier: Specifier,
 *   visited: Set<Specifier>,
 *   graph: Graph
 * ) => boolean}
 */
export const canNodeBeTested = (specifier, visited, graph) => {
  if (visited.has(specifier)) {
    return true;
  } else if (graph.has(specifier)) {
    const node = /** @type {Node} */ (graph.get(specifier));
    if (
      (node.status.type === "done" && !node.status.skipped) ||
      (node.status.type === "success" && node.status.stage === "test")
    ) {
      return true;
    } else if (node.status.type === "success" && node.status.stage === "link") {
      const new_visited = new Set([...visited, specifier]);
      return [...node.dependencies].every((dependency) =>
        canNodeBeTested(dependency, new_visited, graph)
      );
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/** @type {(graph: Graph) => { graph: Graph; actions: Action[] }} */
const scheduleAction = (graph) => {
  const pairs = [...graph].map((entry) =>
    scheduleNodeEntryAction(entry, graph)
  );
  return {
    graph: new Map(pairs.map(getFirst)),
    actions: pairs.flatMap(getSecond),
  };
};

/** @type {(specifier: Specifier, graph: Graph) => Set<Specifier>} */
export const collectDependencyDeep = (specifier, graph) => {
  const visited = new Set();
  const specifiers = [specifier];
  while (specifiers.length > 0) {
    const specifier = /** @type {Specifier} */ (specifiers.pop());
    if (!visited.has(specifier)) {
      visited.add(specifier);
      if (graph.has(specifier)) {
        specifiers.push(
          .../** @type {Node} */ (graph.get(specifier)).dependencies
        );
      }
    }
  }
  return visited;
};

/** @type {(specifier: Specifier, graph: Graph) => Maybe<Hash>} */
const hashDeep = (specifier, graph) =>
  mapJust(
    sequenceMaybe(
      [...collectDependencyDeep(specifier, graph)]
        .sort(compareString)
        .map((specifier) =>
          graph.has(specifier)
            ? /** @type {Node} */ (graph.get(specifier)).hash
            : nothing
        )
    ),
    // deterministic ordering and duplicate main specifier
    // to differentiate between the nodes of strongly connected
    // component.
    (hashes) => digest(JSON.stringify([specifier, ...hashes]))
  );

/** @type {(entry: NodeEntry, graph: Graph) => [NodeEntry, Action[]]} */
export const scheduleNodeEntryAction = ([specifier, node], graph) => {
  if (node.status.type === "todo") {
    return [
      [specifier, { ...node, status: { type: "pending", stage: "link" } }],
      [
        {
          type: "link",
          specifier,
        },
      ],
    ];
  } else if (node.status.type === "success") {
    if (node.status.stage === "link") {
      if (canNodeBeTested(specifier, new Set(), graph)) {
        return [
          [specifier, { ...node, status: { type: "pending", stage: "test" } }],
          [
            {
              type: "test",
              specifier,
              hash: fromJust(node.hash),
              deep: fromJust(hashDeep(specifier, graph)),
            },
          ],
        ];
      } else {
        return [[specifier, node], []];
      }
    } else if (node.status.stage === "test") {
      return [
        [specifier, { ...node, status: { type: "done", skipped: false } }],
        [],
      ];
    } else {
      throw new Error("invalid stage");
    }
  } else {
    return [[specifier, node], []];
  }
};

/**
 * @type {(
 *   graph: Graph,
 *   status: Status
 * ) => { graph: Graph; actions: Action[] }}
 */
const processNodeStatus = (graph, status) => {
  if (status.type === "failure" || status.type === "errored") {
    return {
      graph: propagateFailure(graph),
      actions: [],
    };
  } else if (status.type === "success") {
    if (status.stage === "link") {
      return scheduleAction(propagateFailure(fillGraph(graph)));
    } else if (status.stage === "test") {
      return scheduleAction(graph);
    } else {
      throw new Error("invalid stage");
    }
  } else {
    throw new Error("unexpected new node status type");
  }
};

/**
 * @type {(specifiers: Set<Specifier>) => {
 *   graph: Graph;
 *   actions: Action[];
 * }}
 */
export const initializeGraph = (specifiers) =>
  scheduleAction(new Map([...specifiers].map(makeTodoNodeEntry)));

/**
 * @type {(current: {
 *   graph: Graph;
 *   outcome: Outcome;
 * }) => Either<Error, { graph: Graph; actions: Action[] }>} }
 */
export const stepGraph = ({ graph, outcome: { specifier, result } }) =>
  bindRight(
    graph.has(specifier)
      ? makeRight(graph.get(specifier))
      : makeLeft(new Error(`missing node specifier ${specifier}`)),
    (node) =>
      mapRight(updateNode(node, result), (node) =>
        processNodeStatus(new Map([...graph, [specifier, node]]), node.status)
      )
  );

/** @type {(node: Node) => boolean} */
const isNodeDone = ({ status: { type } }) =>
  type === "done" || type === "failure" || type === "errored";

/** @type {(graph: Graph) => boolean} */
export const isGraphComplete = (graph) => [...graph.values()].every(isNodeDone);

////////////
// Export //
////////////

/** @type {(graph: Graph) => string} */
export const toDotFormat = (graph) => {
  const indexing = new Map([...graph.keys()].map(pairup));
  return [
    "digraph dependencies {",
    ...[...graph.keys()].map(
      (specifier) =>
        `  ${indexing.get(specifier)} [label=${JSON.stringify(specifier)}];`
    ),
    ...[...graph].flatMap(([specifier, { dependencies }]) =>
      [...dependencies].map(
        (dependdency) =>
          `  ${indexing.get(specifier)} -> ${indexing.get(dependdency)};`
      )
    ),
    "}",
    "",
  ].join("\n");
};
