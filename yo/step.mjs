import {
  addComponent,
  collectReachable,
  compileCollectSuccessor,
} from "./graph.mjs";
import { bindRight, fromEither, makeLeft, makeRight } from "./either.mjs";
import { fromMaybe, makeJust, nothing } from "./maybe.mjs";
import { flip } from "./pair.mjs";

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

/** @type {(node: Node, cause: Specifier) => Node} */
const impactNode = (node, cause) => {
  const { status } = node;
  if (status.type === "success" && status.stage === "link") {
    return {
      ...node,
      status: {
        type: "impact",
        causes: new Set([cause]),
      },
    };
  } else if (status.type === "impact") {
    return {
      ...node,
      status: {
        type: "impact",
        causes: new Set([...status.causes, cause]),
      },
    };
  } else {
    throw new Error("only success link graph can be impacted");
  }
};

// /** @type {(node: Node) => [Specifier, Set<Specifier>]} */
// const toNodeTopologySet = (node) => [
//   node.specifier,
//   collectNodeDependencySet(node),
// ];

// /** @type {(node: Node) => [Specifier, Specifier[]]} */
// const toNodeTopologyArray = (node) => [
//   node.specifier,
//   collectNodeDependencyArray(node),
// ];

/** @type {(entry: [Specifier, Node]) => [Specifier, Specifier][]} */
const collectNodeEntryEdge = ([specifier, { dependencies }]) =>
  [...dependencies].map((dependency) => [specifier, dependency]);

/** @type {(graph: Graph, cause: Specifier) => Graph} */
const propagateFailure = (graph, cause) =>
  new Map([
    ...graph,
    ...[
      ...collectReachable(
        compileCollectSuccessor(
          [...graph].flatMap(collectNodeEntryEdge).map(flip)
        ),
        new Set([cause])
      ),
    ].map(
      (specifier) =>
        /** @type {NodeEntry} */ ([
          specifier,
          impactNode(graph.get(specifier) ?? TODO_NODE, cause),
        ])
    ),
  ]);

/** @type {Node} */
const TODO_NODE = {
  status: { type: "todo" },
  hash: nothing,
  dependencies: new Set(),
};

/** @typedef {[Specifier, Node]} NodeEntry */

/** @type {(graph: Graph, component: Set<Specifier>) => boolean} */
const isComponentReady = (graph, component) =>
  [...component].every((specifier) => {
    if (graph.has(specifier)) {
      const node = /** @type {Node} */ (graph.get(specifier));
      return (
        node.status.type === "done" ||
        (component.has(specifier) &&
          node.status.type === "success" &&
          node.status.stage === "link")
      );
    } else {
      return false;
    }
  });

/** @type {(state: State, entry: NodeEntry) => Output} */
const stepNode = ({ graph, components }, [specifier, node]) => {
  if (node.status.type === "failure") {
    return makeRight({
      state: {
        graph: new Map([
          ...propagateFailure(graph, specifier),
          [specifier, node],
        ]),
        components,
      },
      actions: [],
    });
  } else if (node.status.type === "success") {
    if (node.status.stage === "digest") {
      return makeRight({
        state: {
          graph: new Map([
            ...graph,
            [
              specifier,
              {
                ...node,
                status: { type: "pending", stage: "link" },
              },
            ],
          ]),
          components,
        },
        actions: [
          {
            type: "link",
            specifier,
          },
        ],
      });
    } else if (node.status.stage === "link") {
      const new_component_array = addComponent(
        (specifier) =>
          graph.has(specifier)
            ? /** @type {Node} */ (graph.get(specifier)).dependencies
            : new Set(),
        components,
        specifier
      );
      const causes = new Set(
        [...node.dependencies].flatMap((specifier) => {
          if (graph.has(specifier)) {
            const node = /** @type {Node} */ (graph.get(specifier));
            if (node.status.type === "failure") {
              return [specifier];
            } else if (node.status.type === "impact") {
              return [...node.status.causes];
            } else {
              return [];
            }
          } else {
            return [];
          }
        })
      );
      if (causes.size > 0) {
        return makeRight({
          state: {
            graph: new Map([
              ...graph,
              [
                specifier,
                {
                  ...node,
                  status: {
                    type: "impact",
                    causes,
                  },
                },
              ],
            ]),
            components: new_component_array,
          },
          actions: [],
        });
      } else {
        const component = /** @type {Set<Specifier>} */ (
          new_component_array.find((component) => component.has(specifier))
        );
        if (isComponentReady(graph, component)) {
          return makeRight({
            state: {
              graph: new Map(
                [...graph].map(([specifier, node]) => [
                  specifier,
                  component.has(specifier)
                    ? {
                        ...node,
                        status: { type: "pending", stage: "validate" },
                      }
                    : node,
                ])
              ),
              components: new_component_array,
            },
            actions: [{ type: "validate", component }],
          });
        } else {
          return makeRight({
            state: {
              graph: new Map([
                ...graph,
                [
                  specifier,
                  {
                    ...node,
                    status: { type: "success", stage: "link" },
                  },
                ],
              ]),
              components: new_component_array,
            },
            actions: [],
          });
        }
      }
    } else if (node.status.stage === "validate") {
      const new_graph = new Map([
        ...graph,
        [specifier, { ...node, status: { type: "done" } }],
      ]);
      const ready_component_array = components.filter((component) =>
        isComponentReady(new_graph, component)
      );
      const ready_specifier_array = new Set(
        ready_component_array.flatMap((component) => [...component])
      );
      return makeRight({
        state: {
          graph: new Map(
            [...new_graph].map(([specifier, node]) => [
              specifier,
              ready_specifier_array.has(specifier)
                ? { ...node, status: { type: "pending", stage: "validate" } }
                : node,
            ])
          ),
          components,
        },
        actions: ready_component_array.map((component) => ({
          type: "validate",
          component,
        })),
      });
    } else {
      throw new Error("unexpected stage type after success");
    }
  } else {
    throw new Error("unexpected status type after result");
  }
};

/** @type {step} */
export const step = ({ state: { graph, components }, specifier, result }) =>
  bindRight(
    fromMaybe(
      () => makeLeft(`missing node specifier ${specifier}`),
      makeRight,
      graph.has(specifier) ? makeJust(graph.get(specifier)) : nothing
    ),
    (node) =>
      bindRight(updateNode(node, result), (node) =>
        stepNode({ graph, components }, [specifier, node])
      )
  );
