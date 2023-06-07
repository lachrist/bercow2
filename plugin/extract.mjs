
// @ts-ignore
import { parse } from "@babel/parser";
import { readFile } from "node:fs/promises";
import { catchError, catchErrorAsync } from "./util.mjs";

/** @typedef {any} Node */

/** @type {(node: Node) => Target[]} */
const collectTarget = (node) => {
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

/** @type {ExtractPlugin} */
export default async (specifier) => {
  const content = await catchErrorAsync(readFile(new URL(specifier), "utf8"));
  if (content instanceof Error) {
    return content;
  }
  const node = catchError(() =>
    parse(content, { sourceType: "module", ecmaVersion: 2022 })
  );
  if (node instanceof Error) {
    return node;
  }
  return new Set(node.program.nodes.flatMap(collectTarget));
};
