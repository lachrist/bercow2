import { addAllEdge, collectReachable, removeAllNode } from "./graph.mjs";
import { fromEither, fromMaybe, just, nothing } from "./util/index.mjs";

/** @typedef {Maybe<Hash>} Cache */

/** @typedef {{ type: "cache"; hash: Hash }} CacheStatus */
/** @typedef {{ type: "todo" }} TodoStatus */
/** @typedef {{ type: "success" }} SuccessStatus */
/** @typedef {{ type: "failure", message: Message }} FailureStatus */
/** @typedef {CacheStatus | TodoStatus | SuccessStatus | FailureStatus } Status */

/** @typedef {[Specifier, Status]} Label */

/** @typedef {Either<Message, Set<Specifier>>} Dependency */
/** @typedef {{origin: Specifier, dependency: Dependency}} Node */

/** @typedef {LabelGraph<Specifier, Status>} State */

/** @typedef {LabelGraph<Specifier, Cache>} ExternalState */

/** @typedef {{state: ExternalState, failures: Map<Specifier, Message>, impact: Set<Specifier>}} Output */

////////////
// Status //
////////////

/** @type {Status} */
const TODO = { type: "todo" };

/** @type {Status} */
const SUCCESS = { type: "success" };

/** @type {() => Status} */
const makeTodoStatus = () => TODO;

/** @type {(hash: Hash) => Status} */
const makeCacheStatus = (hash) => ({ type: "cache", hash });

/** @type {(message: Message) => Status} */
const makeFailureStatus = (message) => ({ type: "failure", message });

/** @type {(cache: Cache) => Status} */
const wrapSuccessStatus = (cache) => fromMaybe(
  makeTodoStatus,
  makeCacheStatus,
  cache,
);

/** @type {(status: Status) => Cache} */
const unwrapSuccessStatus = (status) => {
  if (status.type === "success") {
    return nothing;
  } else if (status.type === "cache") {
    return just(status.hash);
  } else {
    throw new Error("expected success status");
  }
};

/** @type {(status: Status) => Message} */
const unwrapFailureStatus = (status) => {
  if (status.type === "failure") {
    return status.message;
  } else {
    throw new Error("expected failure status");
  }
};

///////////
// Label //
///////////

/** @type {(label: Label) => boolean} */
const isTodoLabel = ([_specifier, { type }]) => type === "todo";

/** @type {(label: Label) => Specifier} */
const getLabelSpecifier = ([specifier, _status]) => specifier;

/** @type {(label: Label) => boolean} */
const isFailureLabel = ([_specifier, { type }]) => type === "failure";

/** @type {(label: Label) => [Specifier, Message]}  */
const unwrapFailureLabel = ([specifier, status]) => [specifier, unwrapFailureStatus(status)];

/** @type {(label: Label) => [Specifier, Maybe<Hash>]} */
const unwrapSuccessLabel = ([specifier, status]) => [specifier, unwrapSuccessStatus(status)];

/** @type {function([Specifier, Cache]): Label} */
const wrapSuccessLabel = ([specifier, cache]) => [specifier, wrapSuccessStatus(cache)];

//////////
// Body //
//////////

/** @type {function(State, Node): State} */
const updateState = ({ graph, labels }, { origin, dependency }) =>
  fromEither(
    (message) => {
      const copy = new Map(labels);
      copy.set(origin, makeFailureStatus(message));
      return { graph, labels: copy };
    },
    (destinations) => {
      const copy = new Map(labels);
      copy.set(origin, SUCCESS);
      for (const destination of destinations) {
        if (!copy.has(destination)) {
          copy.set(destination, TODO);
        }
      }
      return {
        graph: addAllEdge(
          graph,
          [... destinations].map((destination) => [origin, destination])
        ),
        labels: copy,
      };
    },
    dependency
  );

/** @type {(state: ExternalState) => State} */
const prepare = ({ graph, labels }) => ({
  graph,
  labels: new Map([...labels].map(wrapSuccessLabel)),
});

/** @type {(state: State, link: Link) => Promise<State>} */
const step = async (state, link) => {
  const labels = [...state.labels];
  if (labels.some(isTodoLabel)) {
    return state;
  } else {
    return step(
      (
        await Promise.all(
          labels.filter(isTodoLabel).map(async ([origin, _status]) => ({
            origin,
            dependency: await link(origin),
          }),
        ))
      ).reduce(updateState, state),
      link,
    );
  }
};

/** @type {(state: State) => Output} */
const finalize = ({ graph, labels }) => {
  const label_array = [...labels];
  const failures = label_array.filter(isFailureLabel);
  const impact = collectReachable(
    graph,
    new Set(failures.map(getLabelSpecifier)),
  );
  return {
    state: {
      graph: removeAllNode(graph, impact),
      labels: new Map(label_array
        .filter(([specifier, _status]) => !impact.has(specifier))
        .map(unwrapSuccessLabel),
      ),
    },
    failures: new Map(failures.map(unwrapFailureLabel)),
    impact,
  };
};

/** @type {(state: ExternalState, link: Link) => Promise<Output>} */
export const explore = async (state, link) => finalize(
  await step(prepare(state), link),
);
