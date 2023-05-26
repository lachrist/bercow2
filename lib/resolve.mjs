import { readdir, stat } from "node:fs/promises";
import { posix } from "node:path";

const { extname, basename } = posix;

/** @typedef {import("./type.mjs").Query} Query */
/** @typedef {import("./type.mjs").Answer} Answer */
/** @typedef {import("./type.mjs").Resolve} Resolve */

/** @type {function(Query): Promise<boolean>} */
const isDirectory = async ({target, origin}) => {
  try {
    return (await stat(new URL(target, origin))).isDirectory();
  } catch {
    return false;
  }
};

/** @type {function(Query): Promise<Answer>} */
const resolveExtensionLess = async ({target, origin}) => {
  const filenames = (await readdir(new URL("..", new URL(target, origin))))
    .filter((filename) => basename(filename) === basename(target));
  if (filenames.length === 1) {
    return {
      specifier: new URL(filenames[0], new URL(target, origin)).href,
      external: false,
    }
  } else {
    return {
      specifier: new URL(target, origin).href,
      external: false,
    };
  }
};

/** @type {function(Object): Promise<Resolve>} */
export default async (_options) => async ({target, origin}) => {
  if (target.startsWith("./") || target.startsWith("../")) {
    if (target.endsWith("/")) {
      return resolveExtensionLess({target: `${target}index`, origin});
    } else {
      if (extname(target) === "") {
        if (await isDirectory({target, origin})) {
          return resolveExtensionLess({target: `${target}/index`, origin});
        } else {
          return resolveExtensionLess({target, origin});
        }
      } else {
        return {
          specifier: new URL(target, origin).href,
          external: false,
        }
      }
    }
  } else {
    return {
      specifier: target,
      external: true,
    };
  }
};
