/** @type {(specifier: String) => string} */
export const associateTest = (specifier) => {
  if (specifier.endsWith(".mjs")) {
    return `${specifier.substring(0, specifier.length - 4)}.test.mjs`;
  } else {
    throw new Error("invalid specifier extension");
  }
};
