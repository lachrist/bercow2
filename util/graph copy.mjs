import { partial_X } from "./partial.mjs";

/**
 * @template N
 * @typedef {[N, Set<N>]} Succ<N>
 */

/**
 * @template N
 * @typedef {[N, N]} Edge<N>
 */

/**
 * @template N
 * @param {Map<N, Set<N>>} topology
 * @param {N} origin
 * @return {Set<N>}
 */
export const collectSuccessor = (edges) => topology.get(origin) ?? new Set();

///////////////
// transpose //
///////////////

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @return {Graph<N, L>}
 */
export const transpose = ({ topology, labels }) => {
  const trans = new Map();
  for (const [origin, destinations] of topology) {
    for (const destination of destinations) {
      if (trans.has(destination)) {
        const origins = /** @type {Set<N>} */ (trans.get(destination));
        origins.add(origin);
      } else {
        trans.set(destination, new Set([origin]));
      }
    }
  }
  return { topology: trans, labels };
};

////////////////////
// removeSelfLoop //
////////////////////

/**
 * @template N
 * @param {Succ<N>} succ
 * @return {Succ<N>}
 */
const removeSelfSucc = (succ) => {
  const [origin, destinations] = succ;
  if (destinations.has(origin)) {
    const copy = new Set(destinations);
    copy.delete(origin);
    return [origin, copy];
  } else {
    return succ;
  }
};

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @return {Graph<N, L>}
 */
export const removeSelfLoop = ({ topology, labels }) => ({
  topology: new Map([...topology].map(removeSelfSucc)),
  labels,
});

/** @type {(edge: Edge) => boolean} */
const isNotSelfLoopEdge = [origin, destionation] => origin !== destionation;

export const removeSelfLoop = ({edges, labels}) => ({
  edges: edges.filter(isNotSelfLoopEdge),
  labels,
});

/////////////////
// filterGraph //
/////////////////

/**
 * @template X, Y
 * @param {[X, Y]} entry
 * @param {(x: X) => boolean} predicate
 * @return {boolean}
 */
const filterFirstEntry = ([first, _second], predicate) => predicate(first);

/**
 * @template N
 * @param {Succ<N>} succ
 * @param {(node: N) => boolean} predicate
 * @return {Succ<N>}
 */
const filterSucc = ([origin, destination], predicate) => [
  origin,
  new Set([...destination].filter(predicate)),
];

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {(node: N) => boolean} predicate
 * @return {Graph<N, L>}
 */
export const filterGraph = ({ topology, labels }, predicate) => ({
  topology: new Map(
    [...topology]
      .filter(partial_X(filterFirstEntry, predicate))
      .map(partial_X(filterSucc, predicate))
  ),
  labels: new Map([...labels].filter(partial_X(filterFirstEntry, predicate))),
});

/////////////
// addEdge //
/////////////

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {Edge<N>} edge
 * @return {Graph<N, L>}
 */
export const addEdge = ({ topology, labels }, [origin, destination]) => {
  if (topology.has(origin)) {
    const destinations = /** @type {Set<N>} */ (topology.get(origin));
    if (destinations.has(destination)) {
      return { topology, labels };
    } else {
      const new_destination_array = new Set(destinations);
      new_destination_array.add(destination);
      const new_topology = new Map(topology);
      new_topology.set(origin, new_destination_array);
      return { topology: new_topology, labels };
    }
  } else {
    const new_topology = new Map(topology);
    new_topology.set(origin, new Set([destination]));
    return { topology: new_topology, labels };
  }
};

////////////////
// addAllEdge //
////////////////

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {Edge<N>[]} edges
 * @return {Graph<N, L>}
 */
export const addAllEdge = ({ topology, labels }, edges) => {
  topology = new Map(topology);
  const copies = new Set();
  for (const [origin, destination] of edges) {
    if (topology.has(origin)) {
      const destinations = /** @type {Set<N>} */ (topology.get(origin));
      if (!destinations.has(destination)) {
        if (copies.has(origin)) {
          destinations.add(destination);
        } else {
          const copy = new Set(destinations);
          copy.add(destination);
          topology.set(origin, copy);
          copies.add(origin);
        }
      }
    } else {
      copies.add(origin);
      graph.set(origin, new Set([destination]));
    }
  }
  return { topology, labels };
};

/**
 * @template N
 * @param {Graph<N>} graph
 * @return {Set<N>}
 */
export const collectNode = (graph) => {
  const nodes = new Set(graph.keys());
  for (const destinations of graph.values()) {
    for (const destination of destinations) {
      nodes.add(destination);
    }
  }
  return nodes;
};

//////////////////////
// collectReachable //
//////////////////////

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @param {Set<N>} breadth
 * @return {Set<N>}
 */
export const collectReachable = ({topology}, breadth) => {
  const visited = new Set(breadth);
  while (breadth.size > 0) {
    const next_breadth = new Set();
    for (const node of breadth) {
      for (const destination of topology.get(node) ?? new Set()) {
        if (!visited.has(destination)) {
          next_breadth.add(destination);
        }
      }
    }
    breadth = next_breadth;
  }
  return visited;
};

///////////////////////////////////////
// collectStronglyConnectedComponent //
///////////////////////////////////////

/**
 * @template N, L
 * @param {Graph<N, L>} graph
 * @return {Set<N>[]}
 */
export const collectStronglyConnectedComponent = ({topology}) => {
  const visited = new Set();
  const components = [];
  const trans = transpose(graph);
  for (const node of collectNode(graph)) {
    if (!visited.has(node)) {
      const singleton = new Set([node]);
      const component = new Set(collectReachable(graph, singleton));
      const backward = collectReachable(trans, singleton);
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
 * @template N
 * @param {Graph<N>} graph
 * @return {{ graph: Graph<number>; labels: Map<number, Set<N>> }}
 */
export const condensate = (graph) => {
  const components = collectStronglyConnectedComponent(graph);
  /** @type {(node: N) => number} */
  const findComponentIndex = (node) =>
    components.findIndex((component) => component.has(node));
  const { length } = components;
  const cond_graph = new Map();
  const labels = new Map();
  for (let index = 0; index < length; index += 1) {
    const component = components[index];
    labels.set(index, component);
    const destinations = new Set();
    for (const origin of component) {
      for (const destination of collectSuccessor(graph, origin)) {
        destinations.add(destination);
      }
    }
    cond_graph.set(index, new Set([...destinations].map(findComponentIndex)));
  }
  return { graph: cond_graph, labels };
};
