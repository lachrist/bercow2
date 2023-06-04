import { getMapStrict, insertMap, transposeMap } from "./map.mjs";
import { getFirst } from "./pair.mjs";

/**
 * @template N
 * @typedef {{ counter: Index; partition: Partition<N> }} CounterPartition<N>
 */

/**
 * @template N
 * @param {CounterPartition<N>} counter_and_partition
 * @param {N[]} nodes
 * @returns {CounterPartition<N>}
 */
const addAllPartitionNode = ({ counter, partition }, nodes) => {
  if (nodes.every((node) => partition.has(node))) {
    return { counter, partition };
  } else {
    const copy = new Map(partition);
    for (const node of nodes) {
      if (!copy.has(node)) {
        copy.set(node, counter);
        counter += 1;
      }
    }
    return { counter, partition: copy };
  }
};

/**
 * @param {Topology} topology
 * @param {Index} current
 * @param {Index} target
 * @returns {Index[]}
 */
export const collectLoopBack = (topology, current, target) => {
  if (current === target) {
    return [current];
  } else {
    const component = (topology.get(current) ?? []).flatMap((next) =>
      collectLoopBack(topology, next, target)
    );
    if (component.length > 0) {
      return [current, ...component];
    } else {
      return [];
    }
  }
};

/**
 * @param {Topology} topology
 * @param {(index: Index) => Index} collapse
 * @returns {Topology}
 */
const collapseTopology = (topology, collapse) => {
  const result = new Map();
  for (const [origin, successors] of topology) {
    const new_origin = collapse(origin);
    const new_successor_array = successors.map(collapse);
    if (result.has(new_origin)) {
      result.get(new_origin).push(...new_successor_array);
    } else {
      result.set(new_origin, new_successor_array);
    }
  }
  for (const [key, val] of result) {
    result.set(key, [...new Set(val)]);
  }
  return result;
};

/**
 * @template N
 * @param {Partition<N>} partition
 * @param {(index: Index) => Index} collapse
 * @returns {Partition<N>}
 */
const collapsePartition = (partition, collapse) =>
  new Map([...partition].map(([node, index]) => [node, collapse(index)]));

/**
 * @template N
 * @param {ComponentGraph<N>} graph
 * @param {N} node
 * @param {N[]} children
 * @returns {ComponentGraph<N>}
 */
export const insertNode = (
  { counter, partition, topology },
  node,
  children
) => {
  const { counter: new_counter, partition: new_partition } =
    addAllPartitionNode({ counter, partition }, [node, ...children]);
  const index = getMapStrict(new_partition, node);
  if (topology.has(index)) {
    throw new Error("Cannot change a node's topology");
  } else {
    const successors = children.map((successor) =>
      getMapStrict(new_partition, successor)
    );
    const component = new Set(
      successors.flatMap((successor) =>
        collectLoopBack(topology, successor, index)
      )
    );
    if (component.size === 0) {
      return {
        counter: new_counter,
        partition: new_partition,
        topology: insertMap(topology, index, successors),
      };
    } else {
      /** @type {(index: Index) => Index} */
      const collapse = (index) => (component.has(index) ? new_counter : index);
      return {
        counter: new_counter + 1,
        partition: collapsePartition(new_partition, collapse),
        topology: collapseTopology(topology, collapse),
      };
    }
  }
};

/**
 * @template N
 * @param {Partition<N>} partition
 * @returns {(index: Index) => N[]}
 */
const compileGetComponent = (partition) => {
  const trans = transposeMap(partition);
  return (index) => getMapStrict(trans, index);
};

/**
 * @template N
 * @param {ComponentGraph<N>} graph
 * @param {(node: N) => boolean} predicate
 * @returns Node[][]
 */
export const filterComponent = ({ partition, topology }, predicate) => {
  const getComponent = compileGetComponent(partition);
  const visited = [];
  let breadth = [...topology]
    .filter(([_index, successors]) => successors.length === 0)
    .map(getFirst);
  while (breadth.length > 0) {
    visited.push(...breadth);
    breadth = breadth
      .flatMap((index) => getMapStrict(topology, index))
      .filter((index) => getComponent(index).every(predicate));
  }
  return visited.map(getComponent);
};
