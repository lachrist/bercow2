import {
  addComponent,
  collectReachable,
  compileCollectPredecessorSet,
  compileCollectSuccessorArray,
} from "./graph.mjs";
import { bindRight, fromEither, makeLeft, makeRight } from "./either.mjs";
import { findMaybe, fromMaybe, makeJust, nothing } from "./maybe.mjs";
import { constant, identity } from "./util.mjs";
import { getMapStrict } from "./map.mjs";
import { toSet } from "./collection.mjs";

/** @type {(node: Node, result: Result) => Either<Message, Node>} */
const updateNode = (
  { specifier, status, hash, dependencies },
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
              specifier,
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
              dependencies: nothing,
            }),
          (dependencies) =>
            /** @type {Node} */ ({
              status: { type: "success", stage: "link" },
              hash,
              dependencies: makeJust(dependencies),
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
        causes: [cause],
      },
    };
  } else if (status.type === "impact") {
    return {
      ...node,
      status: {
        type: "impact",
        causes: [...status.causes, cause],
      },
    };
  } else {
    throw new Error("only success link nodes can be impacted");
  }
};

/** @type {(node: Node) => Specifier[]} */
const collectNodeDependencyArray = ({ dependencies }) =>
  fromMaybe(constant([]), identity, dependencies);

/** @type {(node: Node) => Set<Specifier>} */
const collectNodeDependencySet = ({ dependencies }) =>
  fromMaybe(constant(new Set()), toSet, dependencies);

/** @type {(node: Node) => [Specifier, Node]} */
const toNodeEntry = (node) => [node.specifier, node];

/** @type {(node: Node) => [Specifier, Set<Specifier>]} */
const toNodeTopologySet = (node) => [
  node.specifier,
  collectNodeDependencySet(node),
];

/** @type {(node: Node) => [Specifier, Specifier[]]} */
const toNodeTopologyArray = (node) => [
  node.specifier,
  collectNodeDependencyArray(node),
];

/** @type {(nodes: Node[], cause: Specifier) => Node[]} */
const propagateFailure = (nodes, cause) => {
  const impact = collectReachable(
    compileCollectPredecessorSet(nodes.map(toNodeTopologyArray)),
    [cause]
  );
  return nodes.map((node) =>
    impact.has(node.specifier) ? impactNode(node, cause) : node
  );
};

/**
 * @type {(
 *   current: State,
 *   node: Node
 * ) => Either<Message, { next: State; actions: Action[] }>}
 */
const stepDigest = ({ nodes, components }, node) =>
  makeRight({
    next: {
      nodes: replaceNode(nodes, {
        ...node,
        status: { type: "pending", stage: "link" },
      }),
      components,
    },
    actions: [
      {
        type: "link",
        specifier: node.specifier,
      },
    ],
  });

/**
 * @template X
 * @param {{ specifier: X }} object
 * @returns {X}
 */
const getSpecifier = ({ specifier }) => specifier;

/** @type {(node: Node) => boolean} */
const isNodeFailure = ({ status: { type } }) =>
  type === "failure" || type === "impact";

/**
 * @type {(
 *   current: State,
 *   node: Node
 * ) => Either<Message, { next: State; actions: Action[] }>}
 */
const stepLink = ({ nodes, components }, node) => {
  const new_component_array = addComponent(
    compileCollectSuccessorArray(nodes.map(toNodeTopologyArray)),
    components,
    node.specifier
  );
  const mapping = new Map(nodes.map(toNodeEntry));
  const dependencies = collectNodeDependencyArray(node).map((specifier) =>
    getMapStrict(mapping, specifier)
  );
  if (dependencies.some(isNodeFailure)) {
    return makeRight({
      next: {
        nodes: replaceNode(nodes, {
          ...node,
          status: {
            type: "impact",
            causes: dependencies.filter(isNodeFailure).map(getSpecifier),
          },
        }),
        components: new_component_array,
      },
      actions: [],
    });
  } else {
    const component = /** @type {Set<Specifier>} */ (
      new_component_array.find((component) => component.has(node.specifier))
    );
    if (
      dependencies.every(
        (node) =>
          node.status.type === "todo" ||
          (node.status.type === "success" && node.status.stage === "link")
      )
    ) {
      return makeRight({
        next: {
          nodes: nodes.map((node) =>
            component.has(node.specifier)
              ? { ...node, status: { type: "pending", stage: "validate" } }
              : node
          ),
          components: new_component_array,
        },
        actions: [{ type: "validate", specifiers: [...component] }],
      });
    } else {
      return makeRight({
        next: {
          nodes: replaceNode(nodes, node),
          components: new_component_array,
        },
        actions: [],
      });
    }
  }
};

/**
 * @type {(
 *   current: State,
 *   node: Node
 * ) => Either<Message, { next: State; actions: Action[] }>}
 */
const stepValidate = ({node, components}, node) => {
  const specifiers = cu
};

/** @type {(nodes: Node[], node: Node) => Node[]} */
const replaceNode = (nodes, new_node) =>
  nodes.map((old_node) =>
    old_node.specifier === new_node.specifier ? new_node : old_node
  );

/** @type {step} */
export const step = ({ nodes, components }, specifier, result) =>
  bindRight(
    fromMaybe(
      () => makeLeft(`missing node specifier ${specifier}`),
      (node) => makeRight(node),
      findMaybe(nodes, (node) => node.specifier === specifier)
    ),
    (node) =>
      bindRight(updateNode(node, result), (node) => {
        if (node.status.type === "failure") {
          return makeRight({
            next: {
              nodes: replaceNode(propagateFailure(nodes, node.specifier), node),
              components,
            },
            actions: [],
          });
        } else if (node.status.type === "success") {
          if (node.status.stage === "digest") {
            return stepDigest({ nodes, components }, node);
          } else if (node.status.stage === "link") {
            return stepLink({ nodes, components }, node);
          } else if (node.status.stage === "validate") {
            return stepValidate({ nodes, components }, node);
          } else {
            throw new Error("invalid node stage");
          }
        } else {
          throw new Error("invalid node status after resolution");
        }
      })
  );
