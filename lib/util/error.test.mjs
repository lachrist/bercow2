import { throws as assertThrow } from "node:assert/strict";
import { throwError } from "./error.mjs";

assertThrow(() => throwError(new Error("error")));
