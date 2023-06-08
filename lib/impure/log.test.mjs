import { deepEqual as assertEqual } from "node:assert/strict";
import { log } from "./log.mjs";

assertEqual(await log("message"), undefined);
