import { mapMaybe, fromJust } from "./maybe.mjs";
import { makeRight, fromRight, fromLeft, bindRightAsync } from "./either.mjs";
import { fromMaybe } from "./maybe.mjs";

/** @typedef {Maybe<Hash>} Cache */
/** @typedef {[Specifier, Cache]} CacheEntry */
/** @typedef {Either<Message, Hash>} CacheEntryResult */
/** @typedef {Either<Message[], Component>} ComponentResult */
/** @typedef {CacheEntry[]} Component */
/** @typedef {Graph<Specifier, Cache>} InputGraph */
/** @typedef {Graph<Specifier, Hash>} OutputGraph */
/** @typedef {Graph<number, Component>} InternalGraph */

/** @type {(entry: CacheEntry) => Promise<Either<Message, Hash>>} */
export const stepCacheEntry = ([specifier, cache], { validate, digest }) => fromMaybe(
  async () => bindRightAsync(
    await validate(specifier),
    (_null) => digest(specifier),
  ),
  async (hash) => makeRight(hash),
  cache,
);

/** @type {(component: Component) => Promise<Either<Message, Hash>>} */
export const stepComponent = (entries, { validate, digest }) => fromMaybe(
  async () => bindRightAsync(
    await validate(specifier),
    (_null) => digest(specifier),
  ),
  async (hash) => makeRight(hash),
  cache,
);

export const stepComponent = async (graph, index) => {

  for (const component of lookupLabel(graph, index)) {
    const either = await stepNode(entry);
  }
};

/** @type {(graph: InternalGraph, visited: Set<number>) => {graph: InternalGraph, report: Map<Specifier, Failure>}} */
export const step = async (graph, visited) => {
  const breadth = collectNextBreath(graph, visited);
  if (breadth.size === 0) {
    return {graph, report: new Map()};
  } else {

  }
};

/** @type {(graph: ExternalGraph) => ExternalGrapgh} */
export default (graph) => "TODO";


