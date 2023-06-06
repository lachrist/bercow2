import { toArray } from "./util/collection.mjs";

/**
 * @template N
 * @param {[N, N][]} edges
 * @returns {(node: N) => Set<N>}
 */
export const compileCollectSuccessor = (edges) => {
  const mapping = new Map();
  for (const [origin, successor] of edges) {
    if (mapping.has(origin)) {
      mapping.get(origin).add(successor);
    } else {
      mapping.set(origin, new Set([successor]));
    }
  }
  return (node) => mapping.get(node) ?? new Set();
};

/**
 * @template N
 * @param {(node: N) => Set<N>} collectSuccessor
 * @param {Set<N>} nodes
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
 * @param {(node: N) => Set<N>} collectSuccessor
 * @param {N} current
 * @param {N} target
 * @returns {N[]}
 */
const collectCycle = (collectSuccessor, current, target) => {
  if (current === target) {
    return [current];
  } else {
    const component = [...collectSuccessor(current)].flatMap((next) =>
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
 * @param {(node: N) => Set<N>} collectSuccessor
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
  /** @type {(index: number) => Set<number>} */
  const collectComponentSuccessor = (index) =>
    index === -1
      ? new Set()
      : new Set(
          arrays[index]
            .map(collectSuccessor)
            .map(toArray)
            .flat()
            .map(findComponentIndex)
        );
  const collapse = new Set(
    [...collectSuccessor(target)]
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
