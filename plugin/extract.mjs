import { readFile } from "node:fs/promises";
// @ts-ignore
import { parse } from "@babel/parser";

/** @typedef {any} Node */

/** @type {(node: Node) => Target[]} */
const collectTarget = (node) => {
  // console.log(node);
  if (node.type === "ImportDeclaration") {
    return [node.source.value];
  } else if (node.type === "ExportNamedDeclaration" && node.source !== null) {
    return [node.source.value];
  } else if (node.type === "ExportAllDeclaration") {
    return [node.source.value];
  } else {
    return [];
  }
};

/** @type {ExtractPlugin} */
export default async (specifier) => {
  const node = parse(await readFile(new URL(specifier), "utf8"), {
    sourceType: "module",
    ecmaVersion: 2022,
  });
  // console.dir(node);
  return new Set(
    node.program.body.flatMap(collectTarget)
  );
};
