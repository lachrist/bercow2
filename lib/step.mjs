import { fromEither, makeRight } from "./either.mjs";
import { fromMaybe, makeJust, nothing } from "./maybe.mjs";

/** @type {(node: Node, result: Result) => Node} */
const updateNode = ({ stage, specifier, status, hash, dependencies }, {type, inner: result}) => {
  if (type !== stage) {
    throw new Error("stage mismatch");
  } else if (status.type !== "pending") {
    throw new Error("expected pending status");
  } else {
    if (type === "digest") {
      return fromEither(
        (message) => /** @type Node */ ({stage: "digest", status: {type: "failure", message }, hash: nothing, dependencies}),
        (hash) => /** @type Node */ ({stage: "digest", status: {type:"success"}, hash: makeJust(hash), dependencies}),
        result,
      );
    } else if (type === "link") {
      return fromEither(
        (message) => /** @type Node */ ({stage: "link", status: {type: "failure", message }, hash, dependencies: nothing}),
        (dependencies) => /** @type Node */ ({stage: "link", status: {type:"success"}, hash, dependencies: makeJust(dependencies)}),
        result,
      );
    } else if (type === "validate") {
      return (fromEither(
        (message) => /** @type Node */ ({stage: "validate", status: {type: "failure", message }, hash, dependencies}),
        (_null) => /** @type Node */ ({stage: "validate", status: {type:"success"}, hash, dependencies}),
        result,
      ));
    } else {
      throw new Error("invalid result type");
    }
  }
};

/** @type {(nodes: Node[], breadth: Set<Specifier>) => Set<Specifier>} */
export const impact = (nodes, breadth) => {
  const mapping = new Map();
  for (const { specifier, dependencies } of nodes) {
    for (const dependency of fromMaybe(() => new Set(), (set) => set, dependencies)) {
      if (mapping.has(dependency)) {
        /** @type Set<Specifier> */ (mapping.get(dependency)).add(specifier);
      } else {
        mapping.set(dependency, new Set(specifier));
      }
    }
  }
  const visited = new Set(breadth);
  while (breadth.size > 0) {
    const next_breadth = new Set();
    for (const specifier of breadth) {
      for (const dependent of mapping.get(specifier)) {
        if (!visited.has(dependent)) {
          visited.add(dependent);
          next_breadth.add(dependent);
        }
      }
    }
    breadth = next_breadth;
  }
  return visited;
};

export const findValidate =

/** @type {(current: State, node) => State} */
export const propagateFailure = (current, node) => {
  const mapping = new Map(current.map((node) => [node.specifier, node]));
  for (const specifier of impact(current, new Set([node.specifier]))) {

  }
  const tranposed = new Map(current);
};

/** @type {(current: State, specifier: Specifier, result:LinkResult, cache: State) => {next:State, actions:Actions[]}} */
const stepLink = (current, specifier, result, cache) => {
  const status = get(current, specifier);
  if (status.type !== "link-pending") {
    throw new Error("expected digest-pending status");
  } else {
    return fromEither(
      (message) => ({
        next: propagateFailure(current, specifier, {type: "link-failure", hash: status.hash, message}),
        actions: [],
      }),
      (dependencies) => {
        if (dependendencies.every((dependency) => {
          const dependency_status = current.get(dependency);
          return dependency_status !== undefined && dependency_status.type === "validate-success";
        })) {
          // TODO reachability cache analysis
          return {
            next: new Map([
              ...current,
              [specifier, {type: "validate-pending", hash: status.hash, dependencies}],
            ]),
            actions: [{type: "validate", specifier}],
          };
        } else {
          const additions = dependencies.filter((specifier) => !current.has(specifier));
          return {
            next: new Map([
              ...current,
              ...additions.map((specifier) => [specifier, {type: "digest-pending"}]),
              [specifier, {type: "link-success", hash: status.hash, dependencies}]
            ]),
            actions: additions.map((specifier) => ({type: "digest", specifier})),
          };
        },
      }
      result,
    );
  }
};

/** @type {(current: State, specifier: Specifier, result:DigestResult, cache: Cache) => {next:State, actions:Action[]}} */
export const stepDigest = (current, specifier, result, cache) => {
  const status = get(current, specifier);
  if (status.type !== "digest-pending") {
    throw new Error("expected digest-pending status");
  } else {
    return fromEither(
      (message) => ({
        next: propagateFailure(current, {specifier, stage: "digest", status: {}type: "digest-failure", message}),
        actions: [],
      }),
      (hash) => {
        const next = insert(
          current,
          specifier,
          {type: "link-pending", hash},
        );
        const past = cache.get(specifier);
        if (past !== undefined && "hash" in past && hash === past.hash && "dependencies" in past) {
          return step(next, {type: "link", specifier, result: makeRight(cache_node.dependencies)}, cache);
        } else {
          return {next, actions: [{type: "link", specifier}]};
        }
      },
      result,
    );
  }
};

/** @type {step} */
export const step = (current, resolution, cache) => {
  if (resolution.type === "digest") {
    return stepDigest(current, resolution.specifier, resolution.result, cache);
  } else if (resolution.type === "link") {
    return stepLink(current, resolution.specifier, resolution.result, cache);
  } else if (resolution.type === "validate") {
    return stepValidate(current, resolution.specifier, resolution.result, cache);
  } else {
    throw new Error("invalid resiolution type");
  }
};
