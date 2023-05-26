// @ts-ignore
import { parse } from "@babel/parser";
import { readFile } from "fs/promises";

/** @typedef {import("./type.mjs").Target} Target */
/** @typedef {import("./type.mjs").Specifier} Specifier */
/** @typedef {import("./type.mjs").Link} Link */

/** @type {function(any): Target[]} */
const collectNode = (node) => {
  if (node.type === "ImportStatement") {
    return [node.source.value];
  } else if (node.type === "ExportNamedDeclaration") {
    return [node.source.value];
  } else if (node.type === "ExportAllDeclaration") {
    return [node.source.value];
  } else {
    return [];
  }
};

/** @type {function(Specifier, string, Object): Target[]} */
const collectContent = (specifier, content, options) => {
  const { program: { body: nodes } } = parse(content, {
    ...options,
    sourceFilename: specifier,
  });
  return nodes.flatMap(collectNode);
};

/** @type {function(Object): Promise<Link>} */
export default async (options) => async (specifier) => collectContent(
  specifier,
  await readFile(new URL(specifier), "utf8"),
  options,
);
