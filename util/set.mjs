

/**
 * @template X
 * @param {Set<X>} set1
 * @param {Set<X>} set2
 * @return {Set<X>}
 */
export const intersect = (set1, set2) => {
  const set3 = new Set(set1);
  for (const element of set1) {
    if (!set2.has(element)) {
      set3.delete(element);
    }
  }
  return set3;
};

/**
 * @template X
 * @param {Set<X>} set1
 * @param {Set<X>} set2
 * @return {Set<X>}
 */
export const union = (set1, set2) => {
  const set3 = new Set(set1);
  for (const element of set2) {
    set3.add(element);
  }
  return set3;
};

/**
 * @template X
 * @param {Set<X>} set
 * @param {X} element
 * @return {Set<X>}
 */
export const add = (set, element) => {
  if (set.has(element)) {
    return set;
  } else {
    const new_set = new Set(set);
    new_set.add(element);
    return new_set;
  }
};

/**
 * @template X
 * @param {Set<X>} set
 * @param {X} element
 * @return {Set<X>}
 */
export const remove = (set, element) => {
  if (set.has(element)) {
    const new_set = new Set(set);
    new_set.delete(element);
    return new_set;
  } else {
    return set;
  }
};

/**
 * @template X
 * @param {Set<X>} set1
 * @param {Set<X>} set2
 * @return {Set<X>}
 */
export const removeAll = (set1, set2) => {
  const set3 = new Set(set1);
  for (const element of set2) {
    set3.delete(element);
  }
  return set3;
};

/**
 * @template X
 * @param {Set<X>} set
 * @param {X} element
 */
export const member = (set, element) => set.has(element);
