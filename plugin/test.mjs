import { spawn } from "child_process";

/** @type {(specifier: String) => string | Error} */
const getTest = (specifier) => {
  if (specifier.endsWith(".mjs")) {
    return `${specifier.substring(0, specifier.length - 4)}.test.mjs`;
  } else {
    return new Error("invalid specifier extension");
  }
};

/** @type {TestPlugin} */
export default async (specifier) => {
  const test = getTest(specifier);
  if (test instanceof Error) {
    return Promise.resolve(test);
  }
  return new Promise((resolve) => {
    const child = spawn("node", [test]);
    child.on("error", resolve);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        resolve(new Error(`test failure: ${code}`));
      }
    });
  });
};
