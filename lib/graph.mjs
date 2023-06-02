import { applyFirst, flip, isNotPairIdentify } from "./pair.mjs";
import { partialX_, partial_X } from "./partial.mjs";
import { lookup } from "./assoc.mjs";

////////////
// Number //
////////////

/**
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export const cantorPairing = (x, y) => ((x + y) * (x + y + 1)) / 2 + y;

//////////
// Edge //
//////////

/**
 * @template N
 * @param {Edge<N>} edge
 * @param {(node: N) => boolean} predicate
 * @returns Boolean
 */
const doesBothNodeEdgeSatisfy = ([origin, destination], predicate) =>
  predicate(origin) && predicate(destination);

/** @type {(edge: Edge<number>) => number} */
const hashNumberEdge = ([origin, destination]) =>
  cantorPairing(origin, destination);

/**
 * @template N
 * @param {(edge: Edge<N>) => string | number} hashing
 * @param {Edge<N>} edge
 * @returns {[string | number, Edge<N>]}
 */
const hashEdge = (hashing, edge) => [hashing(edge), edge];

//////////////
// Topology //
//////////////

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @param {Set<N>} breadth
 * @param {Set<N>} visited
 * @returns {Set<N>}
*/
export const nextBreadth = (edges, breadth, visited) => {
  const next_breadth = new Set();
  for (const [origin, destination] of edges) {
    if (breadth.has(origin) && !visited.has(destination)) {
      next_breadth.add(destination);
    }
  }
  return next_breadth;
};

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @returns {Edge<N>[]}
 */
const removeDuplicateEdgeSlow = (edges) => {
  const mapping = new Map();
  const result = [];
  for (const edge of edges) {
    const [origin, destination] = edge;
    if (mapping.has(origin)) {
      const destinations = mapping.get(origin);
      if (!destinations.has(destination)) {
        destinations.add(destination);
        result.push(edge);
      }
    } else {
      mapping.set(origin, new Set([destination]));
      result.push(edge);
    }
  }
  return result;
};

/**
 * @template N
 * @param {(edge: Edge<N>) => string | number} hashing
 * @param {Edge<N>[]} edges
 * @returns {Edge<N>[]}
 */
const removeDuplicateEdge = (hashing, edges) => [
  ...new Map(edges.map(partialX_(hashEdge, hashing))).values(),
];

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @param {Set<N>} breadth
 * @returns {Set<N>}
 */
const reach = (edges, breadth) => {
  const visited = new Set(breadth);
  while (breadth.size > 0) {
    breadth = nextBreadth(edges, breadth, visited);
    for (const node of breadth) {
      visited.add(node);
    }
  }
  return visited;
};

///////////
// Graph //
///////////

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @returns {LabelEntry<N, L>[]}
 */
export const collectLabelEntry = ({ labels }) => labels;

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {N} target
 * @returns {Maybe<L>}
*/
export const lookupLabel = ({labels}, target) => lookup(labels, target);

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @returns {Graph<N, L>}
 */
export const transpose = ({ edges, labels }) => ({
  edges: edges.map(flip),
  labels,
});

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @returns {Graph<N, L>}
 */
export const removeSelfLoop = ({ edges, labels }) => ({
  edges: edges.filter(isNotPairIdentify),
  labels,
});

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {(node: N) => boolean} predicate
 * @returns {Graph<N, L>}
 */
export const filterNode = ({ edges, labels }, predicate) => ({
  edges: edges.filter(partial_X(doesBothNodeEdgeSatisfy, predicate)),
  labels: labels.filter(partial_X(applyFirst, predicate)),
});

/**
 * @template N, L1, L2
 * @param {Graph<N, L1>} graph
 * @param {(entry: LabelEntry<N, L1>) => L2} transform
 * @returns {Graph<N, L2>}
 */
export const mapLabelEntry = ({ edges, labels }, transform) => ({
  edges,
  labels: labels.map((label) => [label[0], transform(label)]),
});

/**
 * @template N, L1, L2
 * @param {Graph<N, L1>} graph
 * @param {(label: L1) => L2} transform
 * @returns {Graph<N, L2>}
 */
export const mapLabel = ({ edges, labels }, transform) => ({
  edges,
  labels: labels.map(([node, label]) => [node, transform(label)]),
});

/**
 * @template N, L
 * @param {Graph<N, Promise<L>>} graph
 * @returns {Promise<Graph<N, L>>}
 */
export const runGraph = async ({ edges, labels }) => ({
  edges,
  labels: await Promise.all(
    labels.map(async ([node, promise]) => [node, await promise])
  ),
});

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {Edge<N>[]} additional_edge_array
 * @returns {Graph<N, L>}
 */
export const addAllEdge = ({ edges, labels }, additional_edge_array) => ({
  edges: removeDuplicateEdgeSlow([...edges, ...additional_edge_array]),
  labels,
});

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {LabelEntry<N, L>[]} entries
 * @returns {Graph<N, L>}
 */
export const addAllNode = ({ edges, labels }, entries) => ({
  edges,
  labels: [...new Map([...labels, ...entries])],
});

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {LabelEntry<N, L>[]} entries
 * @returns {Graph<N, L>}
 */
export const addAllMissingNode = ({ edges, labels }, entries) => ({
  edges,
  labels: [...new Map([...entries, ...labels])],
});

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {Set<N>} breadth
 * @param {Set<N>} visited
 * @returns {Set<N>}
 */
export const collectNextBreadth = ({ edges }, breadth, visited) =>
  nextBreadth(edges, breadth, visited);

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {Set<N>} breadth
 * @returns {Set<N>}
 */
export const collectReachableNode = ({ edges }, breadth) =>
  reach(edges, breadth);

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @returns {Set<N>[]}
 */
export const collectStronglyConnectedComponent = ({ edges, labels }) => {
  const visited = new Set();
  const components = [];
  const trans_edge_array = edges.map(flip);
  for (const [node, _label] of labels) {
    if (!visited.has(node)) {
      const singleton = new Set([node]);
      const component = reach(edges, singleton);
      const backward = reach(trans_edge_array, singleton);
      for (const node of component) {
        if (!backward.has(node)) {
          component.delete(node);
        }
      }
      components.push(component);
    }
  }
  return components;
};

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @returns {Graph<number, [N, L][]>}
 */
export const condensate = ({ edges, labels }) => {
  const components = collectStronglyConnectedComponent({ edges, labels });
  const indexing = new Map(
    labels.map(([node, _label]) => [
      node,
      components.findIndex((component) => component.has(node)),
    ])
  );
  const labeling = new Map(labels);
  return {
    edges: removeDuplicateEdge(
      hashNumberEdge,
      edges.map(
        ([origin, destination]) =>
          /** @type {Edge<number>} */ ([
            indexing.get(origin),
            indexing.get(destination),
          ])
      )
    ),
    labels: components.map((component, index) => [
      index,
      [...component].map((node) => [
        node,
        /** @type {L} */ (labeling.get(node)),
      ]),
    ]),
  };
};
