import { rejects as assertReject } from "node:assert/strict";
import lint from "./lint.mjs";

await assertReject(lint(import.meta.url));
