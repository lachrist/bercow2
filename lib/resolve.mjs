import { readdir, stat } from "node:fs/promises";
import { posix } from "node:path";

const { extname, basename } = posix;

/** @typedef Cache  */

/** @type {Map<Specifier, boolean>} */
const cache = new Map();

export const cacheDirectory = async (directory) => {
  const filenames = await readdir(new URL(".", directory));
  for (const filename of filenames) {
    const url = new URL(filename, directory);
    presence.set(url, true);
  }
};

export const readExist = async (specifier) => {
  if (presence.has(specifier)) {
    return presence.get(specifier);
  } else {

    return presence.get(specifier);

    for (const filename of filenames) {


    }
  }
};

/** @type {(specifier : Specifier) => Promise<Kind>} */
const getKind = async (specifier) => {
  try {
    return (await stat(new URL(specifier))).isDirectory() ? "directory" : "file";
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return "missing";
    } else {
      throw error;
    }
  }
};

/** @type {(specifier: Specifier) => Promise<Kind>} */
const getKindCache = async (url) => {
  if (await cache.has(url)) {
    const kind = /** @type {Kind} */ (await cache.get(url));
    if (kind === "present") {
      const precise_kind = await getKind(url);
      await cache.set(url, precise_kind);
      return precise_kind;
    } else {
      return kind;
    }
  } else {
    const kind = await getKind(url);
    if (kind === "present")
    await cache.set(url, kind);
    return kind;
  }
};

/** @type {(specifier: Specifier) => Promise<string[]>} */
const readdirCache = async (specifier) => {
  const filenames = await readdir(new URL(specifier));
  for (const filename of filenames) {
    const { href: child_url } = new URL(filename, specifier);
    if (!await cache.has(child_url)) {
      await cache.set(child_url, "present");
    }
  }
  return filenames;
};

/** @type {function(Query): Promise<Answer>} */
const resolveExtensionLess = async ({origin, target}) => {
  const filenames = (await readdir(new URL("..", new URL(target, origin))))
    .filter((filename) => basename(filename) === basename(target));
  if (filenames.length === 1) {
    return new URL(filenames[0], new URL(target, origin)).href;
  } else {
    return new URL(target, origin).href;
  }
};

/** @type {(import_: Import) => Promise<Either<Message, Maybe<Specifier>>>} */
export const resolve = async ({target, origin}) => {
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
        return new URL(target, origin).href;
      }
    }
  } else {
    return makeRight(nothing);
  }
};
