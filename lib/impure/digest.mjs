import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** @typedef {import("node:crypto").Encoding} InputEncoding */
/** @typedef {import("node:crypto").BinaryToTextEncoding} OutputEncoding */
/**
 * @typedef {{
 *   algorithm: string;
 *   input: InputEncoding;
 *   output: OutputEncoding;
 * }} Options
 */

/** @type {(content: string, options: Options) => Hash} */
export const digest = (
  content,
  { algorithm = "sha256", input = "utf8", output = "hex" }
) => {
  const hashing = createHash(algorithm);
  hashing.update(content, input);
  return hashing.digest(output);
};

/** @type {(url: URL, options: Options) => Promise<Hash>} */
export const digestFile = (
  url,
  { algorithm = "sha256", input = "utf8", output = "hex" }
) =>
  new Promise((resolve, reject) => {
    const hashing = createHash(algorithm);
    hashing.write(url.href, input);
    const readable = createReadStream(url);
    readable.on("error", reject);
    hashing.on("error", reject);
    hashing.on("readable", () => {
      const data = hashing.read();
      if (data === null) {
        reject(new Error("missing readable data"));
      } else {
        resolve(data.toString(output));
      }
    });
  });
