import { createHash } from "crypto";
import {
  bindRight,
  fromEither,
  makeLeft,
  makeRight,
  mapRight,
} from "./util/either.mjs";
import {
  fromJust,
  fromMaybe,
  makeJust,
  mapMaybe,
  nothing,
  sequenceMaybe,
} from "./util/maybe.mjs";
import { getFirst, getSecond } from "./util/pair.mjs";
import { identity } from "./util/util.mjs";

/** @typedef {[Specifier, Node]} NodeEntry */

/** @type {(string1: string, string2: string) => number} */
const compareString = (string1, string2) => string1.localeCompare(string2);

/** @type {(input: String) => Hash} */
const digest = (string) => {
  const hash = createHash("sha256");
  hash.update(string);
  return hash.digest("hex");
};

/** @type {(node: Node, result: Result) => Either<Message, Node>} */
const updateNode = (
  { status, hash, dependencies },
  { stage, inner: result }
) => {
  if (status.type !== "pending") {
    return makeLeft("expected pending status");
  } else if (status.stage !== stage) {
    return makeLeft("result stage mismatch");
  } else {
    if (stage === "digest") {
      return makeRight(
        fromEither(
          (message) =>
            /** @type {Node} */ ({
              status: { type: "failure", stage: "digest", message },
              hash: nothing,
              dependencies,
            }),
          (hash) =>
            /** @type {Node} */ ({
              status: { type: "success", stage: "digest" },
              hash: makeJust(hash),
              dependencies,
            }),
          result
        )
      );
    } else if (stage === "link") {
      return makeRight(
        fromEither(
          (message) =>
            /** @type {Node} */ ({
              status: { type: "failure", stage: "link", message },
              hash,
              dependencies,
            }),
          (dependencies) =>
            /** @type {Node} */ ({
              status: { type: "success", stage: "link" },
              hash,
              dependencies,
            }),
          result
        )
      );
    } else if (stage === "validate") {
      return makeRight(
        fromEither(
          (message) =>
            /** @type {Node} */ ({
              status: { type: "failure", stage: "validate", message },
              hash,
              dependencies,
            }),
          (_null) =>
            /** @type {Node} */ ({
              status: { type: "success", stage: "validate" },
              hash,
              dependencies,
            }),
          result
        )
      );
    } else {
      throw new Error("invalid result type");
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
  if (node.status.type === "failure") {
    return [];
  } else {
    const causes = new Set(
      [...node.dependencies].flatMap((dependency) =>
        graph.has(dependency)
          ? collectNodeEntryCause([
              dependency,
              /** @type {Node} */ (graph.get(dependency)),
            ])
          : []
      )
    );
    if (
      node.status.type !== "impact" ||
      causes.size > node.status.causes.size
    ) {
      return [[specifier, { ...node, status: { type: "impact", causes } }]];
    } else {
      return [];
    }
  }
};

/** @type {(entry: NodeEntry) => Specifier[]} */
export const collectNodeEntryCause = ([specifier, node]) => {
  if (node.status.type === "failure") {
    return [specifier];
  } else if (node.status.type === "impact") {
    return [...node.status.causes];
  } else {
    return [];
  }
};

/**
 * @type {(
 *   specifier: Specifier,
 *   visited: Set<Specifier>,
 *   graph: Graph
 * ) => boolean}
 */
export const canNodeBeValidated = (specifier, visited, graph) => {
  if (visited.has(specifier)) {
    return true;
  } else if (graph.has(specifier)) {
    const node = /** @type {Node} */ (graph.get(specifier));
    if (
      node.status.type === "done" ||
      (node.status.type === "success" && node.status.stage === "validate")
    ) {
      return true;
    } else if (node.status.type === "success" && node.status.stage === "link") {
      const new_visited = new Set([...visited, specifier]);
      return [...node.dependencies].every((dependency) =>
        canNodeBeValidated(dependency, new_visited, graph)
      );
    } else {
      return false;
    }
  } else {
    return false;
  }
};

/** @type {(graph: Graph) => { state: Graph; output: Action[] }} */
const scheduleAction = (graph) => {
  const pairs = [...graph].map((entry) =>
    scheduleNodeEntryAction(entry, graph)
  );
  return {
    state: new Map(pairs.map(getFirst)),
    output: pairs.flatMap(getSecond),
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
  mapMaybe(
    digest,
    mapMaybe(
      JSON.stringify,
      sequenceMaybe(
        [...collectDependencyDeep(specifier, graph)]
          .sort(compareString)
          .map((specifier) =>
            graph.has(specifier)
              ? mapMaybe(
                  (hash) => [specifier, hash],
                  /** @type {Node} */ (graph.get(specifier)).hash
                )
              : nothing
          )
      )
    )
  );

/** @type {(entry: NodeEntry, graph: Graph) => [NodeEntry, Action[]]} */
export const scheduleNodeEntryAction = ([specifier, node], graph) => {
  if (node.status.type === "todo") {
    return [
      [specifier, { ...node, status: { type: "pending", stage: "digest" } }],
      [
        {
          stage: "digest",
          specifier,
        },
      ],
    ];
  } else if (node.status.type === "success") {
    if (node.status.stage === "digest") {
      return [
        [specifier, { ...node, status: { type: "pending", stage: "link" } }],
        [
          {
            stage: "link",
            specifier,
            hash: fromJust(node.hash),
          },
        ],
      ];
    } else if (node.status.stage === "link") {
      if (canNodeBeValidated(specifier, new Set(), graph)) {
        return [
          [
            specifier,
            { ...node, status: { type: "pending", stage: "validate" } },
          ],
          [
            {
              stage: "validate",
              specifier,
              hash: fromMaybe(
                () => {
                  throw new Error(
                    "when a node can be validated it should be deeply hashable"
                  );
                },
                identity,
                hashDeep(specifier, graph)
              ),
            },
          ],
        ];
      } else {
        return [[specifier, node], []];
      }
    } else if (node.status.stage === "validate") {
      return [[specifier, { ...node, status: { type: "done" } }], []];
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
 * ) => { state: Graph; output: Action[] }}
 */
const processNodeStatus = (graph, status) => {
  if (status.type === "failure") {
    return {
      state: propagateFailure(graph),
      output: [],
    };
  } else if (status.type === "success") {
    if (status.stage === "digest") {
      return scheduleAction(graph);
    } else if (status.stage === "link") {
      return scheduleAction(propagateFailure(fillGraph(graph)));
    } else if (status.stage === "validate") {
      return scheduleAction(graph);
    } else {
      throw new Error("invalid stage");
    }
  } else {
    throw new Error("unexpected new node status type");
  }
};

/** @type {(specifiers: Set<Specifier>) => Graph} */
export const initialize = (specifiers) =>
  new Map([...specifiers].map(makeTodoNodeEntry));

/** @type {(current: {state: Graph, input: {specifier: Specifier, result: Result}}) => Either<Message, {state: Graph, output: Action[]}>}} */
export const step = ({ state: graph, input: { specifier, result } }) =>
  bindRight(
    graph.has(specifier)
      ? makeRight(graph.get(specifier))
      : makeLeft(`missing node specifier ${specifier}`),
    (node) =>
      mapRight(
        (node) =>
          processNodeStatus(
            new Map([...graph, [specifier, node]]),
            node.status
          ),
        updateNode(node, result)
      )
  );

/** @type {(node: Node) => boolean} */
const isNodeDone = ({ status: { type } }) =>
  type === "done" || type === "failure" || type === "impact";

/** @type {(graph: Graph) => boolean} */
export const isDone = (graph) => [...graph.values()].every(isNodeDone);
