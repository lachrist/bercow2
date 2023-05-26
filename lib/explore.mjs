
/**
 * @typedef {[Specifier, Specifier]} Edge
 * @typedef {import("./type,js").Specifier} Specifier
 * @typedef { "todo" | "cache" } Status
 * @typedef {[Specifier, Status]} NewLabel
 * @typedef {{graph: Graph, labels: NewLabel[]}} NewState
 */

/** @type {function(Specifier, {link:Link, resolve:Resolve}): Promise<Edge[]>} */
const gaming = (specifier, { link, resolve }) => await Promise.all((await link(specifier)).map(async (target) => [
    specifier,
    await resolve({target, origin: specifier}),
  ]));
};

/** @type {function(NewState, { link: Link, resolve: Resolve }): Promise<NewState>} */
export const explore = async ({graph, labels}, { link, resolve }) => {
  const labels
    .filter(isLabelTodo)
    .map(([specifier, _status]) =>

  const graph = new Map();
  const labels = await Promise.all(
    specifiers.map(async (specifier) => {
      const url = await resolve(specifier);
      const dependencies = link(specifier);
      graph.set(specifier, dependencies);
      return [specifier, "missing"];
    })
  );
  return { graph, labels };
};

// /**
//  * @param {Url} url
//  * @return {Promise<[Url, Content]>}
//  */
// const readFileEntry = async (url) => [url, await readFile(new URL(url), "utf8")];

// /**
//  * @param {State} state
//  * @param {Url[]} urls
//  * @returns {Promise<State>}
//  */
// export const introduce = async ({ graph, labels }, urls) => {
//   const validated = new Set(labels.getLabelUrls());
//   const contents = new Map(urls
//     .filter((url1) => !labels.some(({ file: { url: url2 } }) => url1 === url2));
//     .map(readFileEntry)
//   );
//   return null;
// };
