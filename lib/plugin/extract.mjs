// @ts-ignore
import { parse } from "@babel/parser";
import { catchEither, mapEither } from "../util/either.mjs";

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

/** @type {(node: Node) => Target[]} */
const collectContent = ({ program: { body: nodes } }) =>
  nodes.flatMap(collectTarget);

/** @type {ExtractPlugin} */
export default async (specifier) =>
  catchEitherAsync()

  async (specifier, hash) =>
    mapEither(
      String,
      collectContent,
      catchEither(() => parse(content, options))
    );
