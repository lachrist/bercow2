import { collectReachable, removeAllNode } from "./graph.mjs";

/** @typedef {import("./type.mjs").Specifier} Specifier */
/** @typedef {import("./type.mjs").Content} Content */
/** @typedef {import("./type.mjs").Digest} Digest */
/** @typedef {import("./type.mjs").Hash} Hash */
/** @typedef {import("./graph.mjs").Graph<Specifier>} Graph */
/** @typedef {[Specifier, Hash]} Label */
/** @typedef {{ graph: Graph; labels: Label[] }} State */

/** @type {function(Label, Digest): Promise<Label>} */
const updateLabel = async ([specifier, _old_hash], digest) => [
  specifier,
  await digest(specifier),
];

/** @type {function(Label): Specifier} */
const getLabelSpecifier = ([specifier, _hash]) => specifier;

/** @type {function(Label, Map<Specifier, Hash>): boolean} */
const isLabelOutdated = ([specifier, hash], hashes) =>
  hash !== hashes.get(specifier);

/** @type {function(State, { digest: Digest }): Promise<State>} */
export const refresh = async ({ graph, labels }, { digest }) => {
  const hashes = new Map(
    await Promise.all(labels.map((label) => updateLabel(label, digest)))
  );
  const changes = new Set(
    labels
      .filter((label) => isLabelOutdated(label, hashes))
      .map(getLabelSpecifier)
  );
  const impact = collectReachable(changes, graph);
  return {
    graph: removeAllNode(graph, impact),
    labels: labels.filter(([specifier, _hash]) => !impact.has(specifier)),
  };
};
