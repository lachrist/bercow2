import { deepEqual as assertEqual } from "node:assert/strict";
import { digest, digestFile } from "./digest.mjs";
import { readFile } from "node:fs/promises";

/** @type {import("./digest.mjs").DigestOptions} */
const options = { algorithm: "sha256", input: "utf8", output: "hex" };

assertEqual(
  await digestFile(new URL(import.meta.url), options),
  digest(
    `${import.meta.url}\0${await readFile(new URL(import.meta.url), "utf8")}`,
    options,
  )
);
