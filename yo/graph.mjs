import { toArray } from "./collection.mjs";

/**
 * @template N
 * @param {Iterable<[N, Set<N>]>} entries
 * @returns {(node: N) => Set<N>}
*/
export const compileCollectSuccessorSet = (entries) => {
  const mapping = new Map(entries);
  return (node) => mapping.get(node) ?? new Set();
};

/**
 * @template N
 * @param {Iterable<[N, N[]]>} entries
 * @returns {(node: N) => N[]}
*/
export const compileCollectSuccessorArray = (entries) => {
  const mapping = new Map(entries);
  return (node) => mapping.get(node) ?? [];
};

/**
 * @template N
 * @param {Iterable<[N, Iterable<N>]>} entries
 * @returns {(node: N) => Set<N>}
 */
export const compileCollectPredecessorSet = (entries) => {
  const predecessors = new Map();
  for (const [origin, successors] of entries) {
    for (const successor of successors) {
      if (predecessors.has(successor)) {
        predecessors.get(successor).add(origin);
      } else {
        predecessors.set(successor, new Set([origin]));
      }
    }
  }
  return (node) => predecessors.get(node) ?? new Set();
};

/**
 * @template N
 * @param {(node: N) => Iterable<N>} collectSuccessor
 * @param {Iterable<N>} nodes
 * @returns {Set<N>}
 */
export const collectReachable = (collectSuccessor, nodes) => {
  const result = new Set();
  const queue = [...nodes];
  while (queue.length > 0) {
    const node = /** @type {N} */ (queue.pop());
    if (!result.has(node)) {
      result.add(node);
      queue.push(...collectSuccessor(node));
    }
  }
  return result;
};

/**
 * @template N
 * @param {(node: N) => N[]} collectSuccessor
 * @param {N} current
 * @param {N} target
 * @returns {N[]}
 */
export const collectCycle = (collectSuccessor, current, target) => {
  if (current === target) {
    return [current];
  } else {
    const component = collectSuccessor(current).flatMap((next) =>
      collectCycle(collectSuccessor, next, target)
    );
    if (component.length > 0) {
      return [current, ...component];
    } else {
      return [];
    }
  }
};

/**
 * @template N
 * @param {(node: N) => N[]} collectSuccessor
 * @param {Set<N>[]} components
 * @param {N} target
 * @returns {Set<N>[]}
 */
export const addComponent = (collectSuccessor, components, target) => {
  const { length } = components;
  /** @type {(node: N) => number} */
  const findComponentIndex = (node) =>
    node === target
      ? length
      : components.findIndex((component) => component.has(node));
  const arrays = components.map(toArray);
  /** @type {(index: number) => number[]} */
  const collectComponentSuccessor = (index) =>
    index === -1
      ? []
      : [
          ...new Set(
            arrays[index].flatMap(collectSuccessor).map(findComponentIndex)
          ),
        ];
  const collapse = new Set(
    collectSuccessor(target)
      .map(findComponentIndex)
      .flatMap((index) =>
        collectCycle(collectComponentSuccessor, index, length)
      )
  );
  return [
    ...components.filter((_component, index) => !collapse.has(index)),
    new Set([...[...collapse].flatMap((index) => arrays[index]), target]),
  ];
};
