import {
  addAllEdge,
  addAllMissingNode,
  addAllNode,
  collectLabelEntry,
  collectReachableNode,
  filterNode,
  mapLabel,
} from "./graph.mjs";
import { fromMaybe, makeJust, nothing } from "./maybe.mjs";
import { fromEither } from "./either.mjs";
import { getFirst, mapSecond } from "./pair.mjs";
import { partialX_ } from "./partial.mjs";

/** @typedef {Maybe<Status>} Label */
/** @typedef {[Specifier, Label]} LabelEntry */
/** @typedef {Boolean} Cached */

/** @typedef {{ origin: Specifier; dependency: LinkResult }} Node */
/** @typedef {Graph<Specifier, Cached>} InputGraph */
/** @typedef {Graph<Specifier, Label>} InternalGraph */
/** @typedef {Graph<Specifier, Status>} ExternalGraph */

/** @typedef {{ failures: Map<Specifier, Message>; impact: Set<Specifier> }} Report */
/** @typedef {{ graph: ExternalGraph; report: Report }} Output */

////////////
// Status //
////////////

const toInternalLabel = (cached) => chached ? makeJust({type: "success"})

/** @type {Status} */
const TODO = { type: "todo" };

/** @type {() => Status} */
const makeTodoStatus = () => TODO;

/** @type {(hash: Hash) => Status} */
const makeCacheStatus = (hash) => ({ type: "cache", hash });

/** @type {(message: Message) => Status} */
const makeFailureStatus = (message) => ({ type: "failure", message });

/** @type {(cache: Cache) => Status} */
const toStatus = (cache) =>
  fromMaybe(makeTodoStatus, makeCacheStatus, cache);

/** @type {(status: Status) => Cache} */
const fromSuccessStatus = (status) => {
  if (status.type === "success") {
    return nothing;
  } else if (status.type === "cache") {
    return makeJust(status.hash);
  } else {
    throw new Error("expected success status");
  }
};

/** @type {(status: Status) => Message} */
const fromFailureStatus = (status) => {
  if (status.type === "failure") {
    return status.message;
  } else {
    throw new Error("expected failure status");
  }
};

////////////////////////
// InternalLabelEntry //
////////////////////////

/** @type {(label: InternalLabelEntry) => boolean} */
const isTodoLabelEntry = ([_specifier, { type }]) => type === "todo";

/** @type {(label: InternalLabelEntry) => boolean} */
const isFailureLabelEntry = ([_specifier, { type }]) => type === "failure";

//////////
// Body //
//////////

/** @type {(graph: InternalGraph, node: Node) => InternalGraph} */
const updateGraph = (graph, { origin, dependency }) =>
  fromEither(
    (message) => addAllNode(graph, [[origin, makeFailureStatus(message)]]),
    (destinations) => addAllEdge(
      addAllMissingNode(graph, destinations.map((destination) => [destination, makeTodoStatus()])),
      destinations.map((destination) => [origin, destination]),
    ),
    dependency
  );

/** @type {(graph: ExternalGraph) => InternalGraph} */
const prepare = (graph) => mapLabel(graph, toStatus);

/** @type {(graph: InternalGraph, link: Link) => Promise<InternalGraph>} */
const step = async (graph, link) => {
  const entries = collectLabelEntry(graph);
  if (entries.some(isTodoLabelEntry)) {
    return step(
      (
        await Promise.all(
          entries.filter(isTodoLabelEntry).map(async ([origin, _status]) => ({
            origin,
            dependency: await link(origin),
          }))
        )
      ).reduce(updateGraph, graph),
      link
    );
  } else {
    return graph;
  }
};

/** @type {(graph: InternalGraph) => Output} */
const finalize = (graph) => {
  const failures = collectLabelEntry(graph).filter(isFailureLabelEntry);
  const impact = collectReachableNode(
    graph,
    new Set(failures.map(getFirst))
  );
  return {
    graph: mapLabel(
      filterNode(graph, (specifier) => !impact.has(specifier)),
      fromSuccessStatus,
    ),
    report: {
      failures: new Map(failures.map(partialX_(mapSecond, fromFailureStatus))),
      impact,
    },
  };
};

/** @type {(graph: ExternalGraph, link: Link) => Promise<Output>} */
export const explore = async (state, link) =>
  finalize(await step(prepare(state), link));
