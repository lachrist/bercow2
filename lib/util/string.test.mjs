import { deepEqual as assertEqual } from "node:assert/strict";
import { compareString } from "./string.mjs";

assertEqual(compareString("a", "b"), -1);
assertEqual(compareString("b", "a"), 1);
assertEqual(compareString("a", "a"), 0);
