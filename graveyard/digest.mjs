import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** @type {(options: Object) => Promise<Digest>} */
export default async (_options) => (specifier) =>
  new Promise((resolve, reject) => {
    const hashing = createHash("sha256");
    const readable = createReadStream(new URL(specifier));
    readable.on("error", reject);
    hashing.on("error", reject);
    hashing.on("readable", () => {
      const data = hashing.read();
      if (data === null) {
        reject(new Error("missing readable data"));
      } else {
        resolve(data.toString("hex"));
      }
    });
  });
