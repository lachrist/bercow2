// @ts-ignore
import { parse } from "@babel/parser";
import { makeLeft, makeRight, mapRight } from "./util/index.mjs";

/** @typedef {any} Node */

/** @type {(content: String, options: Object) => Either<Message, Node>} */
const parseEither = (content, options) => {
  try {
    return makeRight(parse(content, options));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return makeLeft(error.message);
    } else {
      throw error;
    }
  }
};

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

/** @type {(node: Node) => Set<Target>} */
const collectContent = ({ program: { body: nodes } }) => new Set(nodes.flatMap(collectTarget));

/** @type {(content: String, options: Object) => Either<Message, Set<Target>>} */
export default (content, options) => mapRight(
  collectContent,
  parseEither(content, options),
);
