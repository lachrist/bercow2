import { bindRight, fromEither, makeLeft, makeRight } from "./either.mjs";
import { getMapStrict } from "./map.mjs";
import { findMaybe, fromMaybe, makeJust, nothing } from "./maybe.mjs";

/** @type {(node: Node, result: Result) => Either<Message, Node>} */
const updateNode = ({ specifier, status, hash, dependencies }, {stage, inner: result}) => {
  if (status.type !== "pending") {
    return makeLeft("expected pending status");
  } else if (status.stage !== stage) {
    return makeLeft("result stage mismatch");
  } else {
    if (stage === "digest") {
      return makeRight(fromEither(
        (message) => /** @type Node */ ({status: {type: "failure", stage: "digest", message }, specifier, hash: nothing, dependencies}),
        (hash) => /** @type Node */ ({status: {type: "success", stage: "digest" }, hash: makeJust(hash), dependencies}),
        result,
      ));
    } else if (stage === "link") {
      return makeRight(fromEither(
        (message) => /** @type Node */ ({status: {type: "failure", stage: "link"}, hash, dependencies: nothing}),
        (dependencies) => /** @type Node */ ({status: {type: "success", stage: "link"}, hash, dependencies: makeJust(dependencies)}),
        result,
      ));
    } else if (stage === "validate") {
      return makeRight(fromEither(
        (message) => /** @type Node */ ({status: {type: "failure", stage: "validate"}, hash, dependencies}),
        (_null) => /** @type Node */ ({status: {type: "success", stage: "validate"}, hash, dependencies}),
        result,
      ));
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

/** @type {(nodes: Node[]) => (specifier: Specifier) => Specifier[]} */
const compileCollectUpstream = (nodes) => {
  const upstream = new Map();
  for (const node of nodes) {
    const { dependencies } = node;
    for (const dependency of fromMaybe(() => new Set(), (set) => set, dependencies)) {
      if (upstream.has(dependency)) {
        upstream.get(dependency).add(node);
      } else {
        upstream.set(dependency, new Set([node]));
      }
    }
  }
  return (specifier) => upstream.get(specifier);
};

/** @type {(nodes: Node[], breadth: Set<Specifier>) => Set<Specifier>} */
const collectImpact = (nodes, breadth) => {
  const collectUpstream = compileCollectUpstream(nodes);
  const impact = new Set(breadth);
  while (breadth.size > 0) {
    const next_breadth = new Set();
    for (const specifier of breadth) {
      for (const upstream of collectUpstream(specifier)) {
        if (!impact.has(upstream)) {
          next_breadth.add(upstream);
          impact.add(upstream);
        }
      }
    }
    breadth = next_breadth;
  }
  return impact;
};

/** @type {(node: Node) => [Specifier, Node]} */
const toNodeEntry = (node) => [node.specifier, node];

/** @type {(nodes: Node[], node: Node) => Node[]} */
const propagateFailure = (nodes, node) => {
  const { specifier: cause } = node;
  const impact = collectImpact(nodes, new Set([cause]));
  impact.delete(cause);
  const mapping = new Map(nodes.map(toNodeEntry));
  for (const specifier of impact) {
    mapping.set(specifier, impactNode(getMapStrict(mapping, specifier), cause));
  }
  mapping.set(cause, node);
  return [...mapping.values()];
};

/** @type {(current: State, node: Node) => Either<Message, {next:State, actions:Action[]}>} */
const stepDigest = (current, node) => "TODO";

/** @type {(current: State, node: Node) => Either<Message, {next:State, actions:Action[]}>} */
const stepLink = (current, node) => "TODO";

/** @type {(current: State, node: Node) => Either<Message, {next:State, actions:Action[]}>} */
const stepValidate = (current, node) => "TODO";

/** @type {step} */
export const step = ({nodes, graph}, specifier, result) => bindRight(
  fromMaybe(
    () => makeLeft(`missing node specifier ${specifier}`),
    (node) => makeRight(node),
    findMaybe(nodes, (node) => node.specifier === specifier),
  ),
  (node) => bindRight(
    updateNode(node, result),
    (node) => {
      if (node.status.type === "failure") {
        return makeRight({
          next: {
            nodes: propagateFailure(nodes, node),
            graph,
          },
          actions: [],
        });
      } else if (node.status.type === "success") {
        if (node.status.stage === "digest") {
          return stepDigest({nodes, graph}, node);
        } else if (node.status.stage === "link") {
          return stepLink({nodes, graph}, node);
        } else if (node.status.stage === "validate") {
          return stepValidate({nodes, graph}, node);
        } else {
          throw new Error("invalid node stage");
        }
      } else {
        throw new Error("invalid node status after resolution");
      }
    },
);

