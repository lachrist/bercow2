import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";
import { associateTest } from "./layout.mjs";

/** @type {TestPlugin} */
export default (specifier) => {
  const test = associateTest(specifier);
  return new Promise((resolve, reject) => {
    const child = spawn("node", [fileURLToPath(test)]);
    child.on("error", reject);
    /** @type {Buffer[]} */
    const buffers = [];
    child.stderr.on("data", (buffer) => {
      buffers.push(buffer);
    });
    child.on("exit", (code, signal) => {
      const stderr = Buffer.concat(buffers).toString("utf8");
      if (signal !== null) {
        resolve(`signal: ${signal} >> ${stderr}`);
      } else if (code !== 0) {
        resolve(
          `exit code: ${code} >> ${Buffer.concat(buffers).toString("utf8")}`
        );
      } else {
        return resolve(null);
      }
    });
  });
};
