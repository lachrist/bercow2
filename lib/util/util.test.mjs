import { deepEqual as assertEqual } from "node:assert/strict";
import { constant, identity, compose } from "./util.mjs";

assertEqual(constant(123)(), 123);

assertEqual(identity(123), 123);

assertEqual(compose((x) => x + 1, (x) => 2 * x)(3), 7);
