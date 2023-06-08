import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";

/** @type {(specifier: String) => string} */
const getTest = (specifier) => {
  if (specifier.endsWith(".mjs")) {
    return `${specifier.substring(0, specifier.length - 4)}.test.mjs`;
  } else {
    throw new Error("invalid specifier extension");
  }
};

/** @type {TestPlugin} */
export default (specifier) => {
  const test = getTest(specifier);
  return new Promise((resolve, reject) => {
    const child = spawn("node", [test]);
    child.on("error", reject);
    /** @type {Buffer[]} */
    const buffers = [];
    child.stderr.on("data", (buffer) => {
      buffers.push(buffer);
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(
          new Error(
            `test failure: ${code} >> ${Buffer.concat(buffers).toString(
              "utf8"
            )}`
          )
        );
      }
    });
  });
};
