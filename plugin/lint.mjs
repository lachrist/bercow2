import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
// @ts-ignore
import Prettier from "prettier";
import { ESLint } from "eslint";

const eslint = new ESLint();
const formatter = await eslint.loadFormatter("stylish");

/** @type {LintPlugin} */
export default async (specifier) => {
  const content = await readFile(new URL(specifier), "utf8");
  if (!Prettier.check(content, { filepath: fileURLToPath(specifier) })) {
    return `${specifier} is not formatted according to prettier`;
  } else {
    const results = await eslint.lintText(content, {
      filePath: fileURLToPath(specifier),
    });
    const report = await formatter.format(results);
    if (report !== "") {
      return report;
    }
  }
  return null;
};
