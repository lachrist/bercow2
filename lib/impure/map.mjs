
export const insert = (map, key, val) => {
  const copy = new Map(map);
  copy.set(key, val);
  return copy;
};
