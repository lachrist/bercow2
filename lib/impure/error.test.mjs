import { deepEqual as assertEqual } from "node:assert/strict";
import { instantiateError } from "./error.mjs";

const serial = { name: "name", message: "message", stack: "stack" };

const { name, message, stack } = instantiateError(serial);
assertEqual({ name, message, stack }, serial);
