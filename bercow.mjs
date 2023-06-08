import { stdout } from "node:process";
import digest from "./plugin/digest.mjs";
import lint from "./plugin/lint.mjs";
import extract from "./plugin/extract.mjs";
import resolve from "./plugin/resolve.mjs";
import test from "./plugin/test.mjs";
import bercow from "./lib/index.mjs";
import { toDotFormat } from "./lib/graph.mjs";

Error.stackTraceLimit = Infinity;

const graph = await bercow(new Set([import.meta.url]), {
  plugin: {
    digest,
    lint,
    extract,
    resolve,
    test,
  },
  concurrency: "50%",
  cache: new URL(".bercow.json", import.meta.url),
});

stdout.write(toDotFormat(graph), "utf8");
