import { digestFile } from "./impure/digest.mjs";
import { catchEitherAsync, mapLeft } from "./util/either.mjs";

/** @type {(options: Object) => Promise<Digest>} */
export default async (_options) => async (specifier) => mapLeft(
  String,
  await catchEitherAsync(digestFile(specifier, { algorithm: "sha256", output: "hex" })),
);
