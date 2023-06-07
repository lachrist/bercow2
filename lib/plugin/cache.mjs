import { readFile } from "node:fs/promises";
import { bindRight } from "../util/either.mjs";
import { hasMutMap } from "../impure/mut-map.mjs";

/**
 * @template X
 * @typedef {{
 *   handle: import("node:fs/promises").FileHandle;
 *   stringify: (value: X) => string;
 *   inner: MutMap<Hash, X>;
 * }} Cache<X>
 */

/**
 * @template X
 * @param {URL} url
 * @param {{ parse: (value: string) => X, stringify: (value: X) => string }} serializer
 * @returns {Promise<Either<Message, Cache<X>>}
*/
const openCache = async (url, { parse, stringify }, { encoding = "utf8"}) => bindRightAsync(
  await promiseEither(readFile(url, encoding)),
  async (content) => bindRight(
    (handle) => ({
      handle,
      stringify,
      inner: new Map(content.split
    })
    await open(url, "a"),
  )
    handle:
  }),
);

const cache = ({ inner, handle, stringify }, key, makeVal) =>
  cacheMutMap()

await fromMaybe(
  () => {
    const val = await makeVal();
    await handle.appendFile(`${key} >> ${stringify(val)}\n`);
    return val;
  },
  async (val) => val,
  await getMutMap(inner, key),
);

  if (await hasMutMap(inner, key)) {
    return getMcache.get(key);
  } else {
    const value = await makeValue();

  }
};
