import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** @type {DigestPlugin} */
export default (specifier) => new Promise((resolve) => {
  const hashing = createHash("sha256");
  hashing.write(specifier, "utf8");
  hashing.write("\0", "utf8");
  const readable = createReadStream(new URL(specifier));
  readable.on("error", resolve);
  hashing.on("error", resolve);
  hashing.on("readable", () => {
    const data = hashing.read();
    if (data === null) {
      resolve(new Error("missing readable data"));
    } else {
      resolve(data.toString("hex"));
    }
  });
});
