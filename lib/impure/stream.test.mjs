import { deepEqual as assertEqual } from "node:assert/strict";
import {
  createStream,
  readStream,
  writeStream,
  endStream,
} from "./stream.mjs";
import { makeJust, nothing } from "../util/maybe.mjs";

const stream = createStream();
{
  const promise = readStream(stream);
  writeStream(stream, 1);
  assertEqual(await promise, makeJust(1));
}
writeStream(stream, 2);
assertEqual(await readStream(stream), makeJust(2));
writeStream(stream, 3);
endStream(stream);
writeStream(stream, 4);
assertEqual(await readStream(stream), makeJust(3));
assertEqual(await readStream(stream), nothing);
