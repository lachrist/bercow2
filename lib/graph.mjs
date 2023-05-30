
/**
 * @template N
 * @param {Graph<N>} graph
 * @returns {Graph<N>}
 */
export const transpose = (graph) => {
  const trans = new Map();
  for (const [origin, destinations] of graph) {
    for (const destination of destinations) {
      if (trans.has(destination)) {
        const origins = /** @type {Set<N>} */ (trans.get(destination));
        origins.add(origin);
      } else {
        trans.set(destination, new Set([origin]));
      }
    }
  }
  return trans;
};

/**
 * @template N
 * @param {[N, Set<N>]} entry
 * @returns {[N, Set<N>]}
 */
const removeSelfEntry = (entry) => {
  const [origin, destinations] = entry;
  if (destinations.has(origin)) {
    const copy = new Set(destinations);
    copy.delete(origin);
    return [origin, copy];
  } else {
    return entry;
  }
};

/**
 * @template N
 * @param {Graph<N>} graph
 * @returns {Graph<N>}
 */
export const removeSelfLoop = (graph) =>
  new Map([...graph].map(removeSelfEntry));

/**
 * @template N
 * @param {Graph<N>} graph
 * @param {Set<N>} nodes
 * @returns {Graph<N>}
 */
export const removeAllNode = (graph, nodes) =>
  new Map(
    [...graph]
      .filter(([origin, _destinations]) => !nodes.has(origin))
      .map(([origin, destinations]) => [
        origin,
        new Set(
          [...destinations].filter((destination) => !nodes.has(destination))
        ),
      ])
  );

/**
 * @template N
 * @param {Graph<N>} graph
 * @param {[N, N][]} edges
 * @returns {Graph<N>}
 */
export const addAllEdge = (graph, edges) => {
  graph = new Map(graph);
  const copies = new Set();
  for (const [origin, destination] of edges) {
    if (graph.has(origin)) {
      const destinations = /** @type {Set<N>} */ (graph.get(origin));
      if (!destinations.has(destination)) {
        if (copies.has(origin)) {
          destinations.add(destination);
        } else {
          const copy = new Set(destinations);
          copy.add(destination);
          graph.set(origin, copy);
          copies.add(origin);
        }
      }
    } else {
      copies.add(origin);
      graph.set(origin, new Set([destination]));
    }
  }
  return graph;
};

/**
 * @template N
 * @param {Graph<N>} graph
 * @param {N} origin
 * @param {N} destination
 * @returns {Graph<N>}
 */
export const addEdge = (graph, origin, destination) => {
  if (graph.has(origin)) {
    const destinations = /** @type {Set<N>} */ (graph.get(origin));
    if (destinations.has(destination)) {
      return graph;
    } else {
      const new_destination_array = new Set(destinations);
      new_destination_array.add(destination);
      const new_graph = new Map(graph);
      new_graph.set(origin, new_destination_array);
      return new_graph;
    }
  } else {
    const new_graph = new Map(graph);
    new_graph.set(origin, new Set([destination]));
    return new_graph;
  }
};

/**
 * @template N
 * @param {Graph<N>} graph
 * @param {N} origin
 * @returns {Set<N>}
 */
export const collectSuccessor = (graph, origin) => {
  if (graph.has(origin)) {
    return /** @type {Set<N>} */ (graph.get(origin));
  } else {
    return new Set();
  }
};

/**
 * @template N
 * @param {Graph<N>} graph
 * @returns {Set<N>}
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

/**
 * @template N
 * @param {Graph<N>} graph
 * @param {Set<N>} nodes
 * @returns {Set<N>}
 */
export const collectReachable = (graph, nodes) => {
  const visited = new Set(nodes);
  while (nodes.size > 0) {
    const next = new Set();
    for (const node of nodes) {
      for (const destination of collectSuccessor(graph, node)) {
        if (!visited.has(destination)) {
          next.add(destination);
        }
      }
    }
    nodes = next;
  }
  return visited;
};

/**
 * @template N
 * @param {Graph<N>} graph
 * @returns {Set<N>[]}
 */
export const collectStronglyConnectedComponent = (graph) => {
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
 * @returns {{ graph: Graph<number>; labels: Map<number, Set<N>> }}
 */
export const condensate = (graph) => {
  const components = collectStronglyConnectedComponent(graph);
  /** @type {function(N): number} */
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
