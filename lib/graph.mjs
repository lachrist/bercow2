import { cantorPairing, intersect } from "./util.mjs";

/**
 * @template N
 * @typedef {[N, N]} Edge<N>
 */

/**
 * @template N
 * @typedef {Edge<N>[]} Graph<N>
 */

//////////
// Edge //
//////////

// /**
//  * @template N
//  * @param {Edge<N>} edge
//  * @param {N} node
//  * @return {boolean}
//  */
// const isOutgoing = ([parent, _child], node) => parent === node;

/**
 * @template N
 * @param {Edge<N>} edge
 * @param {N} node
 * @return {boolean}
 */
const isIncoming = ([_parent, child], node) => child === node;

// /**
//  * @template N
//  * @param {Edge<N>} edge
//  * @return {N}
//  */
// const getSuccessor = ([_parent, child]) => child;

/**
 * @template N
 * @param {Edge<N>} edge
 * @return {N}
 */
const getPredecessor = ([parent, _child]) => parent;

// /**
//  * @template N
//  * @param {N} node
//  * @param {Edge<N>[]} edges
//  * @return {N[]}
//  */
// const collectSuccessor = (node, edges) =>
//   edges.filter((edge) => isOutgoing(edge, node)).map(getSuccessor);

/**
 * @template N
 * @param {N} node
 * @param {Edge<N>[]} edges
 * @return {N[]}
 */
const collectPredecessor = (node, edges) =>
  edges.filter((edge) => isIncoming(edge, node)).map(getPredecessor);

/**
 * @template N
 * @param {Edge<N>} edge
 * @return {Edge<N>} \
 */
const invert = ([parent, child]) => [child, parent];

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @return {N[]}
 */
const collectNode = (edges) => [...new Set(/** @type N[] */ (edges.flat()))];

/**
 * @template N
 * @param {Edge<N>} edge
 * @return {boolean}
 */
const isNotSelfLoop = ([parent, child]) => parent !== child;

//////////////////////////
// breadth first search //
//////////////////////////

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @param {Set<N>} visited
 * @return {N[]}
 */
export const nextBreadth = (edges, visited) =>
  collectNode(edges).filter(
    (node) =>
      !visited.has(node) &&
      collectPredecessor(node, edges).every((parent) =>
        visited.has(parent)
      )
  );

//////////////////
// reachability //
//////////////////

/**
 * @template N
 * @param {Set<N>} nodes
 * @param {Edge<N>[]} edges
 * @return {Set<N>}
 */
export const collectReachable = (nodes, edges) => {
  const visited = new Set(nodes);
  while (nodes.size > 0) {
    nodes = new Set(edges
      .filter(([parent, child]) => nodes.has(child) && !visited.has(parent))
      .map(([_parent, child]) => child),
    );
    for (const node of nodes) {
      visited.add(node);
    }
  }
  return visited;
};

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @return {Set<N>[]}
 */
export const collectStronglyConnectedComponent = (edges) => {
  const visited = new Set();
  const components = [];
  for (const node of collectNode(edges)) {
    if (!visited.has(node)) {
      const component = intersect(
        collectReachable(new Set([node]), edges),
        collectReachable(new Set([node]), edges.map(invert)),
      );
      for (const node of component) {
        visited.add(node);
      }
      components.push(component);
    }
  }
  return components;
};

////////////////
// condensate //
////////////////

/**
 * @param {Edge<number>} edge
 * @return {[number, Edge<number>]}
 */
const hashNumberEdge = (edge) => [cantorPairing(edge[0], edge[1]), edge];

/**
 * @template N
 * @param {Edge<N>} edge
 * @param {Set<N>[]} components
 * @return {Edge<number>}
 */
const condensateEdge = ([parent, child], components) => [
  components.findIndex((component) => component.has(parent)),
  components.findIndex((component) => component.has(child)),
];

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @return {{edges: Edge<number>[], labels: Map<number, Set<N>>}}
 */
export const condensate = (edges) => {
  const components = collectStronglyConnectedComponent(edges);
  return {
    edges: [
      ...new Map(
        edges
          .map((edge) => condensateEdge(edge, components))
          .map(hashNumberEdge)
      ).values(),
    ],
    labels: new Map(components.map((component, index) => [index, component])),
  };
};

////////////////////
// removeSelfLoop //
////////////////////

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @return {Edge<N>[]}
 */
export const removeSelfLoop = (edges) => edges.filter(isNotSelfLoop);

///////////////////
// removeAllNode //
///////////////////

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @param {Set<N>} nodes
 * @return {Edge<N>[]}
 */
export const removeAllNode = (edges, nodes) => edges.filter(
  ([parent, child]) => !nodes.has(parent) && !nodes.has(child),
);

////////////////////
// collectBreadth //
////////////////////

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @return {Set<N>[][]}
 */
export const collectBreadth = (edges) => {
  const { edges: cond_edge_array, labels } = condensate(edges);
  const acyclic_edge_array = removeSelfLoop(cond_edge_array);
  const breadths = [];
  const visited = new Set();
  let done = false;
  while (!done) {
    const indexes = nextBreadth(acyclic_edge_array, visited);
    if (indexes.length === 0) {
      done = true;
    } else {
      for (const index of indexes) {
        visited.add(index);
      }
      breadths.push(indexes.map((index) => /** @type {Set<N>} */ (labels.get(index))));
    }
  }
  return breadths;
};

////////////////
// concatEdge //
////////////////

/**
 * @template N
 * @param {Edge<N>[]} edges
 * @param {Edge<N>[]} additional_edge_array
 * @return {Edge<N>[]}
 */
export const concatAllEdge = (edges, additional_edge_array) => [
  ...edges,
  ...additional_edge_array,
];

