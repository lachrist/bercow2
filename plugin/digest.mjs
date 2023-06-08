import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { associateTest } from "./layout.mjs";

/** @type {(url: URL) => Promise<Hash>} */
const digestFile = (url) =>
  new Promise((resolve, reject) => {
    const hashing = createHash("sha256");
    hashing.on("error", reject);
    hashing.on("readable", () => {
      const data = hashing.read();
      if (data === null) {
        reject(new Error("missing readable data"));
      } else {
        resolve(data.toString("hex"));
      }
    });
    const readable = createReadStream(url);
    readable.on("error", reject);
    readable.pipe(hashing);
  });

/** @type {DigestPlugin} */
export default async (specifier) => {
  const hashing = createHash("sha256");
  const dump = [specifier];
  dump.push(await digestFile(new URL(specifier)));
  try {
    dump.push(await digestFile(new URL(associateTest(specifier))));
  } catch (_error) {
    // ignore
  }
  hashing.update(JSON.stringify(dump));
  return hashing.digest("hex");
};
