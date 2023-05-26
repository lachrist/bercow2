
import { digest } from "./digest.mjs";

/** @typedef {import("./type.mjs").Plugin} Plugin */
/** @typedef {import("./type.mjs").Configuration} Configuration */

/** @typedef {import("./type.mjs").Digest} Digest */
/** @typedef {import("./type.mjs").Link} Link */
/** @typedef {import("./type.mjs").Resolve} Resolve */
/** @typedef {import("./type.mjs").Validate} Validate */

/** @type {function(function | Plugin): Promise<function>} */
const loadPlugin = async (plugin) => {
  if (typeof plugin === "function") {
    return plugin;
  } else {
    const { module, options } = plugin;
    return await (await import(module)).default(options);
  }
};

/** @type {function(Configuration):Promise<{fetch: Fetch, link: Link, resolve: Resolve, test: Test }>} */
const loadAllPlugin = async (configuration) => {
  const [fetch, link, resolve, test] = await Promise.all(
    ["fetch", "link", "resolve", "test"].map(loadPlugin(configuration[name])),
  );
  return { fetch, link, resolve, test };
};

/** @type {function(string, string): string} */
const keyOf = (url, hash) => `${url}#${hash}`;

/** @type {function(Map<string, string[]>, File, any): Promise<string[]>} */
const loadDependencyAsync = async (cache, { url, content, hash }, {link, resolveAsync}) => {
  const key = keyOf(url, hash);
  if (cache.has(key)) {
    return /** @type {string[]} */ (cache.get(key));
  } else {
    const specifiers = link({ url, content });
    const requests = specifiers.map((specifier) => ({ specifier, base: url }));
    return await Promise.all(requests.map(resolveAsync));
  }
};

/** @type {function(string, Map<string, string[]>, any): Promise<Signature>} */
const loadSignatureAsync = async (url, cache, { fetchAsync, ...rest}) => {
  const content = await fetchAsync(url);
  const hash = digest(content, {});
  const dependencies = await loadDependencyAsync(cache, { url, content, hash }, rest);
  return { url, hash, dependencies };
};

const loadAllSignatureAsync = async (url, done, plugins) => {
  if (done.has(url)) {
    return [];
  } else {
    done.add(url);
    const summary = await loadSummaryAsync(url, plugins);
    const { dependencies } = summary;
    return [
      summary,
      ...await Promise.all(dependencies.map(({ url }) => loadAllSummaryAsync(url, done, plugins))),
    ];
  }
};

/**
 * @param {string[]} urls
 * @param {Configuration} configuration
 * @return {Promise<void>} void
 */
export default (urls, plugins) => {
  const done = new Set();
  return (await Promise.all(urls.map((url) => loadAllSummaryAsync(url, done, plugins)))).flat();
};


