import { fromEither } from "./either.mjs";
import { partialXX_, partialX_, partial_X } from "./partial.mjs";
import {
  collectLabelEntry,
  collectReachableNode,
  filterNode,
} from "./graph.mjs";
import { concatMaybe, makeJust, nothing } from "./maybe.mjs";

/** @typedef {Maybe<[Specifier, Message]>} Change */
/** @typedef {{ changes: Map<Specifier, Message>; impact: Set<Specifier> }} Report */

/** @type {(specifier: Specifier, message: Message) => Change} */
const makeChange = (specifier, message) => makeJust([specifier, message]);

/** @type {(specifier: Specifier, old_hash: Hash, new_hash: Hash) => Change} */
const checkChange = (specifier, old_hash, new_hash) =>
  old_hash === new_hash ? nothing : makeChange(specifier, "outdated");

/** @type {(entry: [Specifier, Hash], result: DigestResult) => Change} */
const diffLabelEntry = ([specifier, old_hash], either) =>
  fromEither(
    partialX_(makeChange, specifier),
    partialXX_(checkChange, specifier, old_hash),
    either
  );

/** @type {(digest: Digest, entry: [Specifier, Hash]) => Promise<Change>} */
const processLabelEntry = async (digest, [specifier, hash]) =>
  diffLabelEntry([specifier, hash], await digest(specifier));

/** @type {(node: Specifier, impact: Set<Specifier>) => boolean} */
const isNodeIntact = (node, impact) => !impact.has(node);

/**
 * @type {(
 *   graph: Graph<Specifier, Hash>,
 *   digest: Digest
 * ) => Promise<{ graph: Graph<Specifier, Hash>; report: Report }>}
 */
export default async (graph, digest) => {
  const changes = new Map(
    concatMaybe(
      await Promise.all(
        collectLabelEntry(graph).map(partialX_(processLabelEntry, digest))
      )
    )
  );
  const impact = collectReachableNode(graph, new Set(changes.keys()));
  return {
    graph: filterNode(graph, partial_X(isNodeIntact, impact)),
    report: { changes, impact },
  };
};
