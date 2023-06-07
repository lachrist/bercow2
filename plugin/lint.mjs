import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
// @ts-ignore
import Prettier from "prettier";
import { ESLint } from "eslint";
import { catchErrorAsync } from "./util.mjs";

const eslint = new ESLint();
const formatter = await eslint.loadFormatter("stylish");

/** @type {LintPlugin} */
export default async (specifier) => {
  const content = await catchErrorAsync(readFile(new URL(specifier), "utf8"));
  if (content instanceof Error) {
    return content;
  }
  if (!Prettier.check(content)) {
    return new Error("prettier failure");
  }
  {
    const results = await eslint.lintText(content, {
      filePath: fileURLToPath(specifier),
    });
    const message = await formatter.format(results);
    if (message !== "") {
      return new Error(message);
    }
  }
};
