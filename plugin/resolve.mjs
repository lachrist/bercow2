/** @type {ResolvePlugin} */
export default async (target, specifier) => {
  if (target.startsWith("./") || target.startsWith("../")) {
    return new Set([new URL(target, specifier).href]);
  } else {
    return new Set();
  }
};
