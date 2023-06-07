import digest from "./plugin/digest.mjs";
import lint from "./plugin/lint.mjs";
import extract from "./plugin/extract.mjs";
import resolve from "./plugin/resolve.mjs";
import test from "./plugin/test.mjs";
import bercow from "./lib/index.mjs";

console.log(
  await bercow(
    new Set([import.meta.url]),
    {
      digest,
      lint,
      extract,
      resolve,
      test,
    },
    {
      concurrency: "50%",
      cache: new URL("tmp/bercow.json", import.meta.url),
    }
  )
);
