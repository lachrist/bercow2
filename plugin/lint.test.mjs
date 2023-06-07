import { ok as assert } from "node:assert/strict";
import lint from "./lint.mjs";

assert((await lint(import.meta.url)) instanceof Error);
